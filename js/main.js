/* ═══════════════════════════════════════════════════════════
   sankarkabi.co.in — Main JS
   Reads from data/siba.json — edit that file to update content
   ═══════════════════════════════════════════════════════════ */

let DB = null;
let busy = false;

const $ = id => document.getElementById(id);

function escapeHtml(text) {
  const map = { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' };
  return text.replace(/[&<>"']/g, m => map[m]);
}

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
    $('tgrid').innerHTML = DB.testimonials.map((t, i) => `
      <div class="tcard r${i ? ' d'+i : ''}">
        <p class="ttext">"${t.text}"</p>
        <div class="tauthor">
          <img class="tphoto" src="${t.photo}" alt="${t.name}" loading="lazy"
            onerror="this.outerHTML='<div class=\\'tphoto\\'style=\\'display:flex;align-items:center;justify-content:center;background:var(--bg3);font-family:var(--serif);font-size:15px;color:var(--gold)\\'>${t.initials}</div>'"/>
          <div>
            <div class="tname">${t.name}</div>
            <div class="trole">${t.role}</div>
          </div>
        </div>
      </div>`
    ).join('');
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
      { name: 'Customer Experience',   type: 'pdf',   src: 'images/CaseStudy/PineApp Refresh Customer Experience.pdf' },
      { name: 'Login Flow',            type: 'pdf',   src: 'images/CaseStudy/PineApp Refresh Login flow.pdf' },
      { name: 'Visual Design',         type: 'pdf',   src: 'images/CaseStudy/PineApp Refresh Visual Design.pdf' },
      { name: 'Overview',              type: 'image', src: 'images/CaseStudy/Baptist.jpg' },
      { name: 'Research',              type: 'image', src: 'images/CaseStudy/PineApp Refresh with Research.jpg' },
    ]
  },
  tamm: {
    title: 'Conversational AI Design System',
    client: 'TAMM · Dubai Government',
    files: [
      { name: 'Full Case Study', type: 'pdf',   src: 'images/CaseStudy/TAMM.pdf' },
      { name: 'Overview',        type: 'image', src: 'images/CaseStudy/Tamm.png' },
    ]
  },
  goodyear: {
    title: 'B2C & B2B Website Redesign',
    client: 'Goodyear APAC',
    files: [
      { name: 'Full Case Study', type: 'pdf',   src: 'images/CaseStudy/Goodyear.pdf' },
      { name: 'Overview',        type: 'image', src: 'images/CaseStudy/Goodyear.png' },
    ]
  },
  vs: {
    title: 'Fashion e-Commerce Design System',
    client: "Victoria's Secret",
    files: [
      { name: 'Full Case Study', type: 'pdf',   src: 'images/CaseStudy/Victoria secret.pdf' },
      { name: 'Overview',        type: 'image', src: 'images/CaseStudy/VS.png' },
    ]
  },
};

let _currentCsProject = null;

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

  hideAiSummary();
  $('csf-ai-text').innerHTML = '';
  showCsFile(data.files[0]);

  $('cs-file-panel').classList.add('on');
  document.body.style.overflow = 'hidden';
}

function switchCsFileTab(idx) {
  const data = CASE_STUDY_FILES[_currentCsProject];
  if (!data) return;
  document.querySelectorAll('.csf-tab').forEach((t, i) => t.classList.toggle('active', i === idx));
  showCsFile(data.files[idx]);
  $('cs-file-body').scrollTop = 0;
}

function showCsFile(file) {
  const content = $('cs-file-content');
  if (file.type === 'image') {
    content.innerHTML = `<img src="${file.src}" alt="${file.name}" class="csf-image"/>`;
  } else {
    const isLocal = ['localhost','127.0.0.1'].includes(window.location.hostname);
    content.innerHTML = `
      <div class="csf-pdf-wrap">
        <iframe src="${file.src}" class="csf-pdf-frame" title="${file.name}"></iframe>
        ${isLocal ? `<div class="csf-pdf-actions">
          <a href="${file.src}" target="_blank" class="csf-btn csf-btn-primary">
            <i class="ti ti-external-link"></i> Open in new tab
          </a>
        </div>` : ''}
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

  const pid = _currentCsProject;
  if (!pid) return;

  // Serve from cache — no re-fetch needed
  if (_aiSummaryCache[pid]) {
    $('csf-ai-text').innerHTML = _aiSummaryCache[pid];
    return;
  }

  const project = DB?.projects?.find(p => p.id === pid);
  if (!project) { $('csf-ai-text').innerHTML = '<p>Could not load project data.</p>'; return; }

  $('csf-ai-text').innerHTML = `<div class="csf-ai-skel"><div class="csf-sk csf-sk-90"></div><div class="csf-sk csf-sk-100"></div><div class="csf-sk csf-sk-80"></div><div class="csf-sk csf-sk-70"></div></div>`;

  const query = `Write a 130-word professional summary of the "${project.name}" project by Siba Sankar Kabi. Focus on: the business challenge, Siba's specific role, the design approach taken, and the 2-3 most important measurable outcomes. Plain prose only — no bullet points, no markdown.`;
  const systemPrompt = `You are writing a UX case study brief. Use ONLY the data below. Do not invent facts.\nProject: "${project.name}"\nClient: ${project.client}\nRole: ${project.role}\nSummary: ${project.summary}\n${project.detail ? 'Detail: ' + project.detail.substring(0, 700) : ''}\nOutcomes: ${(project.outcomes || []).join('; ')}\nOutput: plain text, 130-150 words, no headers, no bullets.`;

  try {
    const r = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, systemPrompt })
    });
    if (r.ok) {
      const d = await r.json();
      if (d.text) {
        const clean = d.text.replace(/\|\|\|CHIPS:.*?\|\|\|/gs,'').replace(/\|\|\|FOLLOWUP:.*?\|\|\|/gs,'').trim();
        const html = `<p>${clean.replace(/\n\n+/g,'</p><p>')}</p>`;
        _aiSummaryCache[pid] = html;
        if (_currentCsProject === pid) $('csf-ai-text').innerHTML = html;
        return;
      }
    }
  } catch (_) {}

  // Fallback: build directly from project JSON — always project-specific
  const html = _buildCsSummaryFallback(project);
  _aiSummaryCache[pid] = html;
  if (_currentCsProject === pid) $('csf-ai-text').innerHTML = html;
}

function _buildCsSummaryFallback(project) {
  const parts = [];
  if (project.summary) parts.push(`<p>${project.summary}</p>`);
  if (project.detail) {
    const snippet = project.detail.split('. ').slice(0, 4).join('. ').trim();
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
  msg.innerHTML = `<div class="deepdive-msg-avatar">🎯</div><div class="deepdive-msg-content"><p style="font-size:14px;line-height:1.6;color:var(--t2);margin:0;">${text}</p></div>`;
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
  let txt = raw.replace(/\|\|\|CHIPS:.*?\|\|\|/gs,'').replace(/\|\|\|FOLLOWUP:.*?\|\|\|/gs,'').trim();
  txt = txt.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  txt = txt.split(/\n\n+/).map(p => p.trim()).filter(Boolean)
    .map(p => p.startsWith('<ul') || p.startsWith('<li') ? p : `<p>${p}</p>`).join('');
  return { txt, chips, fus: fus.slice(0, 3) };
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

  return `You are the personal AI agent for ${d.name}. Visitors come to this portfolio to understand who Siba is and what he can do. Make them feel like they talked to a knowledgeable colleague who knows Siba deeply.

VOICE: Conversational, not corporate. Use contractions. React naturally — if someone asks about a great project, be genuinely enthusiastic. Use phrases like "Oh, that one's worth a proper conversation" or "Here's what made this interesting". Never passive voice if active works. Never say "As an AI". Never write a press release or read from a CV.

STYLE: Third-person ("Siba's approach", "he ran", "his team") but feel like a sharp colleague saying it out loud, not a recruiter screen. Lead with the most interesting angle — not the job title. 2-3 sentence paragraphs. No jargon walls.

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
    if (r.ok) { const d = await r.json(); if (d.text) return d.text; }
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
    p.name.toLowerCase().split(' ').some(w => w.length > 3 && q.includes(w)) ||
    (p.client && p.client.toLowerCase().split(' ').some(w => w.length > 3 && q.includes(w)))
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
  } else if (/ai|tool|workflow|mcp|model context|figma make|claude/i.test(q)) {
    const tools = DB.skills.ai_tools.slice(0, 6);
    txt = `<p>Siba's not just using AI tools — he's changed how his whole ${cr.extended_team}-person studio works with them. He pioneered <strong>Model Context Protocol (MCP)</strong> training across the team, which cut ideation time by <strong>${m.ideation_speed_increase}</strong>.</p><ul>${tools.map(t => `<li><strong>${t.name}</strong> — ${t.use}</li>`).join('')}</ul><p>The philosophy: "AI isn't changing what we do — it's changing how fast." He lives that, doesn't just say it.</p>`;
    chips = ['Design process', 'Studio leadership', 'Baptist Healthcare'];
    fus   = ['How did MCP training change the studio output?', 'How has AI changed his approach to research?', 'What was the Baptist Healthcare project?'];
  } else if (/philosoph|approach|believe|passion|think/i.test(q)) {
    txt = `<p><em>"${ph.ai_belief}"</em></p><p><em>"${ph.design_belief}"</em></p><p>${ph.approach}</p>`;
    chips = ['Design process', 'AI workflow', 'Projects'];
    fus   = ['How does he translate that into how he leads?', 'Which project reflects his philosophy best?', 'What AI tools does he use daily?'];
  } else if (/team|lead|studio|manag|mentor|report/i.test(q)) {
    txt = `<p>Siba runs the <strong>${cr.studio}</strong> — <strong>${cr.direct_reports} direct reports</strong>, ${cr.extended_team} across the extended team. He personally runs <strong>${m.ux_interviews_per_year} UX interviews a year</strong>, which is how you actually maintain <strong>${m.team_retention} team retention</strong>.</p><p>On top of team delivery, he owns RFP strategy — 15+ led, driving a <strong>${m.rfp_acv_increase} ACV increase</strong>. He's managing up, managing across, and still doing the work.</p>`;
    chips = ['GEM Award', 'AI tools', 'Contact'];
    fus   = ['What approach does he take to design critique and mentorship?', 'How does he balance strategy with hands-on design?', 'How can I get in touch?'];
  } else if (/contact|reach|avail|email|phone|talk|connect/i.test(q)) {
    txt = `<p>Siba's ${d.availability.toLowerCase()}.</p><p>📧 <a href="mailto:${d.email}">${d.email}</a><br>📱 <a href="tel:${d.phone}">${d.phone}</a><br>💼 <a href="${d.linkedin}" target="_blank">LinkedIn</a><br>🌐 <a href="${d.portfolio}" target="_blank">${d.portfolio}</a></p><p>Email gets the fastest response — usually within a working day.</p>`;
    chips = ['Open to roles', 'Current studio', 'Portfolio'];
    fus   = ['What kind of role is he looking for?', 'What has he built at Capgemini?', 'Where can I see the case studies?'];
  } else if (/testimonial|colleague|say|recommend|peer|review/i.test(q)) {
    const [t1, t2] = DB.testimonials;
    txt = `<p>Here's what people who've worked closely with him say:</p><p><strong>${t1.name}</strong> (${t1.role}): <em>"${t1.text}"</em></p><p><strong>${t2.name}</strong> (${t2.role}): <em>"${t2.text}"</em></p>`;
    chips = ['Oracle work', 'Current role', 'Contact'];
    fus   = ['What did Siba work on at Oracle?', 'What is he doing now at Capgemini?', 'How do I reach him?'];
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
  const q = ($('ais-input').value || '').trim();
  doSearch(q);
}
function modalAsk() {
  const q = ($('modal-input').value || '').trim();
  if (q) { $('modal-q').textContent = q; resetModal(); $('modal-input').value = ''; doSearch(q); }
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
