/* ═══════════════════════════════════════════════════════════
   sankarkabi.co.in — Main JS
   Reads from data/siba.json — edit that file to update content
   ═══════════════════════════════════════════════════════════ */

let DB = null;   // holds parsed siba.json
let busy = false;

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
  buildExperience();
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
  const m = DB.impact_metrics;
  document.getElementById('hero-kicker').textContent = DB.current_role.studio.replace('Bengaluru ', '') + ' · Capgemini';
  document.getElementById('hero-name').innerHTML = `${d.name.split(' ')[0]}<br><em>${d.name.split(' ')[1]}</em>&nbsp;${d.name.split(' ')[2]}`;
  document.getElementById('hero-company').textContent = `${d.company} · ${DB.current_role.since.split(' ').slice(-2).join(' ')} – Present`;
  document.getElementById('hero-avail-text').textContent = 'Open to leadership roles';
  document.getElementById('hero-intro').textContent = DB.philosophy.approach.split('.')[0] + '. GEM Award winner. Enterprise UX across healthcare, automotive, fashion, and government.';

  // stats

}

function buildPills() {
  const row = document.getElementById('pill-row');
  if (!DB.quick_search_pills) return;
  row.innerHTML = DB.quick_search_pills.map(p =>
    `<button class="pill" onclick="qSearch(this)"><i class="ti ${p.icon}" aria-hidden="true"></i>${p.label}</button>`
  ).join('');
}

function buildAbout() {
  const p = DB.philosophy;
  document.getElementById('about-quote').textContent = `"${p.ai_belief}"`;
  document.getElementById('about-body').textContent = `Running a studio at Capgemini Bengaluru. Before that — Oracle, gaming startups, fashion e-commerce, maternity brands. Every project, the same north star: make it feel inevitable.`;

  // skill bars
  document.getElementById('skill-stack').innerHTML = DB.skills.proficiency.map(s =>
    `<div class="skill-row">
      <div class="skill-head"><span class="skill-name">${s.name}</span><span class="skill-pct">${s.pct}%</span></div>
      <div class="skill-track"><div class="skill-bar" data-pct="${s.pct}"></div></div>
    </div>`
  ).join('');

  // design tools
  document.getElementById('design-tools').innerHTML = DB.skills.design_tools.map(t => `<span class="tag">${t}</span>`).join('');

  // ai tools
  const aiToolsEl = document.getElementById('ai-tools');
  if (aiToolsEl) {
    aiToolsEl.innerHTML = DB.skills.ai_tools.map(t => `<span class="tag" title="${t.use}">${t.name}</span>`).join('');
  }

  // certifications
  document.getElementById('cred-list').innerHTML = DB.certifications.map((c,i) => {
    const icons = ['ti-certificate','ti-brand-google','ti-robot','ti-refresh','ti-cpu','ti-message-dots'];
    return `<div class="cred"><i class="ti ${icons[i] || 'ti-check'}" aria-hidden="true"></i>${c}</div>`;
  }).join('');
}

function buildNumbers() {
  const m = DB.impact_metrics;
  const items = [
    { n: m.rfp_acv_increase, l: 'Growth in annual contract value from RFP strategy', award: true },
    { n: m.dev_time_reduction, l: 'Less front-end build time — design systems at Goodyear & BHSF', award: false },
    { n: m.patient_bookings_increase, l: 'More patient bookings after the Baptist Healthcare redesign', award: false },
    { n: m.ideation_speed_increase, l: 'Faster ideation using Figma Make, Claude and UIZard', award: false }
  ];
  document.getElementById('num-grid').innerHTML = items.map((it, i) =>
    `<div class="num-card r${i ? ' d'+i : ''}">
      <div class="num-n">${it.n.replace('%','<em>%</em>').replace('+','<em>+</em>')}</div>
      <div class="num-l">${it.l}</div>
      ${it.award ? `<div class="num-award"><i class="ti ti-award" aria-hidden="true"></i>GEM Award</div>` : ''}
    </div>`
  ).join('');
}

function buildWork() {
  const featured = DB.projects.filter(p => p.featured);
  const rest     = DB.projects.filter(p => !p.featured && p.image).slice(0,3);

  let html = '';
  featured.forEach(p => {
    html += workCard(p, true);
  });
  rest.forEach((p,i) => {
    html += workCard(p, false, i);
  });
  document.getElementById('work-grid').innerHTML = html;
}

function workCard(p, wide, delay = 0) {
  const imgHtml = p.image
    ? `<img src="${p.image}" alt="${p.name}" loading="lazy"/>`
    : `<div class="thumb-grad"></div>`;
  return `
  <div class="card${wide ? ' wide' : ''} r${delay ? ' d'+delay : ''}" data-project-id="${p.id}" onclick="openProjectModal('${p.id}')">
    <div class="card-thumb">
      ${imgHtml}
      <div class="thumb-grad"></div>
      <span class="thumb-chip">${p.tags.slice(0,2).join(' · ')}</span>
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

function buildExperience() {
  const el = document.getElementById('exp-list');
  if (!el) return;

  el.innerHTML = DB.work_history.map((j, i) => `
    <div class="xcard r${i ? ' d'+Math.min(i,4) : ''}" data-org="${j.org}">
      <div class="xcard-top">
        <div class="xrole">${j.role}</div>
        <div class="xperiod">${j.period}</div>
      </div>
      <div class="xorg"><i class="ti ti-building" aria-hidden="true"></i>${j.company}</div>
      <div class="xdesc">${j.desc}</div>
      <div class="xchips">${j.chips.map((c,ci) =>
        ci === 0 && j.org === 'cap'
          ? `<span class="xchip award"><i class="ti ti-award" aria-hidden="true"></i>${c}</span>`
          : `<span class="xchip">${c}</span>`
      ).join('')}</div>
    </div>`
  ).join('');
}

function buildPortfolio() {
  const icons = ['ti-device-mobile','ti-star','ti-briefcase','ti-building-community','ti-plant','ti-app-window','ti-shopping-cart','ti-plane','ti-layout-dashboard','ti-vector','ti-icons','ti-file-description'];
  document.getElementById('port-grid').innerHTML = DB.portfolio_items.map((item, i) => `
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

function buildTestimonials() {
  document.getElementById('tgrid').innerHTML = DB.testimonials.map((t, i) => `
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

function buildContact() {
  const d = DB.identity;
  const links = [
    { icon:'ti-mail',           href:`mailto:${d.email}`,   lbl:'Email',     val:d.email },
    { icon:'ti-phone',          href:`tel:${d.phone}`,       lbl:'Phone',     val:d.phone },
    { icon:'ti-brand-linkedin', href:d.linkedin,             lbl:'LinkedIn',  val:'linkedin.com/in/siba-sankar-kabi', target:'_blank' },
    { icon:'ti-world',          href:d.portfolio,            lbl:'Portfolio', val:'sankarkabi.co.in', target:'_blank' },
    { icon:'ti-brand-behance',  href:d.behance,              lbl:'Behance',   val:'behance.net/sankarkabi', target:'_blank' }
  ];
  document.getElementById('contact-links').innerHTML = links.map(l =>
    `<div class="citem" href="${l.href}" ${l.target ? `target="${l.target}"` : ''}>
      
      <div><div class="clbl">${l.lbl}</div><div class="cval">${l.val}</div></div>
    </div>`
  ).join('');
}

function buildFooter() {
  const d = DB.identity;
  document.getElementById('foot-name').textContent = d.name;
  document.getElementById('foot-copy').textContent = `© 2026 · UX Design Leader · ${d.location.split(',')[0]}`;
}

/* ── INTERACTIVE ── */
function initTicker() {
  const el = document.getElementById('ticker');
  if (el) el.innerHTML += el.innerHTML;
}

function initReveal() {
  const obs = new IntersectionObserver(es => {
    es.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
  }, { threshold: 0.07 });
  document.querySelectorAll('.r').forEach(el => obs.observe(el));
}

loadDB();

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
const $ = id => document.getElementById(id);
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

  const modal = $('project-modal');
  const modalBg = $('project-modal-bg');
  
  // Populate modal content
  $('project-modal-image').src = project.image || '';
  $('project-modal-title').textContent = project.name;
  $('project-modal-client').textContent = project.client;
  $('project-modal-role').textContent = project.role;
  $('project-modal-summary').textContent = project.summary;
  $('project-modal-detail').innerHTML = `<p>${project.detail}</p>`;
  
  // Outcomes list
  const outcomesHtml = project.outcomes.map(o => `<li>${o}</li>`).join('');
  $('project-modal-outcomes').innerHTML = outcomesHtml;
  
  // Tags
  const tagsHtml = project.tags.map(t => `<span class="ptag">${t}</span>`).join('');
  $('project-modal-tags').innerHTML = tagsHtml;
  
  // Behance link
  const behanceBtn = $('project-modal-behance');
  if (project.behance) {
    behanceBtn.href = project.behance;
    behanceBtn.style.display = 'inline-flex';
  } else {
    behanceBtn.style.display = 'none';
  }
  
  // Show Deep-Dive button only if project has case study data
  const deepDiveBtn = $('project-modal-deepdive');
  if (project.case_study) {
    deepDiveBtn.style.display = 'inline-flex';
  } else {
    deepDiveBtn.style.display = 'none';
  }
  
  // Store current project for Deep-Dive agent
  window.currentProjectId = projectId;
  
  // Show modal
  modalBg.classList.add('on');
  modal.classList.add('on');
  document.body.style.overflow = 'hidden';
}

function closeProjectModal() {
  const modal = $('project-modal');
  const modalBg = $('project-modal-bg');
  modalBg.classList.remove('on');
  modal.classList.remove('on');
  document.body.style.overflow = '';
}

/* ══════════════════════════════════════════════════════════
   AGENT 2 — CASE STUDY DEEP-DIVE
   Per-project conversational AI — ask about process, decisions, challenges
   ══════════════════════════════════════════════════════════ */

let currentDeepDiveProject = null;

function openDeepDiveAgent() {
  const projectId = window.currentProjectId;
  const project = DB.projects.find(p => p.id === projectId);
  
  if (!project || !project.case_study) return;
  
  currentDeepDiveProject = project;
  
  // Set up the modal header
  $('deepdive-project-name').textContent = project.name;
  $('deepdive-project-role').textContent = `${project.client} · ${project.role}`;
  
  // Clear messages (except initial greeting)
  const messagesContainer = $('deepdive-messages');
  messagesContainer.innerHTML = `
    <div class="deepdive-message agent-msg" style="margin-bottom:16px;">
      <div class="deepdive-msg-avatar">🎯</div>
      <div class="deepdive-msg-content">
        <p style="font-size:14px;line-height:1.6;color:var(--t2);margin:0;">
          Hi! I'm here to discuss every detail of how the ${project.name} project came together — from research and strategy to design decisions and outcomes. Ask me anything about the process, challenges, team, methodology, or learnings.
        </p>
      </div>
    </div>
  `;
  
  // Clear input
  $('deepdive-input').value = '';
  $('deepdive-input').focus();
  
  // Show modal
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
  
  // Clear input
  input.value = '';
  
  // Add user message to chat
  const messagesContainer = $('deepdive-messages');
  const userMsg = document.createElement('div');
  userMsg.className = 'deepdive-message user-msg';
  userMsg.innerHTML = `
    <div class="deepdive-msg-avatar">👤</div>
    <div class="deepdive-msg-content">${escapeHtml(question)}</div>
  `;
  messagesContainer.appendChild(userMsg);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  // Show loading state
  const btn = $('deepdive-send-btn');
  btn.classList.add('busy');
  btn.disabled = true;
  busy = true;
  
  // Build context from case study
  const caseStudy = currentDeepDiveProject.case_study;
  const context = `
Project: ${currentDeepDiveProject.name}
Client: ${currentDeepDiveProject.client}
Role: ${currentDeepDiveProject.role}

Challenge: ${caseStudy.challenge}

Research: ${JSON.stringify(caseStudy.research, null, 2)}

Strategy: ${caseStudy.strategy}

Design Approach: ${caseStudy.design_approach}

Team: ${JSON.stringify(caseStudy.team, null, 2)}

Timeline: ${caseStudy.timeline}

Key Decisions: ${JSON.stringify(caseStudy.key_decisions, null, 2)}

Methodology: ${caseStudy.design_methodology}

Tools Used: ${JSON.stringify(caseStudy.tools, null, 2)}

Key Outcomes: ${JSON.stringify(caseStudy.launch_impact, null, 2)}

Learnings: ${JSON.stringify(caseStudy.learnings, null, 2)}

AI Methodology: ${caseStudy.ai_methodology || 'N/A'}
`;
  
  try {
    // Try server-side proxy first
    const response = await fetch('/api/claude', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context: context,
        question: question,
        system: 'You are Siba Sankar Kabi, and you are being interviewed about the detailed process behind one of your case study projects. Answer from Siba\'s perspective with specific details from the case study. Be conversational, detailed, and share reasoning behind decisions. Show strategic thinking and trade-offs you made. Keep responses concise but insightful (2-4 sentences). Answer as if you\'re actually recounting your experience.'
      })
    });
    
    if (response.ok) {
      const data = await response.json();
      const answer = data.answer || data.text || 'I couldn\'t generate a response. Please try again.';
      addAgentMessage(answer);
      btn.classList.remove('busy');
      btn.disabled = false;
      busy = false;
      input.focus();
      return;
    }
  } catch (e) {
    console.log('API unavailable, using local fallback');
  }
  
  // Fallback: intelligent local answer from case study
  const answer = generateCaseStudyAnswer(question, caseStudy, currentDeepDiveProject);
  addAgentMessage(answer);
  
  btn.classList.remove('busy');
  btn.disabled = false;
  busy = false;
  input.focus();
}

function addAgentMessage(text) {
  const messagesContainer = $('deepdive-messages');
  const agentMsg = document.createElement('div');
  agentMsg.className = 'deepdive-message agent-msg';
  agentMsg.innerHTML = `
    <div class="deepdive-msg-avatar">🎯</div>
    <div class="deepdive-msg-content">
      <p style="font-size:14px;line-height:1.6;color:var(--t2);margin:0;">${text}</p>
    </div>
  `;
  messagesContainer.appendChild(agentMsg);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function generateCaseStudyAnswer(question, caseStudy, project) {
  const q = question.toLowerCase();
  let answer = '';
  
  // Challenge questions
  if (q.includes('challenge') || q.includes('problem') || q.includes('issue')) {
    answer = `The main challenge was: ${caseStudy.challenge} This is what shaped the entire strategy and approach.`;
  }
  // Research questions
  else if (q.includes('research') || q.includes('interview') || q.includes('user') || q.includes('discover')) {
    answer = `We did ${caseStudy.research.phase} of research using methods like ${caseStudy.research.methods.slice(0, 2).join(', ')}. Key finding: ${caseStudy.research.key_findings}`;
  }
  // Strategy questions
  else if (q.includes('strategy') || q.includes('approach') || q.includes('how did you')) {
    answer = `The strategy was: ${caseStudy.strategy} We approached it with ${caseStudy.design_approach}`;
  }
  // Team & timeline
  else if (q.includes('team') || q.includes('people') || q.includes('size')) {
    answer = `The team had ${caseStudy.team.size} people: ${caseStudy.team.structure}. We completed the project in ${caseStudy.timeline}.`;
  }
  // Decisions
  else if (q.includes('decision') || q.includes('trade') || q.includes('why')) {
    const decisions = caseStudy.key_decisions;
    if (decisions.length > 0) {
      const d = decisions[0];
      answer = `A key decision was: ${d.decision}. We made this because "${d.reasoning}". The trade-off was: ${d.trade_off}`;
    }
  }
  // Tools
  else if (q.includes('tool') || q.includes('figma') || q.includes('ai') || q.includes('software')) {
    answer = `We used tools like ${caseStudy.tools.slice(0, 3).join(', ')}. ${project.ai_tools_used && project.ai_tools_used.length > 0 ? `For AI, we leveraged ${project.ai_tools_used.join(' and ')}.` : ''}`;
  }
  // Outcomes & impact
  else if (q.includes('outcome') || q.includes('result') || q.includes('impact') || q.includes('metric')) {
    const impact = caseStudy.launch_impact;
    const outcomes = Object.entries(impact).map(([k, v]) => `${v}`).slice(0, 2).join(', ');
    answer = `The outcomes were significant: ${outcomes}. These metrics were tracked from day one and verified post-launch.`;
  }
  // Learnings
  else if (q.includes('learn') || q.includes('takeaway') || q.includes('insight')) {
    answer = `Key learning: ${caseStudy.learnings[0]} Also, ${caseStudy.learnings[1] || 'this reinforced the importance of user-centered thinking.'}`;
  }
  // Default
  else {
    answer = `Based on the ${project.name} case study: ${caseStudy.detail || caseStudy.summary}. Ask me about the research, strategy, team, decisions, tools, or outcomes!`;
  }
  
  return answer || 'I\'m here to discuss this project in detail. Ask about the research, challenges, design decisions, team, tools, or outcomes!';
}

async function sendDeepDiveQuestion_OLD() {
  if (!currentDeepDiveProject || busy) return;
  
  const input = $('deepdive-input');
  const question = input.value.trim();
  if (!question) return;
  
  // Clear input
  input.value = '';
  
  // Add user message to chat
  const messagesContainer = $('deepdive-messages');
  const userMsg = document.createElement('div');
  userMsg.className = 'deepdive-message user-msg';
  userMsg.innerHTML = `
    <div class="deepdive-msg-avatar">👤</div>
    <div class="deepdive-msg-content">${escapeHtml(question)}</div>
  `;
  messagesContainer.appendChild(userMsg);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  
  // Show loading state
  const btn = $('deepdive-send-btn');
  btn.classList.add('busy');
  btn.disabled = true;
  busy = true;
  
  // Build context from case study
  const caseStudy = currentDeepDiveProject.case_study;
  const context = `
Project: ${currentDeepDiveProject.name}
Client: ${currentDeepDiveProject.client}
Role: ${currentDeepDiveProject.role}

Challenge: ${caseStudy.challenge}

Research: ${JSON.stringify(caseStudy.research, null, 2)}

Strategy: ${caseStudy.strategy}

Design Approach: ${caseStudy.design_approach}

Team: ${JSON.stringify(caseStudy.team, null, 2)}

Timeline: ${caseStudy.timeline}
Phases: ${JSON.stringify(caseStudy.phases, null, 2)}

Key Decisions: ${JSON.stringify(caseStudy.key_decisions, null, 2)}

Methodology: ${caseStudy.design_methodology}

Tools Used: ${JSON.stringify(caseStudy.tools, null, 2)}

Key Outcomes: ${JSON.stringify(caseStudy.launch_impact, null, 2)}

Learnings: ${JSON.stringify(caseStudy.learnings, null, 2)}

AI Methodology: ${caseStudy.ai_methodology || 'N/A'}
`;

// Helper to escape HTML
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Allow Enter to send message
document.addEventListener('DOMContentLoaded', () => {
  const deepDiveInput = $('deepdive-input');
  if (deepDiveInput) {
    deepDiveInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendDeepDiveQuestion();
      }
    });
  }
});

/* ══════════════════════════════════════════════════════════
   AI AGENT — reads ONLY from data/siba.json
   Visitors feel like they're talking to Siba's real agent.
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
  let txt = raw
    .replace(/\|\|\|CHIPS:.*?\|\|\|/gs, '')
    .replace(/\|\|\|FOLLOWUP:.*?\|\|\|/gs, '')
    .trim();
  txt = txt.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  txt = txt.split(/\n\n+/).map(p => p.trim()).filter(Boolean)
    .map(p => p.startsWith('<ul') || p.startsWith('<li') ? p : `<p>${p}</p>`).join('');
  return { txt, chips, fus: fus.slice(0, 3) };
}

/* Build system prompt dynamically from siba.json */
function buildSystemPrompt() {
  if (!DB) return '';
  const d  = DB.identity;
  const cr = DB.current_role;
  const m  = DB.impact_metrics;
  const ph = DB.philosophy;

  const projectSummaries = DB.projects.map(p =>
    `${p.name} (${p.client}, ${p.role}): ${p.summary} Outcomes: ${p.outcomes.join('; ')}.`
  ).join('\n');

  const aiTools = DB.skills.ai_tools.map(t => `${t.name} — ${t.use}`).join(', ');
  const certs   = DB.certifications.join('; ');
  const testimonials = DB.testimonials.map(t => `${t.name} (${t.role}): "${t.text}"`).join('\n');

  return `You are the personal AI agent for ${d.name}. Visitors come to this portfolio to understand who Siba is and what he can do. Your job is to make them feel like they just had a conversation with a knowledgeable colleague who knows Siba deeply and personally.

PERSONALITY & TONE:
- Warm, confident, specific. Never generic or corporate.
- Speak in third-person-adjacent: "Siba's approach here was...", "That project is a good example of how he..."
- Reference real project names, real numbers, real tools — always.
- Short paragraphs (2-3 sentences max each). Conversational flow.
- Never say "As an AI" or "I don't have real-time data". Just answer naturally.
- If someone is clearly a recruiter or potential client, be especially helpful and warm.
- Use bullet points ONLY when listing 4 or more discrete items. Otherwise, flowing prose.
- Sound like a person who genuinely admires and knows Siba's work.

SIBA'S FULL PROFILE (from his personal knowledge base):

IDENTITY:
Name: ${d.name}
Current role: ${cr.title} at ${cr.company}
Studio: ${cr.studio}
Location: ${d.location}
Experience: ${d.experience_years} years
Contact: ${d.email} | ${d.phone}
LinkedIn: ${d.linkedin}
Portfolio: ${d.portfolio}
Availability: ${d.availability}

PHILOSOPHY:
Design belief: "${ph.design_belief}"
AI belief: "${ph.ai_belief}"
Approach: ${ph.approach}

CURRENT ROLE AT CAPGEMINI (since ${cr.since}):
- Directly manages ${cr.direct_reports} UX designers, strategic oversight of ${cr.extended_team} professionals
- ${cr.responsibilities.join('\n- ')}

IMPACT METRICS (verified, exact numbers — never invent new ones):
- ACV increase from RFP leadership: ${m.rfp_acv_increase}
- Front-end dev time reduction: ${m.dev_time_reduction}
- Patient bookings increase (Baptist Healthcare): ${m.patient_bookings_increase}
- Faster ideation with AI tools: ${m.ideation_speed_increase}
- B2B support ticket reduction (TAMM Dubai): ${m.support_ticket_reduction}
- Team retention: ${m.team_retention}
- UX interviews per year: ${m.ux_interviews_per_year}
- RFPs led: ${m.rfps_led}

AWARDS:
${DB.awards.map(a => `- ${a.name}: ${a.reason}`).join('\n')}

KEY PROJECTS:
${projectSummaries}

AI TOOL STACK:
${aiTools}

CERTIFICATIONS: ${certs}

TESTIMONIALS FROM COLLEAGUES:
${testimonials}

FORMAT RULES:
- 130–220 words per answer. Be specific and personal, not encyclopedic.
- Bold key facts, project names, and numbers using **bold**.
- Use bullet lists only for 4+ items. Otherwise use natural paragraphs.
- Sound like a real person, not a search result.
- End EVERY response with exactly: |||CHIPS:topic1,topic2,topic3|||FOLLOWUP:q1?|q2?|q3?|||
  (chips = 3 short clickable topics the visitor might explore; followup = 3 natural questions they might ask next)
- Never invent facts, metrics, or projects not in this knowledge base.`;
}

async function callAgent(query) {
  const systemPrompt = buildSystemPrompt();

  // Try server-side proxy first (keeps API key secure)
  try {
    const r = await fetch('/api/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, systemPrompt })
    });
    if (r.ok) {
      const d = await r.json();
      if (d.text) return d.text;
    }
  } catch (_) {}

  // Fallback: rich local answers built entirely from siba.json
  return localAnswer(query);
}

/* ── LOCAL ANSWER ENGINE — reads from DB (siba.json) ── */
function localAnswer(query) {
  if (!DB) return 'Knowledge base not loaded yet. Please refresh the page and try again.';
  const q  = query.toLowerCase();
  const d  = DB.identity;
  const m  = DB.impact_metrics;
  const ph = DB.philosophy;
  const cr = DB.current_role;

  let txt = '', chips = [], fus = [];

  // project match — scan all projects from JSON
  const matchedProject = DB.projects.find(p =>
    q.includes(p.id) ||
    p.name.toLowerCase().split(' ').some(w => w.length > 3 && q.includes(w.toLowerCase())) ||
    (p.client && p.client.toLowerCase().split(' ').some(w => w.length > 3 && q.includes(w.toLowerCase())))
  );

  if (matchedProject) {
    const p = matchedProject;
    txt = `<p>The <strong>${p.name}</strong> project is one of the more meaningful things Siba has shipped. Working as <strong>${p.role}</strong>, ${p.summary.charAt(0).toLowerCase() + p.summary.slice(1)}</p>`;
    if (p.detail) txt += `<p>${p.detail}</p>`;
    if (p.outcomes && p.outcomes.length) {
      txt += `<p>The outcomes that came from it:</p><ul>${p.outcomes.map(o => `<li>${o}</li>`).join('')}</ul>`;
    }
    if (p.behance) txt += `<p>Full case study: <a href="${p.behance}" target="_blank">${p.behance}</a></p>`;
    chips = ['Impact metrics', 'Design systems', 'AI workflow'];
    fus   = ['What other projects has Siba led?', 'How does he use AI in his design process?', 'What awards has his work won?'];

  } else if (q.includes('gem') || q.includes('award') || q.includes('win')) {
    const award1 = DB.awards[0];
    const award2 = DB.awards[1];
    txt = `<p>Siba received the <strong>${award1.name}</strong> at Capgemini. ${award1.reason}.</p><p>${award2.name}: ${award2.reason}.</p><p>Both recognitions came from sustained, measurable impact over time — not a single project moment.</p>`;
    chips = ['Baptist Healthcare', 'Business results', 'Current studio role'];
    fus   = ['What was the Pine App project?', 'What does Siba lead at Capgemini?', 'What other results has he driven?'];

  } else if (q.includes('ai') || q.includes('tool') || q.includes('workflow') || q.includes('mcp') || q.includes('figma make') || q.includes('claude')) {
    const tools = DB.skills.ai_tools.slice(0, 6);
    txt = `<p>Siba has built a genuinely AI-augmented workflow — not just adding tools, but rethinking how fast design moves. His stack includes:</p><ul>${tools.map(t => `<li><strong>${t.name}</strong> — ${t.use}</li>`).join('')}</ul><p>He also pioneered <strong>MCP (Model Context Protocol) training</strong> for the entire ${cr.extended_team}-person studio — embedding AI into the team's rhythm. The outcome: <strong>${m.ideation_speed_increase} faster ideation</strong> across the studio.</p>`;
    chips = ['Design process', 'Studio leadership', 'Baptist Healthcare'];
    fus   = ['What is MCP and why does it matter?', 'How has AI changed his approach to projects?', 'What was the Baptist Healthcare project?'];

  } else if (q.includes('philosoph') || q.includes('approach') || q.includes('believe') || q.includes('passion') || q.includes('think')) {
    txt = `<p>Siba's work is grounded in two beliefs. First: <em>"${ph.ai_belief}"</em> And second: <em>"${ph.design_belief}"</em></p><p>${ph.approach}</p><p>His passions include ${ph.passions.slice(0,3).join(', ')} — things that show up in how he runs projects, how he mentors, and how he talks about craft.</p>`;
    chips = ['Design process', 'AI workflow', 'Projects'];
    fus   = ['How does he lead his studio team?', 'What projects reflect this philosophy best?', 'What AI tools does he use?'];

  } else if (q.includes('team') || q.includes('lead') || q.includes('studio') || q.includes('manag') || q.includes('mentor')) {
    txt = `<p>Siba runs the <strong>${cr.studio}</strong> at ${cr.company} — <strong>${cr.direct_reports} direct reports</strong>, ${cr.extended_team} across the extended team. His approach is rooted in structured career pathing and genuine investment in people's growth, which explains the <strong>${m.team_retention} team retention</strong>.</p><p>He leads regular creative sessions and design critiques, runs <strong>${m.ux_interviews_per_year} UX hiring interviews a year</strong>, and pioneered AI and MCP training for the whole studio. For major RFPs, he leads the UX strategy himself — contributing to a <strong>${m.rfp_acv_increase} ACV increase</strong>.</p>`;
    chips = ['GEM Award', 'AI tools', 'Contact Siba'];
    fus   = ['What awards has his studio work won?', 'How does he use AI in the studio?', 'How can I get in touch?'];

  } else if (q.includes('cert') || q.includes('qualif') || q.includes('google') || q.includes('hfi') || q.includes('scrum')) {
    txt = `<p>Siba holds these certifications:</p><ul>${DB.certifications.map(c => `<li>${c}</li>`).join('')}</ul><p>The HFI CXA and Agile Scrum credentials speak to the rigour he brings to user research and delivery. The AI certifications — Google AI and Claude Code in Action — are the ones he's most actively applying in studio practice right now.</p>`;
    chips = ['AI workflow', 'Design process', 'Current role'];
    fus   = ['What is his educational background?', 'What AI tools does he use?', 'What is his current role at Capgemini?'];

  } else if (q.includes('contact') || q.includes('reach') || q.includes('hire') || q.includes('avail') || q.includes('email') || q.includes('phone')) {
    txt = `<p>Siba is ${d.availability.toLowerCase()}.</p><p>The best ways to reach him:<br>📧 <a href="mailto:${d.email}">${d.email}</a><br>📱 <a href="tel:${d.phone}">${d.phone}</a><br>💼 <a href="${d.linkedin}" target="_blank">LinkedIn</a><br>🌐 <a href="${d.portfolio}" target="_blank">${d.portfolio}</a></p><p>He typically responds within a working day.</p>`;
    chips = ['Open to roles', 'Current studio', 'Portfolio'];
    fus   = ['What kind of roles is he looking for?', 'What has he built at Capgemini?', 'Where can I see more of his work?'];

  } else if (q.includes('colleague') || q.includes('say') || q.includes('recommend') || q.includes('testimonial') || q.includes('peer') || q.includes('review')) {
    const t1 = DB.testimonials[0];
    const t2 = DB.testimonials[1];
    txt = `<p><strong>${t1.name}</strong> (${t1.role}) said: <em>"${t1.text}"</em></p><p><strong>${t2.name}</strong> (${t2.role}) added: <em>"${t2.text}"</em></p><p>Both worked with Siba at Oracle — and both called him out as someone who made the team and the product better.</p>`;
    chips = ['Oracle work', 'Current role', 'Contact'];
    fus   = ['What did Siba work on at Oracle?', 'What is he doing now at Capgemini?', 'How do I get in touch?'];

  } else if (q.includes('who') || q.includes('about') || q.includes('introduce') || q.includes('tell me') || q.includes('background')) {
    txt = `<p>Siba Sankar Kabi is a design leader with <strong>${d.experience_years} years</strong> building digital experiences across healthcare, e-commerce, automotive, FMCG, and enterprise SaaS. He currently heads the <strong>${cr.studio}</strong> at ${cr.company} — managing a ${cr.extended_team}-person team and driving enterprise UX transformation.</p><p>He's a <strong>GEM Award winner</strong> and a hands-on advocate for AI-augmented design. His guiding belief: <em>"${ph.design_belief}"</em></p><p>Ask me about any specific project, his process, how he leads, or how to reach him.</p>`;
    chips = ['Projects', 'AI tools', 'Contact'];
    fus   = [`Tell me about the ${DB.projects[0].name} project`, 'How does he use AI in his work?', `What does he lead at ${cr.company}?`];

  } else {
    txt = `<p>Great question. Siba Sankar Kabi is a design leader with <strong>${d.experience_years} years</strong> shaping digital experiences for healthcare, automotive, fashion, and enterprise. He runs the <strong>${cr.studio}</strong> — a ${cr.extended_team}-person team — and is a <strong>GEM Award winner</strong> at Capgemini.</p><p>I can tell you about any of his specific projects, his AI workflow, his leadership approach, certifications, or how to get in touch. What would be most useful?</p>`;
    chips = ['Projects', 'AI tools', 'Contact'];
    fus   = [`What was the ${DB.projects[0].name} project?`, 'How does he use AI in his work?', 'What are his key business results?'];
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
    a.innerHTML = txt; a.style.display = 'block';
    if (chips.length) {
      const el = $('modal-chips');
      chips.forEach(c => {
        const b = document.createElement('button');
        b.className = 'm-chip'; b.textContent = c;
        b.onclick = () => { $('modal-q').textContent = c; resetModal(); doSearch(c); };
        el.appendChild(b);
      });
      $('modal-chips-wrap').style.display = 'block';
    }
    if (fus.length) {
      const el = $('modal-fu');
      fus.forEach(q => {
        const b = document.createElement('button');
        b.className = 'fu-item';
        b.innerHTML = `<div class="fu-ico"><i class="ti ti-question-mark" aria-hidden="true"></i></div><div class="fu-txt">${q}</div><i class="ti ti-arrow-right fu-arr" aria-hidden="true"></i>`;
        b.onclick = () => { $('modal-q').textContent = q; resetModal(); doSearch(q); };
        el.appendChild(b);
      });
      $('modal-fu-wrap').style.display = 'block';
    }
    document.querySelector('.modal-body').scrollTop = 0;
  } catch (e) {
    $('modal-skel').style.display = 'none';
    const a = $('modal-ans');
    a.innerHTML = '<p>Something went wrong. Please try again in a moment.</p>';
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
  $('ais-input').value = q;
  doSearch(q);
}

/* ── KEYBOARD SHORTCUTS ── */
$('ais-input').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); runSearch(); } });
$('modal-input').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); modalAsk(); } });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && $('modal').classList.contains('on')) closeModal();
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    if ($('modal').classList.contains('on')) return;
    $('ais-input').focus(); $('ais-input').select();
  }
});

/* ── BOOT ── */
document.addEventListener('DOMContentLoaded', loadDB);
