/* VELORA — optional display controls. One small JS file.
   Every setting is local to this browser; no data is uploaded. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const panel = $('display-panel');
  const toggle = $('display-toggle');
  const close = $('display-close');
  const range = $('brightness-slider');
  const defaults = { theme: 'day', eye: false, brightness: 100, font: 100 };
  let settings = { ...defaults };
  try {
    const stored = JSON.parse(localStorage.getItem('velora-display') || 'null');
    if (stored && typeof stored === 'object') {
      settings.theme = stored.theme === 'night' ? 'night' : 'day';
      settings.eye = stored.eye === true;
      settings.brightness = Math.min(115, Math.max(75, Number(stored.brightness) || 100));
      settings.font = [90,100,110,120].includes(Number(stored.font)) ? Number(stored.font) : 100;
    }
  } catch (error) { /* Some browsers restrict localStorage for local HTML files. */ }
  const persist = () => {
    try { localStorage.setItem('velora-display', JSON.stringify(settings)); } catch (error) {}
  };
  const update = () => {
    document.body.dataset.theme = settings.theme;
    document.body.dataset.eye = settings.eye ? 'on' : 'off';
    document.body.dataset.scaled = settings.font === 100 ? 'false' : 'true';
    document.body.dataset.fontExpanded = settings.font > 100 ? 'true' : 'false';
    document.documentElement.style.setProperty('--read-scale', (settings.font / 100).toString());
    const diff = settings.brightness - 100;
    let overlay = 'rgba(0,0,0,0)';
    if (diff < 0) overlay = `rgba(13,6,11,${Math.abs(diff) * .008})`;
    if (diff > 0) overlay = `rgba(255,248,237,${diff * .006})`;
    document.documentElement.style.setProperty('--brightness-overlay', overlay);
    document.documentElement.style.setProperty('--eye-overlay', settings.eye ? 'rgba(253,185,91,0.085)' : 'rgba(255,185,83,0)');
    $('theme-day').setAttribute('aria-pressed', String(settings.theme === 'day'));
    $('theme-night').setAttribute('aria-pressed', String(settings.theme === 'night'));
    $('eye-care').setAttribute('aria-pressed', String(settings.eye));
    $('eye-text').textContent = settings.eye ? 'On · Warm' : 'Off';
    range.value = String(settings.brightness);
    $('brightness-value').textContent = settings.brightness + '%';
    $('font-value').textContent = settings.font + '%';
    $('font-down').disabled = settings.font <= 90;
    $('font-up').disabled = settings.font >= 120;
    persist();
  };
  const setPanel = open => {
    $('display-scrim').hidden = !open;
    document.body.classList.toggle('panel-open', open);
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close display settings' : 'Open display settings');
    if (open) close.focus(); else toggle.focus();
  };
  toggle.addEventListener('click', () => setPanel(panel.hidden));
  close.addEventListener('click', () => setPanel(false));
  $('display-scrim').addEventListener('click', () => setPanel(false));
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !panel.hidden) setPanel(false); });
  document.addEventListener('pointerdown', event => {
    if (!panel.hidden && !panel.contains(event.target) && !toggle.contains(event.target)) setPanel(false);
  });
  $('theme-day').addEventListener('click', () => { settings.theme = 'day'; update(); });
  $('theme-night').addEventListener('click', () => { settings.theme = 'night'; update(); });
  $('eye-care').addEventListener('click', () => { settings.eye = !settings.eye; update(); });
  range.addEventListener('input', () => { settings.brightness = Number(range.value); update(); });
  $('font-down').addEventListener('click', () => { settings.font = Math.max(90, settings.font - 10); update(); });
  $('font-up').addEventListener('click', () => { settings.font = Math.min(120, settings.font + 10); update(); });
  $('display-reset').addEventListener('click', () => { settings = { ...defaults }; update(); });
  // A subtle progress line at the top of the page, including keyboard scrolling.
  let scheduled = false;
  const showProgress = () => {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    $('reading-progress').style.width = Math.round(100 * window.scrollY / max) + '%';
    scheduled = false;
  };
  window.addEventListener('scroll', () => {
    if (!scheduled) { scheduled = true; requestAnimationFrame(showProgress); }
  }, { passive: true });
  window.addEventListener('resize', showProgress);
  // Small-screen accessible menu: closes after navigation, on Escape, or when tapping outside.
  const menuButton = $('menu-toggle');
  const navigation = $('main-navigation');
  const setMenu = open => {
    navigation.classList.toggle('is-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    if (!open && navigation.contains(document.activeElement)) menuButton.focus({ preventScroll: true });
  };
  menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  // A reliable section jump on phones: close menu without refocusing or
  // allowing the sticky header to cover the section heading.
  document.querySelectorAll('a[href^="#"]').forEach(link => link.addEventListener('click', event => {
    const id = link.getAttribute('href').slice(1);
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    if (menuButton.getAttribute('aria-expanded') === 'true') setMenu(false);
    const header = document.querySelector('.site-header');
    const offset = header ? header.getBoundingClientRect().height : 0;
    const nextY = Math.max(0, target.getBoundingClientRect().top + window.scrollY - offset);
    history.pushState(null, '', '#' + encodeURIComponent(id));
    window.scrollTo({ top: nextY, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') setMenu(false);
  });
  document.addEventListener('pointerdown', event => {
    if (menuButton.getAttribute('aria-expanded') === 'true' && !navigation.contains(event.target) && !menuButton.contains(event.target)) setMenu(false);
  });
  window.matchMedia('(min-width: 901px)').addEventListener('change', event => { if (event.matches) setMenu(false); });
  update();
  showProgress();
})();
