(() => {
  const root = document.querySelector('.christmas-hub');
  const offer = root.querySelector('#ch-interest');
  const status = root.querySelector('#ch-status');
  root.querySelectorAll('[data-ch-offer]').forEach(link => {
    link.addEventListener('click', () => {
      offer.value = link.dataset.chOffer;
      status.textContent = '';
      if (link.dataset.chAudience) root.querySelector('#ch-audience').value = link.dataset.chAudience;
    });
  });
  root.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      const href = link.getAttribute('href');
      if (href.length < 2) return;
      const target = document.getElementById(href.slice(1));
      if (!target) return;
      event.preventDefault();
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      history.replaceState(null, '', href);
    });
  });
  // Reuse the site's mobile navigation markup without loading global marketing/form code.
  const toggle = root.querySelector('.button-collapse');
  const menu = root.querySelector('#mobile-nav');
  toggle.setAttribute('aria-controls', 'mobile-nav');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('role', 'button');
  const close = () => { menu.classList.remove('ch-menu-open'); toggle.setAttribute('aria-expanded', 'false'); };
  toggle.addEventListener('click', event => {
    event.preventDefault();
    const open = menu.classList.toggle('ch-menu-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  toggle.addEventListener('keydown', event => { if (event.key === ' ') { event.preventDefault(); toggle.click(); } });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && menu.classList.contains('ch-menu-open')) { close(); toggle.focus(); } });
  document.addEventListener('click', event => { if (!menu.contains(event.target) && !toggle.contains(event.target)) close(); });
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', close));
})();
