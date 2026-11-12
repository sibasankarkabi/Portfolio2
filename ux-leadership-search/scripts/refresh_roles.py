#!/usr/bin/env python3
"""Daily refresh for data/roles.json.

1. Checks every open role's link against the employer's own job board and
   marks filled, removed or aggregator-only postings as closed.
2. Searches the company boards in data/search-config.json for new design
   leadership roles, keeping only direct apply links.
3. Drops roles whose disclosed pay tops out at or below minCtcLpa.

Standard library only, so it runs on a bare GitHub Actions runner.
Usage: python3 scripts/refresh_roles.py [--dry-run]
"""
import concurrent.futures as cf
import datetime as dt
import html
import json
import re
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
ROLES = ROOT / "data" / "roles.json"
CONFIG = json.loads((ROOT / "data" / "search-config.json").read_text())
TODAY = dt.date.today().isoformat()
UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9"}

# Approximate rates to INR, only used to compare disclosed pay with minCtcLpa.
TO_INR = {"INR": 1, "USD": 84, "EUR": 91, "GBP": 108, "CHF": 95, "SEK": 8, "DKK": 12, "PLN": 21, "CAD": 61, "AUD": 55, "SGD": 63}

AGGREGATORS = re.compile(r"glassdoor\.|indeed\.|workingnomads\.|themuse\.com|builtin[a-z]*\.|linkedin\.com|naukri\.com|instahyre\.|wellfound\.|uxjobs\.|simplyhired\.|ziprecruiter\.", re.I)
CLOSED_TEXT = re.compile(
    r"has been filled|no longer (available|accepting|open|active|posted)|position (has been )?(filled|closed)|"
    r"job (is )?(closed|expired|not found)|this job (has )?expired|page (was|has been) (moved|deleted|removed)|does not exist|"
    r"job you are (looking|trying)[^.]{0,40}(filled|not available|no longer)|requisition is (closed|no longer)|"
    r"we can.t (seem to )?find (the|this) (page|job)|404 not found|is not accepting applications", re.I)


class Gone(Exception):
    pass


def fetch(url, data=None, headers=None, as_json=True):
    req = urllib.request.Request(url, data=data, headers={**UA, **(headers or {})})
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            body = r.read().decode("utf-8", "replace")
            return r.status, r.geturl(), (json.loads(body) if as_json else body)
    except urllib.error.HTTPError as e:
        if e.code in (404, 410):
            raise Gone(f"the employer took the posting down (HTTP {e.code})")
        raise


def lpa(amount, currency, interval="year"):
    if amount is None:
        return None
    rate = TO_INR.get((currency or "INR").upper())
    if rate is None:
        return None
    if interval and interval.lower().startswith(("month", "per-month")):
        amount *= 12
    return round(amount * rate / 100000, 1)


def pay_text(lo, hi, currency):
    if hi is None:
        return None
    f = (lambda v: f"{v:,.0f}") if currency != "INR" else (lambda v: f"{v / 100000:.1f}L")
    return f"{currency} {f(lo)}–{f(hi)}" if lo else f"{currency} up to {f(hi)}"


# ---------- per-board link checks: return dict with optional salary info, or raise Gone ----------

def gh_parts(url):
    # EU-hosted boards (job-boards.eu.greenhouse.io) have no public API, so they fall through to check_page.
    m = re.search(r"https://(?:job-boards|boards)\.greenhouse\.io/([^/]+)/jobs/(\d+)", url)
    return m and m.groups()


def check_greenhouse(url):
    board, jid = gh_parts(url)
    _, _, d = fetch(f"https://boards-api.greenhouse.io/v1/boards/{board}/jobs/{jid}?pay_transparency=true")
    return gh_salary(d)


def gh_salary(d):
    for r in d.get("pay_input_ranges") or []:
        lo, hi, cur = r.get("min_cents"), r.get("max_cents"), r.get("currency_type")
        if hi:
            return {"payMaxLpa": lpa(hi / 100, cur), "pay": pay_text(lo and lo / 100, hi / 100, cur)}
    return {}


def check_lever(url):
    m = re.search(r"jobs\.(eu\.)?lever\.co/([^/]+)/([0-9a-f-]{36})", url)
    _, _, d = fetch(f"https://api.{m.group(1) or ''}lever.co/v0/postings/{m.group(2)}/{m.group(3)}")
    return lever_salary(d)


def lever_salary(d):
    s = d.get("salaryRange") or {}
    if s.get("max"):
        return {"payMaxLpa": lpa(s["max"], s.get("currency"), s.get("interval")), "pay": pay_text(s.get("min"), s["max"], s.get("currency"))}
    return {}


ASHBY_CACHE = {}


def ashby_board(org):
    if org not in ASHBY_CACHE:
        _, _, d = fetch(f"https://api.ashbyhq.com/posting-api/job-board/{org}?includeCompensation=true")
        ASHBY_CACHE[org] = d.get("jobs", [])
    return ASHBY_CACHE[org]


def ashby_salary(j):
    for c in ((j.get("compensation") or {}).get("summaryComponents") or []):
        if c.get("compensationType") == "Salary" and c.get("maxValue"):
            cur = c.get("currencyCode")
            return {"payMaxLpa": lpa(c["maxValue"], cur, c.get("interval", "year").replace("1 ", "")), "pay": pay_text(c.get("minValue"), c["maxValue"], cur)}
    return {}


def check_ashby(url):
    m = re.search(r"jobs\.ashbyhq\.com/([^/]+)/([0-9a-f-]{36})", url)
    for j in ashby_board(m.group(1)):
        if j.get("id") == m.group(2):
            return ashby_salary(j)
    raise Gone("not on Ashby board")


def workday_detail(tenant, wd, site, path):
    try:
        _, _, d = fetch(f"https://{tenant}.{wd}.myworkdayjobs.com/wday/cxs/{tenant}/{site}{path}", headers={"Accept": "application/json"})
    except urllib.error.HTTPError as e:
        # Workday answers 403 "permission denied" for postings that have been taken down; live ones on the same site return 200.
        if e.code == 403:
            raise Gone("Workday: posting removed")
        raise
    return d


def check_workday(url):
    m = re.search(r"https://([^.]+)\.(wd\d+)\.myworkdayjobs\.com/(?:[a-z]{2}-[A-Z]{2}/)?([^/]+)(/job/.+)", url)
    d = workday_detail(*m.groups())
    info = d.get("jobPostingInfo") or {}
    if not info.get("canApply", False):
        raise Gone("Workday: applications closed")
    return {}


def check_smartrecruiters(url):
    m = re.search(r"jobs\.smartrecruiters\.com/([^/]+)/(\d+)", url)
    _, _, d = fetch(f"https://api.smartrecruiters.com/v1/companies/{m.group(1)}/postings/{m.group(2)}")
    if d.get("active") is False:
        raise Gone("SmartRecruiters: inactive")
    return {}


def check_eightfold(url):
    u = urllib.parse.urlparse(url)
    jid = re.search(r"/job/(\d+)", u.path).group(1)
    domain = "microsoft.com" if "microsoft" in u.netloc else u.netloc.split(".")[0] + ".com"
    fetch(f"https://{u.netloc}/api/apply/v2/jobs/{jid}?domain={domain}")
    return {}


def check_rippling(url):
    m = re.search(r"ats\.rippling\.com/([^/]+)/jobs/([0-9a-f-]{36})", url)
    fetch(f"https://ats.rippling.com/api/v2/board/{m.group(1)}/jobs/{m.group(2)}")
    return {}


def check_recruitee(url):
    m = re.search(r"https://([^.]+)\.recruitee\.com/o/([^/?#]+)", url)
    _, _, d = fetch(f"https://{m.group(1)}.recruitee.com/api/offers/{m.group(2)}")
    if (d.get("offer") or {}).get("status", "published") != "published":
        raise Gone("Recruitee: not published")
    return {}


def check_page(url):
    status, final, body = fetch(url, as_json=False)
    text = html.unescape(re.sub(r"<script.*?</script>|<style.*?</style>|<[^>]+>", " ", body, flags=re.S))
    if CLOSED_TEXT.search(text[:20000]):
        raise Gone("page says the job is closed")
    if re.search(r"[?&]error=true|/error|errorpage|/404", final, re.I):
        raise Gone("redirected to an error page")
    # A job link that lands on a bare careers home or listing page means the posting is gone.
    if urllib.parse.urlparse(final).path.strip("/") == "" and urllib.parse.urlparse(url).path.strip("/") != "":
        raise Gone("redirected to the careers home page")
    return {}


def check(url):
    if not url:
        raise Gone("no link")
    if AGGREGATORS.search(url):
        raise Gone("aggregator link, not the employer's own posting")
    if urllib.parse.urlparse(url).path.strip("/") == "":
        raise Gone("careers home page, not a specific job")
    if gh_parts(url):
        return check_greenhouse(url)
    if "lever.co/" in url:
        return check_lever(url)
    if "ashbyhq.com/" in url:
        return check_ashby(url)
    if "myworkdayjobs.com/" in url:
        return check_workday(url)
    if "smartrecruiters.com/" in url:
        return check_smartrecruiters(url)
    if "eightfold.ai/" in url or "apply.careers.microsoft.com/" in url:
        return check_eightfold(url)
    if "ats.rippling.com/" in url:
        return check_rippling(url)
    if ".recruitee.com/o/" in url:
        return check_recruitee(url)
    return check_page(url)


# ---------- discovery ----------

TITLE_IN = re.compile(CONFIG["titleInclude"], re.I)
TITLE_OUT = re.compile(CONFIG["titleExclude"], re.I)
REGIONS = [(k, re.compile(v, re.I)) for k, v in CONFIG["regions"].items()]


def region_of(location):
    for key, rx in REGIONS:
        if rx.search(location or ""):
            return key
    return None


def fit_of(title):
    t = title.lower()
    if re.search(r"head of|director|vp|vice president", t):
        return 4
    if re.search(r"manager|principal", t):
        return 4 if "design" in t or "ux" in t else 3
    return 3


def slug(*parts):
    return re.sub(r"[^a-z0-9]+", "-", " ".join(parts).lower()).strip("-")[:80]


def discover_greenhouse(board):
    _, _, d = fetch(f"https://boards-api.greenhouse.io/v1/boards/{board}/jobs?content=false")
    for j in d.get("jobs", []):
        name = j.get("company_name") or ""
        yield {"company": board.title() if not name or name.lower().startswith("careers") else name, "title": j["title"], "location": (j.get("location") or {}).get("name", ""),
               "url": j["absolute_url"], "source": "Greenhouse", "posted": (j.get("first_published") or j.get("updated_at") or "")[:10]}


def discover_lever(board):
    _, _, d = fetch(f"https://api.lever.co/v0/postings/{board}?mode=json")
    for j in d:
        cats = j.get("categories") or {}
        loc = ", ".join(cats.get("allLocations") or [cats.get("location") or ""])
        yield {"company": board.title(), "title": j["text"], "location": loc, "url": j["hostedUrl"], "source": "Lever",
               "posted": dt.datetime.utcfromtimestamp(j["createdAt"] / 1000).date().isoformat() if j.get("createdAt") else "", **lever_salary(j)}


def discover_ashby(org):
    for j in ashby_board(org):
        if not j.get("isListed", True):
            continue
        loc = ", ".join([j.get("location") or ""] + [s.get("location", "") for s in j.get("secondaryLocations") or []])
        if j.get("isRemote") and not loc:
            loc = "Remote"
        yield {"company": org.title(), "title": j["title"], "location": loc, "url": j["jobUrl"], "source": "Ashby",
               "posted": (j.get("publishedAt") or "")[:10], **ashby_salary(j)}


WORKDAY_QUERIES = ["product design manager", "design director", "head of design", "UX manager", "principal designer"]


def discover_workday(spec):
    tenant, wd, site = spec.split("/")
    base = f"https://{tenant}.{wd}.myworkdayjobs.com/wday/cxs/{tenant}/{site}"
    seen = set()
    for q in WORKDAY_QUERIES:
        body = json.dumps({"appliedFacets": {}, "limit": 20, "offset": 0, "searchText": q}).encode()
        _, _, d = fetch(base + "/jobs", data=body, headers={"Content-Type": "application/json", "Accept": "application/json"})
        for j in d.get("jobPostings", []):
            path = j.get("externalPath")
            if not path or path in seen or not TITLE_IN.search(j["title"]) or TITLE_OUT.search(j["title"]):
                continue
            seen.add(path)
            # Search results only say "3 Locations", so read the posting for the real ones.
            try:
                info = workday_detail(tenant, wd, site, path).get("jobPostingInfo") or {}
            except Exception:
                continue
            if not info.get("canApply", True):
                continue
            loc = ", ".join([info.get("location") or ""] + (info.get("additionalLocations") or []))
            yield {"company": tenant.upper() if len(tenant) <= 4 else tenant.title(), "title": j["title"], "location": loc,
                   "url": info.get("externalUrl") or f"https://{tenant}.{wd}.myworkdayjobs.com/{site}{path}",
                   "source": "Workday", "posted": info.get("startDate", "")}


def discover():
    b = CONFIG["boards"]
    jobs = [(discover_greenhouse, (x,)) for x in b.get("greenhouse", [])] + \
           [(discover_workday, (x,)) for x in b.get("workday", [])] + \
           [(discover_lever, (x,)) for x in b.get("lever", [])] + \
           [(discover_ashby, (x,)) for x in b.get("ashby", [])]
    found, errors = [], []

    def run(fn, args):
        try:
            return list(fn(*args))
        except Exception as e:  # one broken board shouldn't stop the run
            errors.append(f"{args[0]}: {e}")
            return []

    with cf.ThreadPoolExecutor(12) as ex:
        for rows in ex.map(lambda f: run(*f), jobs):
            for r in rows:
                r["region"] = region_of(r["location"])
                if r["region"] and TITLE_IN.search(r["title"]) and not TITLE_OUT.search(r["title"]):
                    found.append(r)
    return found, errors


def pay_too_low(info):
    m = info.get("payMaxLpa")
    return m is not None and m <= CONFIG["minCtcLpa"]


def main(dry):
    data = json.loads(ROLES.read_text())
    roles = data["roles"]
    open_roles = [r for r in roles if r.get("status") != "closed"]

    def verify(r):
        try:
            return r, check(r.get("url")), None
        except Gone as e:
            return r, None, str(e)
        except Exception as e:  # network hiccup or site blocking bots: keep the role, note it
            return r, {}, f"could not verify ({type(e).__name__})"

    closed, unverified = 0, 0
    with cf.ThreadPoolExecutor(10) as ex:
        for r, info, why in ex.map(verify, open_roles):
            if info is None:
                closed += 1
                r["status"] = "closed"
                r["closedOn"] = TODAY
                r["closedReason"] = why
                r["log"] = (r.get("log", "") + f"\n{TODAY}: auto-closed: {why}").strip()
                continue
            r["checkedOn"] = TODAY
            if why:
                unverified += 1
                r["linkNote"] = why
            else:
                r.pop("linkNote", None)
            r.update({k: v for k, v in info.items() if v is not None})
            if pay_too_low(r):
                closed += 1
                r["status"] = "closed"
                r["closedOn"] = TODAY
                r["closedReason"] = f"pay {r.get('pay')} is at or below your {CONFIG['minCtcLpa']} LPA"
                r["log"] = (r.get("log", "") + f"\n{TODAY}: auto-closed: pay {r.get('pay')} is at or below {CONFIG['minCtcLpa']} LPA").strip()

    def same_job(company, title):
        return slug(company.split()[0], title)

    known = {r.get("url") for r in roles} | {same_job(r["company"], r["title"]) for r in roles}
    known_ids = {r["id"] for r in roles}
    found, errors = discover()
    added = 0
    for j in found:
        if j["url"] in known or same_job(j["company"], j["title"]) in known or pay_too_low(j):
            continue
        rid = slug(j["company"], j["title"], j["url"][-8:])
        if rid in known_ids:
            continue
        known |= {j["url"], same_job(j["company"], j["title"])}
        known_ids.add(rid)
        added += 1
        roles.append({"id": rid, "addedOn": TODAY, "checkedOn": TODAY, "company": j["company"], "title": j["title"],
                      "location": j["location"], "region": j["region"], "url": j["url"], "source": j["source"],
                      "posted": j["posted"], "fit": fit_of(j["title"]), "status": "new", "autoFound": True,
                      **({"pay": j["pay"], "payMaxLpa": j["payMaxLpa"]} if j.get("pay") else {}),
                      "why": "Found automatically on the company's own job board. Read the posting and set the fit yourself.",
                      "log": f"{TODAY}: found on {j['company']} {j['source']} board"})

    # Drop auto-found roles that have been closed for 30+ days; keep anything you curated.
    cutoff = (dt.date.today() - dt.timedelta(days=30)).isoformat()
    data["roles"] = [r for r in roles if not (r.get("autoFound") and r.get("status") == "closed" and r.get("closedOn", TODAY) < cutoff)]
    data["updatedOn"] = TODAY
    data["lastScanSummary"] = f"{added} new, {closed} closed, {unverified} couldn't be verified"
    print(data["lastScanSummary"])
    for e in errors:
        print("board error:", e, file=sys.stderr)
    if not dry:
        ROLES.write_text(json.dumps(data, indent=1, ensure_ascii=False) + "\n")


if __name__ == "__main__":
    main("--dry-run" in sys.argv)
