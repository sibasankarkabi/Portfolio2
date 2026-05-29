/* ═══════════════════════════════════════════════════════════
   sankarkabi.co.in — Main JS
   Reads from data/siba.json — edit that file to update content
   ═══════════════════════════════════════════════════════════ */

let DB = null;
let busy = false;

const $ = id => document.getElementById(id);

/* ── SECURITY UTILITIES ────────────────────────────────────────────────── */

function escapeHtml(str) {
  if (str == null) return '';
  const map = { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' };
  return String(str).replace(/[&<>"']/g, m => map[m]);
}

// Validate that a URL is safe to use in href attributes.
// Only allows https:// http:// mailto: tel: and relative paths.
// Blocks javascript: data: vbscript: and other dangerous schemes.
function safeUrl(url) {
  if (!url || typeof url !== 'string') return '#';
  const trimmed = url.trim();
  if (/^(https?:\/\/|mailto:|tel:|\/|#)/i.test(trimmed)) return trimmed;
  return '#';
}

// Sanitize raw API text at the point it enters our system.
// Only escapes HTML entities — does NOT convert to HTML yet.
// parseResp() handles the markdown→HTML conversion afterwards.
// Why here and not in parseResp(): localAnswer() returns pre-built HTML
// that must pass through parseResp() unchanged. API text is plain text
// that needs escaping. Sanitizing at the boundary keeps both paths clean.
function sanitizeApiText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Rate-limit guard: minimum ms between AI search calls.
// Prevents rapid-fire abuse of the /api/search endpoint.
const SEARCH_THROTTLE_MS = 1500;
let _lastSearchTs = 0;

// Maximum characters accepted from the search input.
// Long enough for a full job description paste; short enough to prevent abuse.
const SEARCH_MAX_CHARS = 3000;

/* ── LOAD KNOWLEDGE BASE ── */
async function loadDB() {
  try {
    const r = await fetch('data/siba.json');
    DB = await r.json();
    buildPage();
  } catch (e) {
    console.error('Could not load data/siba.json:', e);
  }
}

/* ── BUILD PAGE FROM DB ── */
function buildPage() {
  buildNav();
  buildHero();
  buildPills();
  buildAbout();
  buildNumbers();
  buildWork();
  buildPortfolio();
  buildTestimonials();
  buildContact();
  buildFooter();
  initReveal();
  initSkillBars();
  initTicker();
}

function buildNav() {
  const d = DB.identity;
  document.title = `${d.name} — UX Design Leader, ${d.location.split(',')[0]}`;
}

function buildHero() {
  const d = DB.identity;
  const cr = DB.current_role;
  if ($('hero-kicker')) $('hero-kicker').textContent = cr.studio.replace('Bengaluru ', '') + ' · Capgemini';
  if ($('hero-name'))   $('hero-name').innerHTML = `${d.name.split(' ')[0]}<br><em>${d.name.split(' ')[1]}</em>&nbsp;${d.name.split(' ')[2]}`;
  if ($('hero-company')) $('hero-company').textContent = `${d.company} · ${cr.since.split(' ').slice(-2).join(' ')} – Present`;
  if ($('hero-avail-text')) $('hero-avail-text').textContent = 'Open to leadership roles';
  if ($('hero-intro'))  $('hero-intro').innerHTML = DB.philosophy.approach.split('.')[0] + '. Enterprise UX across healthcare, automotive, fashion &amp; government.';
}

function buildPills() {
  const row = $('pill-row');
  if (!row || !DB.quick_search_pills) return;
  row.innerHTML = DB.quick_search_pills.map(p =>
    `<button class="pill" onclick="qSearch(this)"><i class="ti ${p.icon}" aria-hidden="true"></i>${p.label}</button>`
  ).join('');
}

function buildAbout() {
  const p = DB.philosophy;
  if ($('about-quote')) $('about-quote').textContent = `"${p.ai_belief}"`;
  if ($('about-body'))  $('about-body').textContent = `Running a studio at Capgemini Bengaluru. Before that — Oracle, gaming startups, fashion e-commerce, maternity brands. Every project, the same north star: make it feel inevitable.`;

  if ($('skill-stack')) {
    $('skill-stack').innerHTML = DB.skills.proficiency.map(s =>
      `<div class="skill-row">
        <div class="skill-head"><span class="skill-name">${s.name}</span><span class="skill-pct">${s.pct}%</span></div>
        <div class="skill-track"><div class="skill-bar" data-pct="${s.pct}"></div></div>
      </div>`
    ).join('');
  }

  if ($('design-tools')) $('design-tools').innerHTML = DB.skills.design_tools.map(t => `<span class="tag">${t}</span>`).join('');

  const aiToolsEl = $('ai-tools');
  if (aiToolsEl) aiToolsEl.innerHTML = DB.skills.ai_tools.map(t => `<span class="tag" title="${t.use}">${t.name}</span>`).join('');

  if ($('cred-list')) {
    const icons = ['ti-certificate','ti-brand-google','ti-robot','ti-refresh','ti-cpu','ti-message-dots'];
    $('cred-list').innerHTML = DB.certifications.map((c, i) =>
      `<div class="cred"><i class="ti ${icons[i] || 'ti-check'}" aria-hidden="true"></i>${c}</div>`
    ).join('');
  }
}

function buildNumbers() {
  const m = DB.impact_metrics;
  const items = [
    { n: m.rfp_acv_increase,         l: 'Growth in annual contract value from RFP strategy', award: true },
    { n: m.dev_time_reduction,        l: 'Less front-end build time — design systems at Goodyear & BHSF', award: false },
    { n: m.patient_bookings_increase, l: 'More patient bookings after the Baptist Healthcare redesign', award: false },
    { n: m.ideation_speed_increase,   l: 'Faster ideation using Figma Make, Claude and UIZard', award: false }
  ];
  if ($('num-grid')) {
    $('num-grid').innerHTML = items.map((it, i) =>
      `<div class="num-card r${i ? ' d'+i : ''}">
        <div class="num-n">${it.n.replace('%','<em>%</em>').replace('+','<em>+</em>')}</div>
        <div class="num-l">${it.l}</div>
        ${it.award ? `<div class="num-award"><i class="ti ti-award" aria-hidden="true"></i>GEM Award</div>` : ''}
      </div>`
    ).join('');
  }
}

function buildWork() {
  const featured = DB.projects.filter(p => p.featured);
  const rest     = DB.projects.filter(p => !p.featured && p.image).slice(0, 3);
  let html = '';
  featured.forEach(p => { html += workCard(p, true); });
  rest.forEach((p, i) => { html += workCard(p, false, i); });
  if ($('work-grid')) $('work-grid').innerHTML = html;
}

const CS_THUMBS = {
  baptist: 'images/CaseStudy/Baptist.jpg',
  tamm:    'images/CaseStudy/Tamm.png',
  goodyear:'images/CaseStudy/Goodyear.png',
  vs:      'images/CaseStudy/VS.png',
};

function workCard(p, wide, delay = 0) {
  const thumb = CS_THUMBS[p.id] || p.image;
  const imgHtml = thumb
    ? `<img src="${thumb}" alt="${p.name}" loading="lazy"/>`
    : `<div class="thumb-grad"></div>`;
  const hasFiles = !!CASE_STUDY_FILES[p.id];
  const clickFn  = hasFiles ? `openCaseStudyFiles('${p.id}')` : `openProjectModal('${p.id}')`;
  return `
  <div class="card${wide ? ' wide' : ''} r${delay ? ' d'+delay : ''}" data-project-id="${p.id}" onclick="${clickFn}">
    <div class="card-thumb">
      ${imgHtml}
      <div class="thumb-grad"></div>
      <span class="thumb-chip">${p.tags.slice(0,2).join(' · ')}</span>
      ${hasFiles ? `<span class="thumb-cs-badge"><i class="ti ti-files"></i> Case Study</span>` : ''}
      <a class="card-arrow" href="${p.behance || '#'}" ${p.behance ? 'target="_blank"' : ''} onclick="event.stopPropagation()">
        <i class="ti ti-arrow-up-right" aria-hidden="true"></i>
      </a>
    </div>
    <div class="card-body">
      <div class="card-client">${p.client}</div>
      <div class="card-title">${p.name}</div>
      <div class="card-desc">${p.summary}</div>
      <div class="card-tags">${p.tags.map(t => `<span class="ctag">${t}</span>`).join('')}</div>
    </div>
  </div>`;
}

function buildPortfolio() {
  const icons = ['ti-device-mobile','ti-star','ti-briefcase','ti-building-community','ti-plant','ti-app-window','ti-shopping-cart','ti-plane','ti-layout-dashboard','ti-vector','ti-icons','ti-file-description'];
  const items = (DB.portfolio_items || []).filter(item => item.image || item.link);
  if ($('port-grid')) {
    $('port-grid').innerHTML = items.map((item, i) => `
      <div class="pcard r" data-cat="${item.cat}">
        ${item.image
          ? `<img src="${item.image}" alt="${item.name}" loading="lazy"/>`
          : `<div class="pcard-ph"><i class="ti ${icons[i % icons.length]}" aria-hidden="true"></i></div>`}
        <div class="pcard-over">
          <div class="pcard-name">${item.name}</div>
          <div class="pcard-type">${item.type}</div>
          ${item.link ? `<a href="${item.link}" target="_blank" class="pcard-link"><i class="ti ti-external-link" aria-hidden="true"></i>View</a>` : ''}
        </div>
      </div>`
    ).join('');
  }
}

function buildTestimonials() {
  if ($('tgrid')) {
    $('tgrid').innerHTML = DB.testimonials.map((t, i) => {
      // Escape all values from JSON before injecting into HTML.
      // siba.json is self-authored, but defensive escaping prevents
      // an accidental special character from breaking the template.
      const text     = escapeHtml(t.text);
      const name     = escapeHtml(t.name);
      const role     = escapeHtml(t.role);
      const initials = escapeHtml(t.initials || (t.name || '??').slice(0,2).toUpperCase());
      // Only allow relative image paths or https:// — block javascript: data: etc.
      const photo    = safeUrl(t.photo);
      return `
      <div class="tcard r${i ? ' d'+i : ''}">
        <p class="ttext">"${text}"</p>
        <div class="tauthor">
          <img class="tphoto" src="${photo}" alt="${name}" loading="lazy"
            onerror="this.outerHTML='<div class=\\'tphoto\\'style=\\'display:flex;align-items:center;justify-content:center;background:var(--bg3);font-family:var(--serif);font-size:15px;color:var(--gold)\\'>${initials}</div>'"/>
          <div>
            <div class="tname">${name}</div>
            <div class="trole">${role}</div>
          </div>
        </div>
      </div>`;
    }).join('');
  }
}

function buildContact() {
  const d = DB.identity;
  const links = [
    { icon:'ti-mail',           href:`mailto:${d.email}`,   lbl:'Email',     val:d.email },
    { icon:'ti-phone',          href:`tel:${d.phone}`,       lbl:'Phone',     val:d.phone },
    { icon:'ti-brand-linkedin', href:d.linkedin,             lbl:'LinkedIn',  val:'linkedin.com/in/siba-sankar-kabi', target:'_blank' },
    { icon:'ti-world',          href:d.portfolio,            lbl:'Portfolio', val:'sankarkabi.co.in', target:'_blank' },
    { icon:'ti-brand-behance',  href:d.behance,              lbl:'Behance',   val:'behance.net/sankarkabi', target:'_blank' }
  ];
  if ($('contact-links')) {
    $('contact-links').innerHTML = links.map(l =>
      `<div class="citem">
        <div><div class="clbl">${l.lbl}</div><div class="cval">${l.val}</div></div>
      </div>`
    ).join('');
  }
}

function buildFooter() {
  const d = DB.identity;
  if ($('foot-name')) $('foot-name').textContent = d.name;
  if ($('foot-copy')) $('foot-copy').textContent = `© 2026 · UX Design Leader · ${d.location.split(',')[0]}`;
}

/* ── INTERACTIVE ── */
function initTicker() {
  const el = $('ticker');
  if (el) el.innerHTML += el.innerHTML;
}

function initReveal() {
  const obs = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
  }, { threshold: 0.07 });
  document.querySelectorAll('.r').forEach(el => obs.observe(el));
}

function initSkillBars() {
  const obs = new IntersectionObserver(es => {
    es.forEach(e => {
      if (e.isIntersecting) {
        e.target.querySelectorAll('.skill-bar').forEach(b => {
          b.style.width = b.dataset.pct + '%';
          b.classList.add('on');
        });
      }
    });
  }, { threshold: .2 });
  document.querySelectorAll('.skill-stack').forEach(el => obs.observe(el));
}

function filterExp(btn, org) {
  document.querySelectorAll('.xbtn').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  document.querySelectorAll('.xcard').forEach(c => {
    c.style.display = (org === 'all' || c.dataset.org === org) ? 'block' : 'none';
  });
}

function filterPort(btn, cat) {
  document.querySelectorAll('.fbtn').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  document.querySelectorAll('.pcard').forEach(c => {
    const show = cat === 'all' || c.dataset.cat === cat;
    c.style.opacity       = show ? '1'    : '0.18';
    c.style.pointerEvents = show ? 'auto' : 'none';
    c.style.transform     = show ? ''     : 'scale(.96)';
  });
}

// nav scroll highlight
window.addEventListener('scroll', () => {
  const y = window.scrollY + 80;
  document.querySelectorAll('section[id]').forEach(s => {
    const lnk = document.querySelector(`.nav-links a[href="#${s.id}"]`);
    if (lnk) lnk.classList.toggle('active', y >= s.offsetTop && y < s.offsetTop + s.offsetHeight);
  });
}, { passive: true });

/* ══════════════════════════════════════════════════════════
   PROJECT CASE STUDY MODAL
   ══════════════════════════════════════════════════════════ */

function openProjectModal(projectId) {
  const project = DB.projects.find(p => p.id === projectId);
  if (!project) return;

  $('project-modal-image').src    = project.image || '';
  $('project-modal-title').textContent  = project.name;
  $('project-modal-client').textContent = project.client;
  $('project-modal-role').textContent   = project.role;
  $('project-modal-summary').textContent = project.summary;
  $('project-modal-detail').innerHTML   = `<p>${project.detail}</p>`;

  $('project-modal-outcomes').innerHTML = project.outcomes.map(o => `<li>${o}</li>`).join('');
  $('project-modal-tags').innerHTML     = project.tags.map(t => `<span class="ptag">${t}</span>`).join('');

  const behanceBtn = $('project-modal-behance');
  if (project.behance) { behanceBtn.href = project.behance; behanceBtn.style.display = 'inline-flex'; }
  else { behanceBtn.style.display = 'none'; }

  const deepDiveBtn = $('project-modal-deepdive');
  if (project.case_study) { deepDiveBtn.style.display = 'inline-flex'; }
  else { deepDiveBtn.style.display = 'none'; }

  // Show case study files button only for projects that have files
  const filesBtn = $('project-modal-files');
  if (filesBtn) {
    if (CASE_STUDY_FILES[projectId]) { filesBtn.style.display = 'inline-flex'; }
    else { filesBtn.style.display = 'none'; }
  }

  window.currentProjectId = projectId;

  $('project-modal-bg').classList.add('on');
  $('project-modal').classList.add('on');
  document.body.style.overflow = 'hidden';
}

function closeProjectModal() {
  $('project-modal-bg').classList.remove('on');
  $('project-modal').classList.remove('on');
  document.body.style.overflow = '';
}

/* ══════════════════════════════════════════════════════════
   CASE STUDY FILE VIEWER
   Opens actual case study PDFs and images per project
   ══════════════════════════════════════════════════════════ */

const CASE_STUDY_FILES = {
  baptist: {
    title: 'Healthcare Platform Redesign — Pine App',
    client: 'Capgemini × Baptist Healthcare',
    files: [
      {
        name: 'Customer Experience', type: 'pdf',
        src: 'images/CaseStudy/PineApp Refresh Customer Experience.pdf',
        desc: 'End-to-end patient journey redesign across the Pine App — covering experience mapping, digital touchpoint strategy, information architecture, and how Siba restructured the full patient lifecycle from onboarding through appointment management and health record access.',
        angle: 'the patient journey architecture and experience strategy decisions'
      },
      {
        name: 'Login Flow', type: 'pdf',
        src: 'images/CaseStudy/PineApp Refresh Login flow.pdf',
        desc: 'Authentication UX redesign balancing strict healthcare security requirements with one-handed usability for clinical staff — covering biometric, PIN, and SSO flows, session timeout logic, and the friction-reduction decisions made after moderated usability testing with nurses.',
        angle: 'the authentication design decisions and the tension between security and clinical usability'
      },
      {
        name: 'Visual Design', type: 'pdf',
        src: 'images/CaseStudy/PineApp Refresh Visual Design.pdf',
        desc: 'Final visual direction using Morphism/Glassmorphism aesthetics — colour system, typography scale, iconography, component library, dark mode strategy, and the accessibility compliance work (WCAG AA) that shaped every visual decision.',
        angle: 'the visual design direction, component choices, and accessibility rationale'
      },
      {
        name: 'Research', type: 'image',
        src: 'images/CaseStudy/PineApp Refresh with Research.jpg',
        desc: 'Mixed-methods research synthesis — 24 in-depth user interviews, 6 contextual inquiry sessions with clinical staff, heuristic evaluation of the legacy system, and two rounds of A/B usability testing that validated the final Morphism visual direction over the alternative.',
        angle: 'the research methodology, what was discovered, and how findings shaped the design decisions'
      },
    ]
  },
  tamm: {
    title: 'Conversational AI Design System',
    client: 'TAMM · Dubai Government',
    files: [
      {
        name: 'Full Case Study', type: 'pdf',
        src: 'images/CaseStudy/TAMM.pdf',
        desc: 'Designing a conversational AI design system for the TAMM government super-app — covering dialogue UX, intent mapping, multi-language support (Arabic/English), and the component library that enabled 40+ government services to onboard the AI assistant without custom design work.',
        angle: 'the conversational AI design challenges, government service complexity, and the system thinking behind the design language'
      },
    ]
  },
  goodyear: {
    title: 'B2C & B2B Website Redesign',
    client: 'Goodyear APAC',
    files: [
      {
        name: 'Full Case Study', type: 'pdf',
        src: 'images/CaseStudy/Goodyear.pdf',
        desc: 'Simultaneous B2C and B2B website redesign across Goodyear APAC — dual-audience IA, fleet owner journey mapping, quote-to-payment flow redesign, and the B2B portal design that removed friction points discovered during contextual research with fleet managers.',
        angle: 'the dual-audience design challenge, B2B journey friction points, and the decisions that drove the commerce improvements'
      },
    ]
  },
  vs: {
    title: 'Fashion e-Commerce Design System',
    client: "Victoria's Secret",
    files: [
      {
        name: 'Full Case Study', type: 'pdf',
        src: 'images/CaseStudy/Victoria secret.pdf',
        desc: "Fashion e-commerce design system for Victoria's Secret — component library, design token architecture, product discovery UX, and the pattern library that unified the brand's digital touchpoints across web and mobile.",
        angle: "the design system architecture decisions, component governance, and how it unified the brand's digital experience"
      },
    ]
  },
};

let _currentCsProject = null;
let _currentCsFileIdx  = 0;

function detectCaseStudyProject(query) {
  if (!DB) return null;
  const q = query.toLowerCase();
  const matched = DB.projects.find(p =>
    CASE_STUDY_FILES[p.id] && (
      q.includes(p.id) ||
      p.name.toLowerCase().split(' ').some(w => w.length > 3 && q.includes(w)) ||
      (p.client && p.client.toLowerCase().split(' ').some(w => w.length > 3 && q.includes(w)))
    )
  );
  return matched ? { project: matched, cs: CASE_STUDY_FILES[matched.id] } : null;
}

function openCaseStudyFiles(projectId) {
  projectId = projectId || window.currentProjectId;
  const data = CASE_STUDY_FILES[projectId];
  if (!data) return;
  _currentCsProject = projectId;
  window.currentProjectId = projectId;

  $('cs-file-client').textContent = data.client;
  $('cs-file-title').textContent  = data.title;

  $('cs-file-tabs').innerHTML = data.files.map((f, i) =>
    `<button class="csf-tab${i === 0 ? ' active' : ''}" onclick="switchCsFileTab(${i})">${f.name}</button>`
  ).join('');

  _currentCsFileIdx = 0;
  hideAiSummary();
  $('csf-ai-text').innerHTML = '';
  showCsFile(data.files[0]);

  $('cs-file-panel').classList.add('on');
  document.body.style.overflow = 'hidden';
}

function switchCsFileTab(idx) {
  const data = CASE_STUDY_FILES[_currentCsProject];
  if (!data) return;
  _currentCsFileIdx = idx;
  document.querySelectorAll('.csf-tab').forEach((t, i) => t.classList.toggle('active', i === idx));
  showCsFile(data.files[idx]);
  hideAiSummary();
  $('csf-ai-text').innerHTML = '';
  $('cs-file-body').scrollTop = 0;
}

function showCsFile(file) {
  const content = $('cs-file-content');
  if (file.type === 'image') {
    content.innerHTML = `<div class="csf-img-wrap"><img src="${file.src}" alt="${file.name}" class="csf-image"/></div>`;
  } else {
    // #toolbar=0 hides Chrome/Edge PDF toolbar (download, print, save buttons).
    // navpanes=0 hides the side panel. view=FitH fits width for cleaner view.
    const src = file.src + '#toolbar=0&navpanes=0&scrollbar=1&view=FitH';
    content.innerHTML = `
      <div class="csf-pdf-wrap">
        <iframe src="${src}" class="csf-pdf-frame" title="${file.name}"></iframe>
      </div>`;
  }
}

function closeCaseStudyFiles() {
  $('cs-file-panel').classList.remove('on');
  document.body.style.overflow = '';
  _currentCsProject = null;
  hideAiSummary();
}

/* ── AI SUMMARY PANEL inside case study viewer ── */
const _aiSummaryCache = {};   // keyed by project id

async function toggleAiSummary() {
  const panel = $('csf-ai-panel');
  const btn   = $('csf-ai-btn');
  if (!panel) return;

  if (panel.classList.contains('open')) {
    hideAiSummary(); return;
  }

  panel.classList.add('open');
  btn.classList.add('active');

  const pid  = _currentCsProject;
  const fidx = _currentCsFileIdx;
  if (!pid) return;

  const cacheKey = `${pid}:${fidx}`;

  // Serve from cache — each tab has its own entry
  if (_aiSummaryCache[cacheKey]) {
    $('csf-ai-text').innerHTML = _aiSummaryCache[cacheKey];
    return;
  }

  const project = DB?.projects?.find(p => p.id === pid);
  const file    = CASE_STUDY_FILES[pid]?.files[fidx];
  if (!project) { $('csf-ai-text').innerHTML = '<p>Could not load project data.</p>'; return; }

  $('csf-ai-text').innerHTML = `<div class="csf-ai-skel"><div class="csf-sk csf-sk-90"></div><div class="csf-sk csf-sk-100"></div><div class="csf-sk csf-sk-80"></div><div class="csf-sk csf-sk-70"></div></div>`;

  const docName   = file?.name || project.name;
  const docDesc   = file?.desc || project.summary || '';
  const docAngle  = file?.angle || 'the design approach and key outcomes';

  const query = `You're reviewing the "${docName}" document from Siba Sankar Kabi's ${project.name} case study. Write a 120–140 word brief focused specifically on ${docAngle}. Be specific about the design decisions and why they were made — write like a thoughtful colleague who actually reviewed the work, not a marketing blurb. Plain prose only, no bullet points or headers.`;

  const systemPrompt = `You are Siba's AI portfolio agent. You know his work deeply and speak with genuine insight — not vague praise.\nSpeak in a warm, direct, first-person-adjacent voice (like a trusted colleague explaining the work to a hiring manager).\nUse ONLY the facts below. Never invent data points.\n\nProject: "${project.name}"\nClient: ${project.client}\nSiba's role: ${project.role}\nDocument being viewed: "${docName}"\nWhat this document covers: ${docDesc}\n${project.detail ? 'Project detail: ' + project.detail.substring(0, 500) : ''}\nOutcomes: ${(project.outcomes || []).join('; ')}\n\nOutput: 120–140 words, plain prose, no headers, no bullet points, no markdown.`;

  const snapPid = pid, snapFidx = fidx;

  try {
    const r = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, systemPrompt })
    });
    if (r.ok) {
      const d = await r.json();
      if (d.text) {
        const clean = sanitizeApiText(d.text)
          .replace(/\|\|\|CHIPS:.*?\|\|\|/gs,'')
          .replace(/\|\|\|FOLLOWUP:.*?\|\|\|/gs,'')
          .trim();
        const html = `<p>${clean.replace(/\n\n+/g,'</p><p>')}</p>`;
        _aiSummaryCache[cacheKey] = html;
        if (_currentCsProject === snapPid && _currentCsFileIdx === snapFidx) $('csf-ai-text').innerHTML = html;
        return;
      }
    }
  } catch (_) {}

  // Fallback: build directly from file + project data — always tab-specific
  const html = _buildCsSummaryFallback(project, file);
  _aiSummaryCache[cacheKey] = html;
  if (_currentCsProject === snapPid && _currentCsFileIdx === snapFidx) $('csf-ai-text').innerHTML = html;
}

function _buildCsSummaryFallback(project, file) {
  const parts = [];
  if (file?.desc) {
    parts.push(`<p>${file.desc}</p>`);
  } else if (project.summary) {
    parts.push(`<p>${project.summary}</p>`);
  }
  if (project.detail) {
    const snippet = project.detail.split('. ').slice(0, 3).join('. ').trim();
    if (snippet) parts.push(`<p>${snippet}.</p>`);
  }
  if (project.outcomes?.length) {
    parts.push(`<p><strong>Key outcomes:</strong> ${project.outcomes.slice(0, 4).join(' · ')}</p>`);
  }
  return parts.join('') || `<p>${project.name} — ${project.client}.</p>`;
}

function hideAiSummary() {
  const panel = $('csf-ai-panel');
  const btn   = $('csf-ai-btn');
  if (panel) panel.classList.remove('open');
  if (btn)   btn.classList.remove('active');
}

/* ══════════════════════════════════════════════════════════
   AGENT 2 — CASE STUDY DEEP-DIVE
   Per-project conversational AI
   ══════════════════════════════════════════════════════════ */

let currentDeepDiveProject = null;

function openDeepDiveAgent() {
  const projectId = window.currentProjectId;
  const project = DB.projects.find(p => p.id === projectId);
  if (!project || !project.case_study) return;

  currentDeepDiveProject = project;
  $('deepdive-project-name').textContent = project.name;
  $('deepdive-project-role').textContent = `${project.client} · ${project.role}`;

  $('deepdive-messages').innerHTML = `
    <div class="deepdive-message agent-msg" style="margin-bottom:16px;">
      <div class="deepdive-msg-avatar">🎯</div>
      <div class="deepdive-msg-content">
        <p style="font-size:14px;line-height:1.6;color:var(--t2);margin:0;">
          Hi! I'm here to discuss every detail of how the ${project.name} project came together — from research and strategy to design decisions and outcomes. Ask me anything.
        </p>
      </div>
    </div>
  `;

  $('deepdive-input').value = '';
  $('deepdive-input').focus();
  $('deepdive-modal-bg').classList.add('on');
  $('deepdive-modal').classList.add('on');
  document.body.style.overflow = 'hidden';
}

function closeDeepDiveAgent() {
  $('deepdive-modal-bg').classList.remove('on');
  $('deepdive-modal').classList.remove('on');
  document.body.style.overflow = '';
  currentDeepDiveProject = null;
}

async function sendDeepDiveQuestion() {
  if (!currentDeepDiveProject || busy) return;
  const input = $('deepdive-input');
  const question = input.value.trim();
  if (!question) return;
  input.value = '';

  const messagesContainer = $('deepdive-messages');
  const userMsg = document.createElement('div');
  userMsg.className = 'deepdive-message user-msg';
  userMsg.innerHTML = `<div class="deepdive-msg-avatar">👤</div><div class="deepdive-msg-content">${escapeHtml(question)}</div>`;
  messagesContainer.appendChild(userMsg);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;

  const btn = $('deepdive-send-btn');
  btn.classList.add('busy'); btn.disabled = true; busy = true;

  const caseStudy = currentDeepDiveProject.case_study;
  const context = `Project: ${currentDeepDiveProject.name}\nClient: ${currentDeepDiveProject.client}\nRole: ${currentDeepDiveProject.role}\n\nChallenge: ${caseStudy.challenge}\nResearch: ${JSON.stringify(caseStudy.research)}\nStrategy: ${caseStudy.strategy}\nDesign Approach: ${caseStudy.design_approach}\nTeam: ${JSON.stringify(caseStudy.team)}\nTimeline: ${caseStudy.timeline}\nKey Decisions: ${JSON.stringify(caseStudy.key_decisions)}\nTools: ${JSON.stringify(caseStudy.tools)}\nOutcomes: ${JSON.stringify(caseStudy.launch_impact)}\nLearnings: ${JSON.stringify(caseStudy.learnings)}\nAI Methodology: ${caseStudy.ai_methodology || 'N/A'}`;

  try {
    const response = await fetch('/api/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context,
        question,
        system: `You are Siba Sankar Kabi being interviewed about the ${currentDeepDiveProject.name} project. Answer from Siba's perspective with specific details. Be conversational, detailed, and share reasoning behind decisions. Keep responses concise but insightful (2-4 sentences).`
      })
    });
    if (response.ok) {
      const data = await response.json();
      addAgentMessage(data.answer || data.text || 'Could not generate a response.');
      btn.classList.remove('busy'); btn.disabled = false; busy = false;
      input.focus(); return;
    }
  } catch (e) {}

  addAgentMessage(generateCaseStudyAnswer(question, caseStudy, currentDeepDiveProject));
  btn.classList.remove('busy'); btn.disabled = false; busy = false;
  input.focus();
}

function addAgentMessage(text) {
  const container = $('deepdive-messages');
  const msg = document.createElement('div');
  msg.className = 'deepdive-message agent-msg';
  // SECURITY: escapeHtml() prevents prompt-injection XSS.
  // Deep-dive responses are prose only — no markdown expected here,
  // so plain escaping is correct (no <strong> conversion needed).
  const safeText = escapeHtml(text);
  msg.innerHTML = `<div class="deepdive-msg-avatar">🎯</div><div class="deepdive-msg-content"><p style="font-size:14px;line-height:1.6;color:var(--t2);margin:0;">${safeText}</p></div>`;
  container.appendChild(msg);
  container.scrollTop = container.scrollHeight;
}

function generateCaseStudyAnswer(question, caseStudy, project) {
  const q = question.toLowerCase();
  if (q.includes('challenge') || q.includes('problem'))
    return `The main challenge was: ${caseStudy.challenge} This shaped the entire strategy.`;
  if (q.includes('research') || q.includes('interview') || q.includes('discover'))
    return `We ran ${caseStudy.research.phase} of research using ${caseStudy.research.methods.slice(0,2).join(', ')}. Key finding: ${caseStudy.research.key_findings}`;
  if (q.includes('strategy') || q.includes('approach'))
    return `The strategy: ${caseStudy.strategy}. We approached it with ${caseStudy.design_approach}`;
  if (q.includes('team') || q.includes('size'))
    return `The team had ${caseStudy.team.size} people: ${caseStudy.team.structure}. Completed in ${caseStudy.timeline}.`;
  if (q.includes('decision') || q.includes('why')) {
    const d = caseStudy.key_decisions[0];
    return d ? `A key decision: ${d.decision}. Reason: "${d.reasoning}". Trade-off: ${d.trade_off}` : 'Ask me about a specific decision!';
  }
  if (q.includes('tool') || q.includes('figma') || q.includes('ai'))
    return `We used ${caseStudy.tools.slice(0,3).join(', ')}. ${project.ai_tools_used?.length ? `AI tools: ${project.ai_tools_used.join(' and ')}.` : ''}`;
  if (q.includes('outcome') || q.includes('result') || q.includes('impact')) {
    const outcomes = Object.values(caseStudy.launch_impact).slice(0,2).join(', ');
    return `The outcomes: ${outcomes}. Tracked from day one and verified post-launch.`;
  }
  if (q.includes('learn') || q.includes('takeaway'))
    return `Key learning: ${caseStudy.learnings[0]} ${caseStudy.learnings[1] ? 'Also: ' + caseStudy.learnings[1] : ''}`;
  return `Based on the ${project.name} case study: ${caseStudy.strategy || caseStudy.challenge}. Ask about research, strategy, team, decisions, tools, or outcomes!`;
}

/* ══════════════════════════════════════════════════════════
   AI AGENT — reads ONLY from data/siba.json
   ══════════════════════════════════════════════════════════ */

function openModal(q) {
  $('modal-bg').classList.add('on');
  $('modal').classList.add('on');
  document.body.style.overflow = 'hidden';
  $('modal-q').textContent = q;
  $('modal-input').value = '';
  resetModal();
}
function closeModal() {
  $('modal-bg').classList.remove('on');
  $('modal').classList.remove('on');
  document.body.style.overflow = '';
}
function resetModal() {
  $('modal-skel').style.display = 'block';
  $('modal-ans').style.display  = 'none';
  $('modal-ans').innerHTML      = '';
  $('modal-chips-wrap').style.display = 'none';
  $('modal-fu-wrap').style.display    = 'none';
  $('modal-chips').innerHTML = '';
  $('modal-fu').innerHTML    = '';
}

function parseResp(raw) {
  const cm = raw.match(/\|\|\|CHIPS:(.*?)\|\|\|/);
  const fm = raw.match(/\|\|\|FOLLOWUP:(.*?)\|\|\|/);
  const chips = cm ? cm[1].split(',').map(s => s.trim()).filter(Boolean) : [];
  const fus   = fm ? fm[1].split('|').map(s => s.trim()).filter(s => s.length > 4 && s.includes('?')) : [];
  // Strip metadata markers; API text was already sanitized in callAgent() before
  // arriving here. localAnswer() pre-builds safe HTML and arrives unsanitized —
  // that is correct; both paths produce safe output via different entry points.
  let txt = raw.replace(/\|\|\|CHIPS:.*?\|\|\|/gs,'').replace(/\|\|\|FOLLOWUP:.*?\|\|\|/gs,'').trim();
  txt = txt.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  txt = txt.split(/\n\n+/).map(p => p.trim()).filter(Boolean)
    .map(p => p.startsWith('<ul') || p.startsWith('<li') ? p : `<p>${p}</p>`).join('');
  return { txt, chips, fus: fus.slice(0, 3) };
}

function buildUxKnowledgeBlock() {
  if (!DB || !DB.ux_knowledge) return '';
  const ux = DB.ux_knowledge;
  const h  = ux.ten_heuristics.map(h => `${h.id}. ${h.name}: ${h.principle}`).join('\n');
  const glossary = Object.entries(ux.ux_concepts_glossary)
    .map(([k, v]) => `${k.replace(/_/g,' ')}: ${v}`).join('\n');
  return `
UX KNOWLEDGE BASE (source: Nielsen Norman Group — nngroup.com):
When someone asks a UX methodology, theory, or process question, answer using this knowledge. Always connect concepts back to Siba's real project experience where natural.

USABILITY (5 components): ${ux.usability.five_components.join(' | ')}

10 USABILITY HEURISTICS (Jakob Nielsen):
${h}

DESIGN THINKING (6 phases): ${ux.design_thinking.six_phases.join(' → ')}

UX RESEARCH FRAMEWORK:
- Attitudinal vs Behavioral: ${ux.research_methods.three_dimensions.attitudinal_vs_behavioral}
- Qualitative vs Quantitative: ${ux.research_methods.three_dimensions.qualitative_vs_quantitative}
- 20 Methods: ${ux.research_methods.twenty_methods.join(', ')}
- Top recommendation: ${ux.research_methods.top_recommendation}

JOURNEY MAPPING: ${ux.journey_mapping.definition} Components: ${ux.journey_mapping.five_components.join(' | ')}
SERVICE BLUEPRINTS: ${ux.service_blueprints.definition} vs Journey Maps: ${ux.service_blueprints.vs_journey_maps}
EMPATHY MAPPING: ${ux.empathy_mapping.definition} Quadrants: Says (direct quotes) | Thinks (internal thoughts) | Does (actions) | Feels (emotions)
USABILITY TESTING: ${ux.usability_testing.definition} Think-aloud method: ${ux.usability_testing.think_aloud_method} Sample size: ${ux.usability_testing.sample_size}
PERSONAS: ${ux.personas.definition} Critical principle: ${ux.personas.critical_principle}
CARD SORTING: ${ux.card_sorting.definition} Types: Open (user creates categories) | Closed (predefined categories) | Hybrid
MENTAL MODELS: ${ux.mental_models.definition} Key principle: ${ux.mental_models.key_principle}
DESIGN SYSTEMS: ${ux.design_systems.definition} Components: Style guide + Component library + Pattern library. When to invest: ${ux.design_systems.when_to_invest}
F-PATTERN READING: Users read web content in an F-shape when text lacks formatting. Solutions: ${ux.f_pattern_reading.design_implications.solutions.join('; ')}
JAKOB'S LAW: ${ux.jakob_law.statement} Application: ${ux.jakob_law.application}
HEURISTIC EVALUATION: ${ux.heuristic_evaluation.definition} Evaluator count: ${ux.heuristic_evaluation.evaluator_count}

UX GLOSSARY:
${glossary}`;
}

function buildSystemPrompt() {
  if (!DB) return '';
  const d  = DB.identity, cr = DB.current_role, m = DB.impact_metrics, ph = DB.philosophy;
  const projectSummaries = DB.projects.map(p =>
    `${p.name} (${p.client}, ${p.role}): ${p.summary} Outcomes: ${p.outcomes.join('; ')}.`
  ).join('\n');
  const aiTools = DB.skills.ai_tools.map(t => `${t.name} — ${t.use}`).join(', ');
  const certs   = DB.certifications.join('; ');
  const testimonials = DB.testimonials.map(t => `${t.name} (${t.role}): "${t.text}"`).join('\n');
  const uxKnowledge = buildUxKnowledgeBlock();

  return `You are the personal AI agent for ${d.name}. Visitors come to this portfolio to understand who Siba is and what he can do. Make them feel like they talked to a knowledgeable colleague who knows Siba deeply.

VOICE: Conversational, not corporate. Use contractions. React naturally — if someone asks about a great project, be genuinely enthusiastic. Use phrases like "Oh, that one's worth a proper conversation" or "Here's what made this interesting". Never passive voice if active works. Never say "As an AI". Never write a press release or read from a CV.

STYLE: Third-person ("Siba's approach", "he ran", "his team") but feel like a sharp colleague saying it out loud, not a recruiter screen. Lead with the most interesting angle — not the job title. 2-3 sentence paragraphs. No jargon walls.

When answering UX methodology or theory questions: answer confidently from the UX knowledge base below, then naturally connect to how Siba has applied this in real projects. Don't just define — explain it the way an experienced practitioner would.

PROFILE:
Name: ${d.name} | Role: ${cr.title} at ${cr.company} | Studio: ${cr.studio} | Location: ${d.location} | Experience: ${d.experience_years} years | Availability: ${d.availability}
Philosophy: "${ph.design_belief}" / "${ph.ai_belief}"
Studio: ${cr.direct_reports} direct reports, ${cr.extended_team} extended team (since ${cr.since})
Responsibilities: ${cr.responsibilities.join(' | ')}

METRICS (exact, verified — never invent new ones):
ACV increase: ${m.rfp_acv_increase} | Dev time reduction: ${m.dev_time_reduction} | Patient bookings: ${m.patient_bookings_increase} | Ideation speed: ${m.ideation_speed_increase} | B2B tickets: ${m.support_ticket_reduction} | Team retention: ${m.team_retention} | UX interviews/year: ${m.ux_interviews_per_year} | RFPs led: ${m.rfps_led}

AWARDS: ${DB.awards.map(a => `${a.name}: ${a.reason}`).join(' | ')}
PROJECTS: ${projectSummaries}
AI TOOLS: ${aiTools}
CERTIFICATIONS: ${certs}
TESTIMONIALS: ${testimonials}
${uxKnowledge}

FORMAT: 130–220 words. **Bold** key facts. Bullet lists only for 4+ items. Lead with the most interesting angle. Sound like a real person in a real conversation.
End EVERY response with: |||CHIPS:topic1,topic2,topic3|||FOLLOWUP:q1?|q2?|q3?|||`;
}

async function callAgent(query) {
  const systemPrompt = buildSystemPrompt();
  try {
    const r = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, systemPrompt })
    });
    if (r.ok) {
      const d = await r.json();
      // SECURITY: sanitize API text HERE — at the boundary where external text
      // first enters our system. parseResp() then safely converts ** markdown
      // to <strong> (** are not HTML chars, so escaping doesn't affect them).
      // localAnswer() is NOT sanitized here — it builds known-safe HTML directly.
      if (d.text) return sanitizeApiText(d.text);
    }
  } catch (_) {}
  return localAnswer(query);
}

function localAnswer(query) {
  if (!DB) return 'Knowledge base not loaded yet. Please refresh.';
  const q  = query.toLowerCase();
  const d  = DB.identity, m = DB.impact_metrics, ph = DB.philosophy, cr = DB.current_role;
  let txt = '', chips = [], fus = [];

  const matchedProject = DB.projects.find(p =>
    q.includes(p.id) ||
    p.name.toLowerCase().split(' ').some(w => w.length > 6 && q.includes(w)) ||
    (p.client && p.client.toLowerCase().split(' ').some(w => w.length > 6 && q.includes(w)))
  );

  if (matchedProject) {
    const p = matchedProject;
    txt = `<p>The <strong>${p.name}</strong> — that one's worth a proper conversation. Siba led this as <strong>${p.role}</strong> for ${p.client}. ${p.summary}</p>`;
    if (p.detail) txt += `<p>${p.detail.split('. ').slice(0,3).join('. ')}.</p>`;
    if (p.outcomes?.length) txt += `<p>The numbers that came out of it: <strong>${p.outcomes.slice(0,3).join(' · ')}</strong>.</p>`;
    chips = ['Impact metrics', 'Design systems', 'AI workflow'];
    fus   = ['What other projects has Siba led?', 'How does he use AI in his work?', 'What awards has his work won?'];
  } else if (/gem|award|win/i.test(q)) {
    txt = `<p>The <strong>${DB.awards[0].name}</strong> — not the kind of award you get for showing up. ${DB.awards[0].reason}.</p><p>${DB.awards[1].name}: ${DB.awards[1].reason}.</p><p>The Baptist Healthcare work specifically drove <strong>${m.patient_bookings_increase} more patient bookings</strong> after launch. That's what wins things.</p>`;
    chips = ['Baptist Healthcare', 'Business results', 'Studio'];
    fus   = ['Tell me about the Pine App project', 'What does Siba lead at Capgemini now?', 'What other results has he driven?'];
  } else if (/why.*hire|better than|stand.*out|differ|compet|over other|should.*hire/i.test(q)) {
    txt = `<p>Three things that are genuinely hard to find in one person: <strong>${d.experience_years} years of hands-on craft</strong>, the business acumen to run 15+ RFPs and drive a <strong>${m.rfp_acv_increase} ACV increase</strong>, and the technical depth to pioneer <strong>Model Context Protocol</strong> training for an entire studio.</p><p>He's also a GEM Award winner — not for a side project, but for work that drove <strong>${m.patient_bookings_increase} more patient bookings</strong> in a live healthcare product. Most senior UX people are strong in one of these. Siba does all three.</p>`;
    chips = ['GEM Award', 'Projects', 'Contact'];
    fus   = ['Tell me about the healthcare project', 'What does he lead at Capgemini?', 'How do I get in touch?'];
  } else if (/\bai\b|\btool\b|workflow|\bmcp\b|model context|figma make|claude/i.test(q)) {
    const tools = DB.skills.ai_tools.slice(0, 6);
    txt = `<p>Siba's not just using AI tools — he's changed how his whole ${cr.extended_team}-person studio works with them. He pioneered <strong>Model Context Protocol (MCP)</strong> training across the team, which cut ideation time by <strong>${m.ideation_speed_increase}</strong>.</p><ul>${tools.map(t => `<li><strong>${t.name}</strong> — ${t.use}</li>`).join('')}</ul><p>The philosophy: "AI isn't changing what we do — it's changing how fast." He lives that, doesn't just say it.</p>`;
    chips = ['Design process', 'Studio leadership', 'Baptist Healthcare'];
    fus   = ['How did MCP training change the studio output?', 'How has AI changed his approach to research?', 'What was the Baptist Healthcare project?'];
  } else if (/philosoph|approach|believe|passion|think(?!ing)/i.test(q)) {
    txt = `<p><em>"${ph.ai_belief}"</em></p><p><em>"${ph.design_belief}"</em></p><p>${ph.approach}</p>`;
    chips = ['Design process', 'AI workflow', 'Projects'];
    fus   = ['How does he translate that into how he leads?', 'Which project reflects his philosophy best?', 'What AI tools does he use daily?'];
  } else if (/team|lead|studio|manag|mentor|report/i.test(q)) {
    txt = `<p>Siba runs the <strong>${cr.studio}</strong> — <strong>${cr.direct_reports} direct reports</strong>, ${cr.extended_team} across the extended team. He personally runs <strong>${m.ux_interviews_per_year} UX interviews a year</strong>, which is how you actually maintain <strong>${m.team_retention} team retention</strong>.</p><p>On top of team delivery, he owns RFP strategy — 15+ led, driving a <strong>${m.rfp_acv_increase} ACV increase</strong>. He's managing up, managing across, and still doing the work.</p>`;
    chips = ['GEM Award', 'AI tools', 'Contact'];
    fus   = ['What approach does he take to design critique and mentorship?', 'How does he balance strategy with hands-on design?', 'How can I get in touch?'];
  } else if (/contact|reach|avail|email|phone|talk|connect/i.test(q)) {
    // safeUrl() validates each href — blocks javascript:/data: schemes if JSON is ever tampered.
    // escapeHtml() prevents special chars in email/phone from breaking the HTML template.
    txt = `<p>Siba's ${escapeHtml(d.availability.toLowerCase())}.</p><p>📧 <a href="${safeUrl('mailto:'+d.email)}">${escapeHtml(d.email)}</a><br>📱 <a href="${safeUrl('tel:'+d.phone)}">${escapeHtml(d.phone)}</a><br>💼 <a href="${safeUrl(d.linkedin)}" target="_blank" rel="noopener noreferrer">LinkedIn</a><br>🌐 <a href="${safeUrl(d.portfolio)}" target="_blank" rel="noopener noreferrer">${escapeHtml(d.portfolio)}</a></p><p>Email gets the fastest response — usually within a working day.</p>`;
    chips = ['Open to roles', 'Current studio', 'Portfolio'];
    fus   = ['What kind of role is he looking for?', 'What has he built at Capgemini?', 'Where can I see the case studies?'];
  } else if (/testimonial|colleague|say|recommend|peer|review/i.test(q)) {
    const [t1, t2] = DB.testimonials;
    txt = `<p>Here's what people who've worked closely with him say:</p><p><strong>${t1.name}</strong> (${t1.role}): <em>"${t1.text}"</em></p><p><strong>${t2.name}</strong> (${t2.role}): <em>"${t2.text}"</em></p>`;
    chips = ['Oracle work', 'Current role', 'Contact'];
    fus   = ['What did Siba work on at Oracle?', 'What is he doing now at Capgemini?', 'How do I reach him?'];

  /* ── UX KNOWLEDGE — sourced from Nielsen Norman Group ── */
  } else if (DB.ux_knowledge && /heuristic|usability heuristic|10 heuristic|jakob nielsen heuristic/i.test(q)) {
    const ux = DB.ux_knowledge;
    const topH = ux.ten_heuristics.slice(0, 5);
    txt = `<p>Jakob Nielsen's <strong>10 Usability Heuristics</strong> are the gold standard for UI evaluation — developed in 1990 and still the most widely used usability framework today.</p><ul>${topH.map(h => `<li><strong>${h.name}</strong> — ${h.principle}</li>`).join('')}</ul><p>...and 5 more: Recognition over Recall, Flexibility & Efficiency, Aesthetic & Minimalist Design, Error Recovery, and Help & Documentation. Siba applies these in heuristic evaluations before and during usability testing.</p>`;
    chips = ['Usability testing', 'Design process', 'UX research'];
    fus   = ['How does a heuristic evaluation work?', 'What is usability testing?', 'How has Siba applied these on real projects?'];

  } else if (DB.ux_knowledge && /design thinking|design process|double diamond/i.test(q)) {
    const dt = DB.ux_knowledge.design_thinking;
    txt = `<p><strong>Design Thinking</strong> is a structured, user-centered approach to problem solving with six phases: <strong>${dt.six_phases.slice(0,3).join(' → ')}</strong> — and then Prototype, Test, Implement.</p><p>What matters most is that it's iterative, not linear. Teams regularly loop back to Empathize after testing reveals something unexpected. The Implement phase — actually shipping — is where most frameworks fall short, and where design leadership matters most.</p><p>Siba has run this process across healthcare, government, and automotive contexts — adapting the framework to the constraints of each engagement without losing the human-centered core.</p>`;
    chips = ['UX research', 'Journey mapping', 'Design systems'];
    fus   = ['What research methods does Siba use?', 'How does journey mapping fit into the design process?', 'Tell me about the Baptist Healthcare project'];

  } else if (DB.ux_knowledge && /journey map|experience map/i.test(q)) {
    const jm = DB.ux_knowledge.journey_mapping;
    txt = `<p>A <strong>journey map</strong> visualizes the process a person goes through to accomplish a goal — compiling actions into a timeline enriched with thoughts, emotions, and pain points.</p><p>The five components: <strong>Actor</strong> (one persona per map), <strong>Scenario</strong>, <strong>Journey Phases</strong>, <strong>Actions/Mindsets/Emotions</strong>, and <strong>Opportunities</strong>. That last one is the whole point — the map is a vehicle for spotting where to intervene, not just a pretty deliverable.</p><p>For Goodyear APAC, Siba mapped the B2B fleet owner's full purchase journey — quote creation through payment — which surfaced critical friction points in the checkout handoff that the client hadn't tracked before.</p>`;
    chips = ['Service blueprints', 'Empathy mapping', 'Goodyear project'];
    fus   = ['How is a service blueprint different from a journey map?', 'What is empathy mapping?', 'Tell me about the Goodyear APAC project'];

  } else if (DB.ux_knowledge && /service blueprint/i.test(q)) {
    const sb = DB.ux_knowledge.service_blueprints;
    txt = `<p>A <strong>service blueprint</strong> maps the organizational infrastructure behind a customer experience. Think of it as the operational "part two" to a journey map — while the journey map shows what the customer experiences, the blueprint exposes <em>why</em> that experience happens the way it does.</p><p>It has five layers: Customer Actions, Frontstage Actions (visible to customers), Backstage Actions (invisible), Processes, and Evidence. The lines separating these — the Line of Visibility in particular — are where the real design problems live.</p><p>It's especially powerful for omnichannel and healthcare contexts, where what happens behind the scenes directly determines what the patient or customer actually feels.</p>`;
    chips = ['Journey mapping', 'UX research', 'Healthcare UX'];
    fus   = ['How does this differ from a journey map?', 'When should you use a service blueprint?', 'How did Siba apply this in healthcare?'];

  } else if (DB.ux_knowledge && /empathy map/i.test(q)) {
    const em = DB.ux_knowledge.empathy_mapping;
    txt = `<p>An <strong>empathy map</strong> is a collaborative tool that captures what is known about a user type across four dimensions: <strong>Says</strong> (direct quotes), <strong>Thinks</strong> (internal concerns they may not voice), <strong>Does</strong> (actual behaviors), and <strong>Feels</strong> (emotional state).</p><p>The "Thinks" quadrant is where it gets interesting — it captures the gap between what users say and what they actually mean. That gap is usually where the best design decisions hide.</p><p>Empathy maps work best as a team exercise immediately after research synthesis — they force alignment and surface disagreements about who you're actually designing for before you commit to a direction.</p>`;
    chips = ['User research', 'Personas', 'Design process'];
    fus   = ['How is an empathy map different from a persona?', 'What UX research methods does Siba use?', 'How does he run research with his team?'];

  } else if (DB.ux_knowledge && /usability test|user test|think aloud|think-aloud/i.test(q)) {
    const ut = DB.ux_knowledge.usability_testing;
    txt = `<p><strong>Usability testing</strong> is a researcher observing a participant perform realistic tasks on a product to identify friction, confusion, and failure points. It's the most effective single method for improving an existing system.</p><p>The think-aloud method — where participants narrate what they're doing and why — is the core technique. It surfaces the gap between user intent and system response in real time. <strong>Five participants</strong> typically uncover the majority of significant issues; running more users in fewer but smaller rounds of testing beats one big test at the end.</p><p>Siba ran two full rounds of moderated usability testing on the Baptist Healthcare Pine App — including A/B testing between two visual directions — before committing to the final Morphism approach.</p>`;
    chips = ['Baptist Healthcare', 'UX research methods', 'Design process'];
    fus   = ['What were the Baptist Healthcare test findings?', 'What research methods does Siba use?', 'How many users do you need for usability testing?'];

  } else if (DB.ux_knowledge && /persona|user persona/i.test(q)) {
    const p = DB.ux_knowledge.personas;
    txt = `<p>A <strong>persona</strong> is a fictional but research-grounded representation of a target user — specific enough to make real design decisions, not a demographic average that stands for no one in particular.</p><p>The critical principle: every detail in a persona should either influence a design decision or make the persona more memorable. Age, photo, and a quote do the latter. Goals, pain points, and context do the former. Anything else is noise.</p><p>On the Goodyear APAC project, Siba's team built distinct personas for B2C individual buyers and B2B fleet owners — two fundamentally different decision journeys that required separate content architectures. Treating them as one user type would have been a serious mistake.</p>`;
    chips = ['Empathy mapping', 'User research', 'Goodyear project'];
    fus   = ['How do you create personas from research?', 'How is a persona different from an empathy map?', 'Tell me about the Goodyear APAC project'];

  } else if (DB.ux_knowledge && /card sort|information architecture|ia |tree test/i.test(q)) {
    const cs = DB.ux_knowledge.card_sorting;
    txt = `<p><strong>Card sorting</strong> reveals how users mentally organize information — and it's one of the most direct ways to design navigation that matches real mental models instead of internal org-chart logic.</p><p>Three types: <strong>Open</strong> (users create their own categories — best for discovery), <strong>Closed</strong> (users place cards into your existing categories — best for validation), and <strong>Hybrid</strong>. You need at least 15 participants for qualitative insight, 30–50 for statistical confidence.</p><p>Tree testing complements card sorting by testing whether users can actually <em>find</em> things in the structure you've built — without any visual design to mask IA problems. Together they make your navigation decisions defensible.</p>`;
    chips = ['UX research', 'Design systems', 'Information architecture'];
    fus   = ['What is tree testing?', 'How does IA relate to navigation design?', 'What research methods does Siba use?'];

  } else if (DB.ux_knowledge && /mental model/i.test(q)) {
    const mm = DB.ux_knowledge.mental_models;
    txt = `<p>A <strong>mental model</strong> is what users <em>believe</em> a system does — based on their prior experiences, not on how the system actually works. The gap between user mental models and system behavior is where most usability failures live.</p><p><strong>Jakob's Law</strong> makes this concrete: users spend most of their time on <em>other</em> products, so they expect yours to work similarly. This is why radical novelty in standard UI patterns almost always backfires — you're fighting years of accumulated expectation.</p><p>Mental model inertia is powerful. The best design strategy is to align with existing models for standard interactions and reserve innovation for where it genuinely creates value the user can immediately appreciate.</p>`;
    chips = ['Jakob\'s Law', 'Usability heuristics', 'Design process'];
    fus   = ['What is Jakob\'s Law?', 'How do you uncover user mental models?', 'What usability methods does Siba use?'];

  } else if (DB.ux_knowledge && /design system/i.test(q)) {
    const ds = DB.ux_knowledge.design_systems;
    txt = `<p>A <strong>design system</strong> is a complete set of standards for managing design at scale — style guide, component library, and pattern library working together. The real value isn't the components themselves; it's the shared language and the time it gives designers back to solve harder problems.</p><p>Governance is what separates a functioning design system from a beautiful Figma file no one uses. You need a dedicated team — at minimum one interaction designer, one visual designer, one developer — and an executive sponsor who understands why it matters to the business.</p><p>Siba has governed multi-brand design systems at Goodyear and Baptist Healthcare — two very different product contexts — and cut front-end development time by <strong>32%</strong> at Goodyear by establishing a governed component library.</p>`;
    chips = ['Goodyear project', 'Component library', 'Design process'];
    fus   = ['How did the Goodyear design system work?', 'What is Siba\'s approach to design system governance?', 'Tell me about the Baptist Healthcare project'];

  } else if (DB.ux_knowledge && /cognitive load|cognitive|hick|fitts|gestalt/i.test(q)) {
    const g = DB.ux_knowledge.ux_concepts_glossary;
    txt = `<p><strong>Cognitive load</strong> is the total mental effort required by working memory at any moment. UX design's job is to minimize unnecessary cognitive load so users can focus on their actual goals — not on figuring out the interface.</p><p><strong>Hick's Law</strong> says decision time increases with the number and complexity of choices — which is why progressive disclosure, clear hierarchies, and focused onboarding flows matter. <strong>Fitts's Law</strong> says target acquisition time depends on size and distance — which is why primary actions should be large and positioned where the cursor naturally travels.</p><p>On the Baptist Healthcare login redesign, Siba applied Hick's Law explicitly — reducing the login screen to three clear paths with progressive reveal, directly addressing the 'too many choices' confusion users reported in research.</p>`;
    chips = ['Baptist Healthcare', 'Usability principles', 'Design decisions'];
    fus   = ['How did Siba apply these on the Baptist project?', 'What usability heuristics does he use?', 'What is progressive disclosure?'];

  } else if (DB.ux_knowledge && /accessibility|wcag|inclusive design|a11y/i.test(q)) {
    const g = DB.ux_knowledge.ux_concepts_glossary;
    txt = `<p><strong>Accessibility</strong> means designing products that work for people with disabilities — and in practice, it means designing better products for everyone. WCAG organises accessibility around four principles: <strong>Perceivable, Operable, Understandable, and Robust</strong> (POUR).</p><p>The most common mistake is treating accessibility as a compliance checklist at the end of the project. Contrast ratios, touch target sizes, screen reader compatibility, and keyboard navigation need to be designed in from the start — retrofitting is 5x more expensive and always incomplete.</p><p>On the Baptist Healthcare project, Siba's team discovered contrast ratio issues in the Morphism concept only at the moderated testing stage. His key learning: run dedicated accessibility audits in parallel with visual preference testing — not after.</p>`;
    chips = ['Baptist Healthcare', 'Design process', 'Usability'];
    fus   = ['How did accessibility affect the Baptist Healthcare project?', 'What is WCAG?', 'How does Siba approach inclusive design?'];

  } else if (DB.ux_knowledge && /f.pattern|eye.track|reading pattern|scan pattern/i.test(q)) {
    const fp = DB.ux_knowledge.f_pattern_reading;
    txt = `<p>Eye-tracking research from Nielsen Norman Group shows users read web content in an <strong>F-shaped pattern</strong> when text lacks formatting — two horizontal scans across the top, then a vertical scan down the left side. The result: content on the right gets missed, and paragraphs get skimmed, not read.</p><p>The fix is strategic formatting: <strong>front-load critical information</strong> in opening sentences, use descriptive headings that work as standalone summaries, and put meaningful keywords in the first few words of every paragraph and link.</p><p>This isn't just academic — it directly influences how Siba structures content hierarchy in the products he designs, particularly in high-information environments like the Baptist Healthcare patient portal and the TAMM government services platform.</p>`;
    chips = ['Content design', 'Information architecture', 'UX research'];
    fus   = ['How does information hierarchy affect usability?', 'What is information architecture?', 'Tell me about the TAMM project'];

  } else {
    txt = `<p>Siba Sankar Kabi — <strong>${d.experience_years} years</strong> designing for healthcare, automotive, fashion, and enterprise SaaS. He's heading the <strong>${cr.studio}</strong> at ${cr.company}, leading a team of ${cr.extended_team}, and just won the <strong>GEM Award</strong> for design excellence.</p><p>Ask me anything specific — a project, how he leads, his AI workflow, or why he'd be the right hire.</p>`;
    chips = ['Projects', 'AI tools', 'Contact'];
    fus   = [`Tell me about the ${DB.projects[0].name} project`, 'Why should we hire Siba?', 'What AI tools does he use daily?'];
  }

  txt += `|||CHIPS:${chips.join(',')}|||FOLLOWUP:${fus.join('|')}|||`;
  return txt;
}

/* ── SEARCH FLOW ── */
async function doSearch(query) {
  if (!query || busy) return;

  // SECURITY: enforce maximum input length — prevents oversized payloads reaching /api/search.
  if (query.length > SEARCH_MAX_CHARS) {
    query = query.slice(0, SEARCH_MAX_CHARS);
  }

  // SECURITY: rate limiting — enforce minimum gap between calls.
  // Prevents rapid-fire abuse of the AI endpoint.
  const now = Date.now();
  if (now - _lastSearchTs < SEARCH_THROTTLE_MS) return;
  _lastSearchTs = now;
  busy = true;
  const ab = $('ais-btn'), mb = $('modal-btn');
  if (ab) { ab.classList.add('busy'); ab.disabled = true; }
  if (mb) { mb.classList.add('busy'); mb.disabled = true; }
  openModal(query);
  try {
    const raw = await callAgent(query);
    const { txt, chips, fus } = parseResp(raw);
    $('modal-skel').style.display = 'none';
    const a = $('modal-ans');
    a.innerHTML = txt;
    const csHit = detectCaseStudyProject(query);
    if (csHit) {
      const { project: p, cs } = csHit;
      const thumb = CS_THUMBS[p.id] || p.image || '';
      a.innerHTML += `<div class="modal-cs-card">
        <div class="modal-cs-thumb" style="background-image:url('${thumb}')"></div>
        <div class="modal-cs-info">
          <div class="modal-cs-client">${cs.client}</div>
          <div class="modal-cs-title">${cs.title}</div>
          <div class="modal-cs-actions">
            <button class="modal-cs-btn-view" onclick="closeModal();openCaseStudyFiles('${p.id}')">
              <i class="ti ti-layout-2"></i> View Case Study
            </button>
            <button class="modal-cs-btn-ai" onclick="closeModal();openCaseStudyFiles('${p.id}');setTimeout(toggleAiSummary,400)">
              <i class="ti ti-sparkles"></i> AI Summary
            </button>
          </div>
        </div>
      </div>`;
    }
    a.style.display = 'block';
    if (chips.length) {
      chips.forEach(c => {
        const b = document.createElement('button');
        b.className = 'm-chip'; b.textContent = c;
        b.onclick = () => { $('modal-q').textContent = c; resetModal(); doSearch(c); };
        $('modal-chips').appendChild(b);
      });
      $('modal-chips-wrap').style.display = 'block';
    }
    if (fus.length) {
      fus.forEach(q => {
        const b = document.createElement('button');
        b.className = 'fu-item';
        b.innerHTML = `<div class="fu-ico"><i class="ti ti-question-mark" aria-hidden="true"></i></div><div class="fu-txt">${q}</div><i class="ti ti-arrow-right fu-arr" aria-hidden="true"></i>`;
        b.onclick = () => { $('modal-q').textContent = q; resetModal(); doSearch(q); };
        $('modal-fu').appendChild(b);
      });
      $('modal-fu-wrap').style.display = 'block';
    }
    document.querySelector('.modal-body').scrollTop = 0;
  } catch (e) {
    $('modal-skel').style.display = 'none';
    const a = $('modal-ans');
    a.innerHTML = '<p>Something went wrong. Please try again.</p>';
    a.style.display = 'block';
  }
  busy = false;
  if (ab) { ab.classList.remove('busy'); ab.disabled = false; }
  if (mb) { mb.classList.remove('busy'); mb.disabled = false; }
}

function runSearch() {
  // SECURITY: strip HTML angle brackets from input before sending to API.
  // This prevents users from injecting HTML into the system prompt.
  const raw = ($('ais-input').value || '').trim();
  const q   = raw.replace(/[<>]/g, '').slice(0, SEARCH_MAX_CHARS);
  doSearch(q);
}
function modalAsk() {
  const raw = ($('modal-input').value || '').trim();
  if (!raw) return;
  const q = raw.replace(/[<>]/g, '').slice(0, SEARCH_MAX_CHARS);
  $('modal-q').textContent = q;
  resetModal();
  $('modal-input').value = '';
  doSearch(q);
}
function qSearch(btn) {
  const q = btn.textContent.trim();
  if ($('ais-input')) $('ais-input').value = q;
  doSearch(q);
}

/* ── BOOT ── */
document.addEventListener('DOMContentLoaded', () => {
  loadDB();

  const aisInput = $('ais-input');
  if (aisInput) aisInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); runSearch(); } });

  const modalInput = $('modal-input');
  if (modalInput) modalInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); modalAsk(); } });

  const deepdiveInput = $('deepdive-input');
  if (deepdiveInput) deepdiveInput.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendDeepDiveQuestion(); }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeModal();
      closeProjectModal();
      closeDeepDiveAgent();
      closeCaseStudyFiles();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      if ($('ais-input')) { $('ais-input').focus(); $('ais-input').select(); }
    }
  });
});
