import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ── Config ────────────────────────────────────────────────────────────────────
const APP_URL = 'https://app.robosgig.com';
const API_URL = 'https://api.robosgig.com';

// ── Support chat ──────────────────────────────────────────────────────────────
const chatToggle = document.getElementById('chat-toggle');
const chatPanel  = document.getElementById('chat-panel');
const chatInput  = document.getElementById('chat-input');
const chatSend   = document.getElementById('chat-send');
const chatMsgs   = document.getElementById('chat-messages');
const iconOpen   = document.getElementById('chat-icon-open');
const iconClose  = document.getElementById('chat-icon-close');

let chatHistory = [];
let chatBusy = false;

chatToggle.addEventListener('click', () => {
  const open = chatPanel.classList.toggle('hidden') === false;
  iconOpen.style.display  = open ? 'none' : '';
  iconClose.style.display = open ? '' : 'none';
  if (open) chatInput.focus();
});

function appendMsg(text, role) {
  const el = document.createElement('div');
  el.className = `msg msg-${role === 'user' ? 'user' : 'bot'}`;
  el.textContent = text;
  chatMsgs.appendChild(el);
  chatMsgs.scrollTop = chatMsgs.scrollHeight;
  return el;
}

function showTyping() {
  const el = document.createElement('div');
  el.className = 'msg msg-bot msg-typing';
  el.innerHTML = '<span></span><span></span><span></span>';
  el.id = 'typing-indicator';
  chatMsgs.appendChild(el);
  chatMsgs.scrollTop = chatMsgs.scrollHeight;
}

function hideTyping() {
  document.getElementById('typing-indicator')?.remove();
}

async function sendMessage() {
  const text = chatInput.value.trim();
  if (!text || chatBusy) return;

  chatBusy = true;
  chatSend.disabled = true;
  chatInput.value = '';
  chatInput.style.height = '';

  appendMsg(text, 'user');
  chatHistory.push({ role: 'user', content: text });
  showTyping();

  try {
    const res = await fetch(`${API_URL}/api/support/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ history: chatHistory }),
    });
    const data = await res.json();
    hideTyping();
    appendMsg(data.reply, 'bot');
    chatHistory.push({ role: 'assistant', content: data.reply });
  } catch {
    hideTyping();
    appendMsg('Sorry, something went wrong. Please try again.', 'bot');
  }

  chatBusy = false;
  chatSend.disabled = false;
  chatInput.focus();
}

chatSend.addEventListener('click', sendMessage);
chatInput.addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
});
chatInput.addEventListener('input', () => {
  chatInput.style.height = 'auto';
  chatInput.style.height = Math.min(chatInput.scrollHeight, 100) + 'px';
});

// Wire all links that use data-href
document.querySelectorAll('[data-href]').forEach(el => {
  const path = el.getAttribute('data-href');
  el.setAttribute('href', APP_URL + path);
});

// ── Hero entrance ─────────────────────────────────────────────────────────────
const ease = 'power3.out';
const tl = gsap.timeline({ defaults: { ease, duration: 0.9 } });

tl.fromTo('#eyebrow',   { opacity: 0, y: 20 }, { opacity: 1, y: 0 })
  .fromTo('#line1',     { y: '110%', opacity: 0 }, { y: '0%', opacity: 1 }, '-=0.5')
  .fromTo('#line2',     { y: '110%', opacity: 0 }, { y: '0%', opacity: 1 }, '-=0.7')
  .fromTo('#hero-sub',  { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8 }, '-=0.5')
  .fromTo('#hero-ctas', { opacity: 0, y: 20 }, { opacity: 1, y: 0 }, '-=0.6')
  .fromTo('#trust-row', { opacity: 0, y: 16 }, { opacity: 1, y: 0 }, '-=0.6')
  .fromTo('#hero-visual', { opacity: 0 }, { opacity: 1, duration: 0.5 }, '-=1')
  .fromTo(['.jc-1','.jc-2','.jc-3'],
    { opacity: 0, y: 40, scale: 0.92 },
    { opacity: 1, y: 0, scale: 1, stagger: 0.12, ease: 'back.out(1.4)' }, '-=0.3')
  .fromTo('#ai-badge',
    { opacity: 0, scale: 0.8, y: 10 },
    { opacity: 1, scale: 1, y: 0, ease: 'back.out(2)' }, '-=0.2');

// Floating cards loop
gsap.to('.jc-1', { y: -10, duration: 3,   ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 0 });
gsap.to('.jc-2', { y: -7,  duration: 3.5, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 0.5 });
gsap.to('.jc-3', { y: -12, duration: 2.8, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1 });
gsap.to('#ai-badge', { y: -5, duration: 2, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 0.3 });

// Count-up
document.querySelectorAll('.trust-num[data-target]').forEach(el => {
  const target = parseInt(el.dataset.target);
  gsap.to({ val: 0 }, {
    val: target, duration: 2, ease: 'power2.out', delay: 1,
    onUpdate: function () { el.textContent = Math.round(this.targets()[0].val).toString(); },
  });
});

// ── ScrollTrigger ─────────────────────────────────────────────────────────────
gsap.fromTo('.step',
  { opacity: 0, y: 50 },
  { opacity: 1, y: 0, duration: 0.7, stagger: 0.15, ease,
    scrollTrigger: { trigger: '.how', start: 'top 75%' } });

gsap.fromTo('.step-arrow',
  { opacity: 0, x: -10 },
  { opacity: 1, x: 0, duration: 0.5, stagger: 0.2,
    scrollTrigger: { trigger: '.how', start: 'top 70%' } });

document.querySelectorAll('.section-title').forEach(el => {
  gsap.fromTo(el, { opacity: 0, y: 30 },
    { opacity: 1, y: 0, duration: 0.8, ease, scrollTrigger: { trigger: el, start: 'top 85%' } });
});

document.querySelectorAll('.section-eyebrow').forEach(el => {
  gsap.fromTo(el, { opacity: 0, x: -15 },
    { opacity: 1, x: 0, duration: 0.6, ease, scrollTrigger: { trigger: el, start: 'top 88%' } });
});

gsap.fromTo('.cat-card',
  { opacity: 0, y: 30, scale: 0.95 },
  { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.04, ease: 'back.out(1.2)',
    scrollTrigger: { trigger: '.cat-grid', start: 'top 80%' } });

gsap.fromTo('.worker-text',
  { opacity: 0, x: -50 },
  { opacity: 1, x: 0, duration: 0.9, ease,
    scrollTrigger: { trigger: '.worker-cta', start: 'top 75%' } });

gsap.fromTo('.earning-card',
  { opacity: 0, x: 50, y: 20 },
  { opacity: 1, x: 0, y: 0, duration: 0.9, ease: 'back.out(1.3)',
    scrollTrigger: { trigger: '.worker-cta', start: 'top 75%' } });

gsap.fromTo('.worker-perks li',
  { opacity: 0, x: -20 },
  { opacity: 1, x: 0, duration: 0.5, stagger: 0.1, ease,
    scrollTrigger: { trigger: '.worker-perks', start: 'top 80%' } });

gsap.fromTo('.final-title',
  { opacity: 0, y: 40, scale: 0.96 },
  { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: 'back.out(1.2)',
    scrollTrigger: { trigger: '.final-cta', start: 'top 80%' } });

gsap.fromTo('.final-sub',
  { opacity: 0, y: 20 },
  { opacity: 1, y: 0, duration: 0.7, ease,
    scrollTrigger: { trigger: '.final-cta', start: 'top 78%' } });

gsap.fromTo('.final-btns',
  { opacity: 0, y: 20 },
  { opacity: 1, y: 0, duration: 0.7, ease,
    scrollTrigger: { trigger: '.final-cta', start: 'top 75%' } });

// Glow scroll parallax (y only — x is handled by mouse)
gsap.to('.glow-1', { y: -140, ease: 'none',
  scrollTrigger: { trigger: '.hero', scrub: 1.5 } });
gsap.to('.glow-2', { y: -80, ease: 'none',
  scrollTrigger: { trigger: '.hero', scrub: 2 } });

// ── Mouse parallax on hero glows (x axis only, no conflict with scroll y) ────
document.addEventListener('mousemove', (e) => {
  const xPct = (e.clientX / window.innerWidth - 0.5) * 2;
  gsap.to('.glow-1', { x: xPct * 45, duration: 1.6, ease: 'power2.out', overwrite: 'auto' });
  gsap.to('.glow-2', { x: xPct * -28, duration: 2,  ease: 'power2.out', overwrite: 'auto' });
});

// ── Earn section ──────────────────────────────────────────────────────────────
gsap.fromTo('.earn-sub',
  { opacity: 0, y: 24 },
  { opacity: 1, y: 0, duration: 0.8, ease,
    scrollTrigger: { trigger: '.earn', start: 'top 80%' } });

gsap.fromTo('.profile-card',
  { opacity: 0, y: 56, scale: 0.93 },
  { opacity: 1, y: 0, scale: 1, duration: 0.7, stagger: 0.14, ease: 'back.out(1.5)',
    scrollTrigger: { trigger: '.profile-grid', start: 'top 82%' } });

gsap.fromTo('.profile-quote',
  { opacity: 0, x: -14 },
  { opacity: 1, x: 0, duration: 0.5, stagger: 0.14, ease,
    scrollTrigger: { trigger: '.profile-grid', start: 'top 78%' }, delay: 0.25 });

gsap.fromTo('.earn-stat',
  { opacity: 0, y: 32, scale: 0.95 },
  { opacity: 1, y: 0, scale: 1, duration: 0.6, stagger: 0.12, ease: 'back.out(1.3)',
    scrollTrigger: { trigger: '.earn-stats', start: 'top 88%' } });

// Counters for earn stats
const earnCountDefs = [
  { selector: '.earn-stat:nth-child(1) .earn-stat-num', to: 3,   prefix: '',  suffix: 'd'  },
  { selector: '.earn-stat:nth-child(2) .earn-stat-num', to: 320, prefix: '€', suffix: '+'  },
  { selector: '.earn-stat:nth-child(3) .earn-stat-num', to: 60,  prefix: '',  suffix: '%'  },
];
earnCountDefs.forEach(({ selector, to, prefix, suffix }) => {
  const el = document.querySelector(selector);
  if (!el) return;
  const obj = { val: 0 };
  const tween = gsap.to(obj, {
    val: to, duration: 2, ease: 'power2.out', paused: true,
    onUpdate() { el.innerHTML = `${prefix}${Math.round(obj.val)}<em>${suffix}</em>`; },
  });
  ScrollTrigger.create({
    trigger: '.earn-stats', start: 'top 85%',
    onEnter: () => tween.play(),
  });
});

// ── 3D card tilt on profile cards ─────────────────────────────────────────────
document.querySelectorAll('.profile-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const r  = card.getBoundingClientRect();
    const rx = ((e.clientY - r.top)  / r.height - 0.5) * -14;
    const ry = ((e.clientX - r.left) / r.width  - 0.5) *  14;
    gsap.to(card, { rotateX: rx, rotateY: ry, duration: 0.25,
      ease: 'power2.out', transformPerspective: 900, overwrite: 'auto' });
  });
  card.addEventListener('mouseleave', () => {
    gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.6,
      ease: 'elastic.out(1, 0.5)', overwrite: 'auto' });
  });
});
