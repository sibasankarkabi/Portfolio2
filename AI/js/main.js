/* ═══════════════════════════════════════════════════════════
   SIBA SANKAR KABI — AI Portfolio JS
   ═══════════════════════════════════════════════════════════ */

'use strict';

const $ = id => document.getElementById(id);
const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ─── SECURITY ──────────────────────────────────────────── */
function escHtml(s) {
  if (!s) return '';
  return String(s).replace(/[&<>"']/g, m =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[m]));
}

/* ─── CUSTOM CURSOR ─────────────────────────────────────── */
(function initCursor() {
  if (REDUCED) return;
  const cur  = $('cur');
  const curR = $('curR');
  if (!cur || !curR) return;

  let mx = -200, my = -200, rx = -200, ry = -200;

  document.addEventListener('mousemove', e => {
    mx = e.clientX; my = e.clientY;
  }, { passive: true });

  (function loop() {
    rx += (mx - rx) * 0.15;
    ry += (my - ry) * 0.15;
    cur.style.left  = mx + 'px';
    cur.style.top   = my + 'px';
    curR.style.left = rx + 'px';
    curR.style.top  = ry + 'px';
    requestAnimationFrame(loop);
  })();

  document.addEventListener('mousedown', () => {
    cur.style.transform  = 'translate(-50%,-50%) scale(1.5)';
    curR.style.transform = 'translate(-50%,-50%) scale(0.7)';
  });
  document.addEventListener('mouseup', () => {
    cur.style.transform  = '';
    curR.style.transform = '';
  });

  function grow()   { curR.style.transform = 'translate(-50%,-50%) scale(1.5)'; }
  function shrink() { curR.style.transform = ''; }
  document.querySelectorAll('a,button,[onclick]').forEach(el => {
    el.addEventListener('mouseenter', grow);
    el.addEventListener('mouseleave', shrink);
  });
})();

/* ─── TICKER DUPLICATE ──────────────────────────────────── */
function initTicker() {
  const track = $('ticker');
  if (!track) return;
  track.innerHTML += track.innerHTML;
}

/* ─── SCROLL REVEAL ─────────────────────────────────────── */
function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;

  if (REDUCED) {
    els.forEach(el => el.classList.add('visible'));
    return;
  }

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('visible');
      obs.unobserve(e.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  els.forEach(el => obs.observe(el));
}

/* ─── COUNT-UP ANIMATION ────────────────────────────────── */
function animateCount(el, target, suffix, duration) {
  const start = performance.now();
  function tick(now) {
    const t = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3);
    const val = Math.round(target * eased);
    el.textContent = val + suffix;
    if (t < 1) requestAnimationFrame(tick);
    else el.textContent = target + suffix;
  }
  requestAnimationFrame(tick);
}

function initCountUp() {
  if (REDUCED) return;

  const obs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      obs.unobserve(e.target);
      const el     = e.target;
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || '';
      if (!isNaN(target)) animateCount(el, target, suffix, 1600);
    });
  }, { threshold: 0.6 });

  document.querySelectorAll('[data-count]').forEach(el => obs.observe(el));
}

/* ─── TIMELINE DRAW-IN ──────────────────────────────────── */
function initTimeline() {
  const tl = document.querySelector('.tl');
  if (!tl || REDUCED) return;

  // Animated blue line that grows over the static grey :before
  const line = document.createElement('div');
  line.className = 'tl-draw-line';
  tl.prepend(line);

  function updateLine() {
    const rect = tl.getBoundingClientRect();
    const progress = Math.min(Math.max((window.innerHeight * 0.8 - rect.top) / rect.height, 0), 1);
    line.style.height = (progress * 100) + '%';
  }

  window.addEventListener('scroll', updateLine, { passive: true });
  updateLine();
}

/* ─── QUICK SEARCH PILLS ────────────────────────────────── */
const FALLBACK_PILLS = [
  { label: 'Tell me about Baptist Healthcare', icon: 'ti-heart-plus' },
  { label: 'What is the GEM Award story?',    icon: 'ti-award' },
  { label: 'How do you use AI in design?',    icon: 'ti-robot' },
  { label: 'What roles are you open to?',     icon: 'ti-briefcase' },
  { label: 'Walk me through your process',    icon: 'ti-chart-dots-3' },
];

async function initPills() {
  const container = $('ais-pills');
  if (!container) return;

  let pills = FALLBACK_PILLS;
  try {
    const r  = await fetch('../data/siba.json');
    const db = await r.json();
    if (Array.isArray(db.quick_search_pills) && db.quick_search_pills.length) {
      pills = db.quick_search_pills;
    }
  } catch (_) {}

  container.innerHTML = pills.map(p => `
    <button class="ais-pill" onclick="pillSearch(${JSON.stringify(escHtml(p.label))})">
      <i class="ti ${p.icon || 'ti-sparkles'}" aria-hidden="true"></i>
      <span>${escHtml(p.label)}</span>
    </button>`
  ).join('');
}

function pillSearch(text) {
  const inp = $('ais-input');
  if (inp) { inp.value = text; inp.focus(); }
}

function focusSearch() {
  const strip = document.querySelector('.hero-search-strip');
  if (strip) strip.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => { const inp = $('ais-input'); if (inp) inp.focus(); }, 600);
}

/* ─── AI SEARCH ─────────────────────────────────────────── */
let _busy = false;

function parseResp(raw) {
  const cm = raw.match(/\|{0,3}CHIPS:(.*?)(?:\|\|\||$)/s);
  const fm = raw.match(/\|{0,3}FOLLOWUP:(.*?)(?:\|\|\||$)/s);
  const chips = cm ? cm[1].split(',').map(s => s.trim()).filter(Boolean) : [];
  const fus   = fm ? fm[1].split('|').map(s => s.trim()).filter(s => s.length > 4 && s.includes('?')) : [];
  let txt = raw
    .replace(/\|{0,3}CHIPS:.*?(?:\|\|\||$)/gs, '')
    .replace(/\|{0,3}FOLLOWUP:.*?(?:\|\|\||$)/gs, '')
    .replace(/\|{2,}/g, '').trim();
  txt = txt.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  txt = txt.split(/\n\n+/).map(p => p.trim()).filter(Boolean)
    .map(p => `<p>${p}</p>`).join('');
  return { txt, chips, fus: fus.slice(0, 3) };
}

async function runSearch() {
  const inp = $('ais-input');
  const btn = $('ais-btn');
  if (!inp || _busy) return;
  const q = inp.value.trim();
  if (!q) { inp.focus(); return; }

  _busy = true;
  btn.classList.add('loading');
  btn.disabled = true;

  openAiModal(q);

  let raw = null;
  try {
    const r = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: q }),
    });
    if (r.ok) {
      const d = await r.json();
      if (d.text) raw = d.text;
    }
  } catch (_) {}

  showAiAnswer(raw || `<p>For a live answer, reach Sankar directly — <strong>sksankar0@gmail.com</strong> or <a href="https://www.linkedin.com/in/siba-sankar-kabi-57134013" target="_blank">LinkedIn</a>.</p>`);
}

async function runModalSearch() {
  const inp = $('aim-input');
  const btn = $('aim-btn');
  if (!inp || _busy) return;
  const q = inp.value.trim();
  if (!q) { inp.focus(); return; }

  inp.value = '';
  _busy = true;
  btn.classList.add('loading');
  btn.disabled = true;

  $('aim-query-text').textContent     = q;
  $('aim-skeleton').style.display     = 'block';
  $('aim-answer-text').style.display  = 'none';
  $('aim-chips-wrap').style.display   = 'none';
  $('aim-followup-wrap').style.display = 'none';

  let raw = null;
  try {
    const r = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: q }),
    });
    if (r.ok) {
      const d = await r.json();
      if (d.text) raw = d.text;
    }
  } catch (_) {}

  showAiAnswer(raw || `<p>Reach Sankar at <strong>sksankar0@gmail.com</strong>.</p>`);
}

function openAiModal(q) {
  $('aim-query-text').textContent    = q;
  $('aim-skeleton').style.display    = 'block';
  $('aim-answer-text').style.display = 'none';
  $('aim-chips-wrap').style.display  = 'none';
  $('aim-followup-wrap').style.display = 'none';
  $('ai-modal-overlay').classList.add('open');
  $('ai-modal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  $('ai-modal-overlay').classList.remove('open');
  $('ai-modal').classList.remove('open');
  document.body.style.overflow = '';
  _busy = false;
  const btn = $('ais-btn');
  if (btn) { btn.classList.remove('loading'); btn.disabled = false; }
}

function showAiAnswer(raw) {
  _busy = false;
  [$('ais-btn'), $('aim-btn')].forEach(b => {
    if (b) { b.classList.remove('loading'); b.disabled = false; }
  });

  const { txt, chips, fus } = parseResp(raw);

  $('aim-skeleton').style.display = 'none';
  const ans = $('aim-answer-text');
  ans.innerHTML    = txt;
  ans.style.display = 'block';

  const chipsWrap = $('aim-chips-wrap');
  const chipsEl   = $('aim-chips');
  if (chips.length) {
    chipsEl.innerHTML = chips.map(c =>
      `<button class="aim-chip" onclick="pillSearch(${JSON.stringify(escHtml(c))});closeModal();setTimeout(runSearch,300)">${escHtml(c)}</button>`
    ).join('');
    chipsWrap.style.display = 'block';
  } else {
    chipsWrap.style.display = 'none';
  }

  const fuWrap = $('aim-followup-wrap');
  const fuEl   = $('aim-followups');
  if (fus.length) {
    fuEl.innerHTML = fus.map(f => `
      <button class="aim-fu" onclick="pillSearch(${JSON.stringify(escHtml(f))});closeModal();setTimeout(runSearch,300)">
        <div class="aim-fu-icon"><i class="ti ti-message-dots" aria-hidden="true"></i></div>
        <div class="aim-fu-text">${escHtml(f)}</div>
        <i class="ti ti-arrow-right aim-fu-arrow" aria-hidden="true"></i>
      </button>`).join('');
    fuWrap.style.display = 'block';
  } else {
    fuWrap.style.display = 'none';
  }
}

/* ─── AGENT PANEL ───────────────────────────────────────── */
const AGENT_CONFIGS = {
  casestudy: {
    name: 'Case Study Deep-Dive',
    html: () => `
      <div class="ap-title-row">
        <div class="ap-agent-icon" style="background:var(--blue-lt);color:var(--blue)"><i class="ti ti-briefcase" aria-hidden="true"></i></div>
        <div class="ap-title">Case Study<br><em>Deep-Dive</em></div>
        <div class="ap-subtitle">Pick a project and ask anything — the reasoning, the trade-offs, what worked and what didn't.</div>
      </div>
      <div class="ap-project-pills">
        <button class="ap-proj-pill active" onclick="selectProject(this,'Baptist Healthcare')">Baptist Healthcare</button>
        <button class="ap-proj-pill" onclick="selectProject(this,'TAMM Dubai')">TAMM Dubai</button>
        <button class="ap-proj-pill" onclick="selectProject(this,'Goodyear APAC')">Goodyear APAC</button>
        <button class="ap-proj-pill" onclick="selectProject(this,'Victoria’s Secret')">Victoria's Secret</button>
      </div>
      <div id="ap-cs-answer" style="display:none"></div>
      <div class="ap-search-row">
        <i class="ti ti-search" style="color:rgba(255,255,255,.3);font-size:16px;flex-shrink:0" aria-hidden="true"></i>
        <input type="text" id="ap-cs-input" placeholder="Ask about the Baptist Healthcare project…" autocomplete="off"/>
        <button id="ap-cs-btn" onclick="askCaseStudy()">
          <span class="btn-txt"><i class="ti ti-sparkles" aria-hidden="true"></i> Ask</span>
          <span class="btn-spinner"></span>
        </button>
      </div>`
  },
  recruiter: {
    name: 'Recruiter Fit Check',
    html: () => `
      <div class="ap-title-row">
        <div class="ap-agent-icon" style="background:var(--gold-lt);color:var(--gold)"><i class="ti ti-user-check" aria-hidden="true"></i></div>
        <div class="ap-title">Recruiter<br><em>Fit Agent</em></div>
        <div class="ap-subtitle">Paste a job description. The agent maps Sankar's full profile to the role — strengths, relevant projects, suggested interview angles.</div>
      </div>
      <textarea class="ap-jd-area" id="ap-jd-input" placeholder="Paste the job description here…" rows="6"></textarea>
      <button class="ap-submit-btn" id="ap-jd-btn" onclick="checkFit()">
        <span class="btn-txt"><i class="ti ti-clipboard-check" aria-hidden="true"></i> Check fit</span>
        <span class="btn-spinner"></span>
      </button>
      <div id="ap-rec-answer" style="margin-top:24px;display:none"></div>`
  },
  decisions: {
    name: 'Design Decision Agent',
    html: () => `
      <div class="ap-title-row">
        <div class="ap-agent-icon" style="background:#EDE9E0;color:var(--ink2)"><i class="ti ti-bulb" aria-hidden="true"></i></div>
        <div class="ap-title">Design<br><em>Decisions</em></div>
        <div class="ap-subtitle">Ask why Sankar made specific design choices — layout, flow, components, colour. Get the trade-offs and reasoning behind the work.</div>
      </div>
      <div id="ap-dec-answer" style="display:none"></div>
      <div class="ap-search-row">
        <i class="ti ti-search" style="color:rgba(255,255,255,.3);font-size:16px;flex-shrink:0" aria-hidden="true"></i>
        <input type="text" id="ap-dec-input" placeholder="Why Morphism for Baptist Healthcare?" autocomplete="off"/>
        <button id="ap-dec-btn" onclick="askDecision()">
          <span class="btn-txt"><i class="ti ti-sparkles" aria-hidden="true"></i> Ask</span>
          <span class="btn-spinner"></span>
        </button>
      </div>`
  },
  workflow: {
    name: 'AI Workflow Demo',
    html: () => `
      <div class="ap-title-row">
        <div class="ap-agent-icon" style="background:#E1F5EE;color:#0F6E56"><i class="ti ti-robot" aria-hidden="true"></i></div>
        <div class="ap-title">AI Workflow<br><em>Demo</em></div>
        <div class="ap-subtitle">Pick a design challenge and see Sankar's exact AI-augmented process — step by step.</div>
      </div>
      <div class="ap-scenario-grid">
        <button class="ap-scenario active" onclick="selectScenario(this,'Design System Audit')">Design System Audit</button>
        <button class="ap-scenario" onclick="selectScenario(this,'User Research Synthesis')">Research Synthesis</button>
        <button class="ap-scenario" onclick="selectScenario(this,'RFP Presentation')">RFP Presentation</button>
        <button class="ap-scenario" onclick="selectScenario(this,'Rapid Prototyping')">Rapid Prototyping</button>
      </div>
      <div id="ap-wf-answer" style="display:none"></div>
      <div class="ap-search-row">
        <i class="ti ti-search" style="color:rgba(255,255,255,.3);font-size:16px;flex-shrink:0" aria-hidden="true"></i>
        <input type="text" id="ap-wf-input" placeholder="Ask about the Design System Audit workflow…" autocomplete="off"/>
        <button id="ap-wf-btn" onclick="askWorkflow()">
          <span class="btn-txt"><i class="ti ti-sparkles" aria-hidden="true"></i> Ask</span>
          <span class="btn-spinner"></span>
        </button>
      </div>`
  },
  leadership: {
    name: 'Leadership Agent',
    html: () => `
      <div class="ap-title-row">
        <div class="ap-agent-icon" style="background:var(--blue-lt);color:var(--blue)"><i class="ti ti-users" aria-hidden="true"></i></div>
        <div class="ap-title">Leadership<br><em>Agent</em></div>
        <div class="ap-subtitle">Ask how Sankar runs his 24-person studio — critique culture, career pathing, stakeholder management, RFP strategy.</div>
      </div>
      <div id="ap-ld-answer" style="display:none"></div>
      <div class="ap-search-row">
        <i class="ti ti-search" style="color:rgba(255,255,255,.3);font-size:16px;flex-shrink:0" aria-hidden="true"></i>
        <input type="text" id="ap-ld-input" placeholder="How do you handle design critiques with stakeholders?" autocomplete="off"/>
        <button id="ap-ld-btn" onclick="askLeadership()">
          <span class="btn-txt"><i class="ti ti-sparkles" aria-hidden="true"></i> Ask</span>
          <span class="btn-spinner"></span>
        </button>
      </div>`
  },
};

let _selProject  = 'Baptist Healthcare';
let _selScenario = 'Design System Audit';

function selectProject(btn, name) {
  document.querySelectorAll('.ap-proj-pill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  _selProject = name;
  const inp = $('ap-cs-input');
  if (inp) inp.placeholder = `Ask about the ${name} project…`;
}

function selectScenario(btn, name) {
  document.querySelectorAll('.ap-scenario').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  _selScenario = name;
  const inp = $('ap-wf-input');
  if (inp) inp.placeholder = `Ask about the ${name} workflow…`;
}

async function _agentQuery(inputId, btnId, answerId, overrideQ) {
  const btn   = $(btnId);
  const ansEl = $(answerId);
  if (!btn || _busy) return;

  const inp = inputId ? $(inputId) : null;
  const q   = overrideQ || (inp ? inp.value.trim() : '');
  if (!q) { if (inp) inp.focus(); return; }

  _busy = true;
  btn.classList.add('loading');
  btn.disabled = true;
  if (ansEl) {
    ansEl.innerHTML = `<div class="ap-skeleton"><div class="ap-sk ap-sk-80"></div><div class="ap-sk ap-sk-100"></div><div class="ap-sk ap-sk-70"></div><div class="ap-sk ap-sk-90"></div></div>`;
    ansEl.style.display = 'block';
  }

  let raw = null;
  try {
    const r = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: q }),
    });
    if (r.ok) {
      const d = await r.json();
      if (d.text) raw = d.text;
    }
  } catch (_) {}

  btn.classList.remove('loading');
  btn.disabled = false;
  _busy = false;

  if (ansEl) {
    const { txt } = parseResp(raw || `<p>For a full answer, email Sankar at <strong>sksankar0@gmail.com</strong>.</p>`);
    ansEl.innerHTML = `<div class="ap-answer">${txt}</div>`;
    ansEl.style.display = 'block';
  }
  if (inp) inp.value = '';
}

function askCaseStudy() {
  const inp = $('ap-cs-input');
  const q   = (inp && inp.value.trim()) || `Tell me about the ${_selProject} project — the challenge, key decisions, and outcomes.`;
  _agentQuery('ap-cs-input', 'ap-cs-btn', 'ap-cs-answer', q);
}

function checkFit() {
  const jd = $('ap-jd-input') && $('ap-jd-input').value.trim();
  if (!jd) { if ($('ap-jd-input')) $('ap-jd-input').focus(); return; }
  const q = `I'm a recruiter. Here's a job description. How well does Siba Sankar Kabi match this role? Give me: top 3 matching strengths, 2 most relevant projects, and 3 sharp interview questions.\n\nJD:\n${jd.slice(0, 2000)}`;
  _agentQuery(null, 'ap-jd-btn', 'ap-rec-answer', q);
}

function askDecision() {
  _agentQuery('ap-dec-input', 'ap-dec-btn', 'ap-dec-answer');
}

function askWorkflow() {
  const inp = $('ap-wf-input');
  const q   = (inp && inp.value.trim()) || `Walk me through Sankar's AI-augmented workflow for ${_selScenario} — which tools, in what order, and why.`;
  _agentQuery('ap-wf-input', 'ap-wf-btn', 'ap-wf-answer', q);
}

function askLeadership() {
  _agentQuery('ap-ld-input', 'ap-ld-btn', 'ap-ld-answer');
}

function openAgent(type) {
  const cfg = AGENT_CONFIGS[type];
  if (!cfg) return;
  $('ap-badge-name').textContent = cfg.name;
  $('ap-body').innerHTML         = cfg.html();
  $('agent-panel-overlay').classList.add('open');
  $('agent-panel').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeAgentPanel() {
  $('agent-panel-overlay').classList.remove('open');
  $('agent-panel').classList.remove('open');
  document.body.style.overflow = '';
}

/* ─── NAV SCROLL HIGHLIGHT ──────────────────────────────── */
function initNavHighlight() {
  window.addEventListener('scroll', () => {
    const y = window.scrollY + 100;
    document.querySelectorAll('section[id]').forEach(sec => {
      const lnk = document.querySelector(`.nav-links a[href="#${sec.id}"]`);
      if (lnk) lnk.classList.toggle('active', y >= sec.offsetTop && y < sec.offsetTop + sec.offsetHeight);
    });
  }, { passive: true });
}

/* ─── KEYBOARD ──────────────────────────────────────────── */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if ($('ai-modal')?.classList.contains('open'))      closeModal();
    else if ($('agent-panel')?.classList.contains('open')) closeAgentPanel();
  }
  if (e.key === 'Enter') {
    const id = document.activeElement?.id;
    if (id === 'ais-input')  runSearch();
    if (id === 'aim-input')  runModalSearch();
    if (id === 'ap-cs-input') askCaseStudy();
    if (id === 'ap-dec-input') askDecision();
    if (id === 'ap-wf-input') askWorkflow();
    if (id === 'ap-ld-input') askLeadership();
  }
});

/* ─── INIT ──────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initTicker();
  initReveal();
  initCountUp();
  initTimeline();
  initPills();
  initNavHighlight();
});
