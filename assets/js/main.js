/* LASCAVA Café — interacción y movimiento (GSAP + ScrollTrigger) */
(() => {
  const root = document.documentElement;
  const top = document.getElementById('top');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----- menú móvil ----- */
  const burger = top.querySelector('.top__burger');
  const sheet = document.getElementById('menu');
  const setMenu = (open) => {
    burger.setAttribute('aria-expanded', String(open));
    sheet.classList.toggle('is-open', open);
    sheet.inert = !open;
    document.body.classList.toggle('no-scroll', open);
  };
  burger.addEventListener('click', () => setMenu(burger.getAttribute('aria-expanded') !== 'true'));
  sheet.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });

  /* ----- pestañas de la carta ----- */
  const tabs = [...document.querySelectorAll('[role="tab"]')];
  const select = (tab, focus) => {
    tabs.forEach((t) => {
      const on = t === tab;
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(t.getAttribute('aria-controls'));
      panel.hidden = !on;
      if (on) panel.querySelectorAll('.rt').forEach((r) => requestAnimationFrame(() => r.classList.add('is-in')));
    });
    if (focus) tab.focus();
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  };
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => select(t));
    t.addEventListener('keydown', (e) => {
      const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (d) { e.preventDefault(); select(tabs[(i + d + tabs.length) % tabs.length], true); }
    });
  });

  /* ----- vídeo del hero ----- */
  /* reproduce mientras el hero se ve; si el navegador bloquea el autoplay
     (ahorro de batería, ahorro de datos…) lo reintenta en cuanto hay datos o el usuario interactúa */
  const video = document.querySelector('.hero video');
  if (video && reduce) { video.removeAttribute('autoplay'); video.pause(); }
  else if (video) {
    let visible = true;
    const play = () => { if (visible && video.paused) video.play().catch(() => {}); };
    new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible) play(); else video.pause();
    }).observe(video.closest('.hero'));
    video.addEventListener('canplay', play);
    ['pointerdown', 'touchend', 'keydown', 'scroll'].forEach((ev) => addEventListener(ev, play, { passive: true }));
  }

  const solid = () => top.classList.toggle('is-solid', scrollY > innerHeight * 0.9);

  if (!window.gsap || !window.ScrollTrigger || reduce) {
    addEventListener('scroll', solid, { passive: true });
    solid();
    return;
  }

  root.classList.add('motion');
  gsap.registerPlugin(ScrollTrigger);

  /* ----- hero: el círculo del logo se abre a la fachada ----- */
  const win = document.querySelector('.hero__window');
  const r0 = () => Math.min(innerHeight * 0.36, innerWidth * 0.42);
  const r1 = () => Math.hypot(innerWidth, innerHeight) / 2 + 8;

  gsap.from('.hero__mark span', { yPercent: 70, opacity: 0, duration: 1.3, ease: 'power3.out', stagger: 0.06, delay: 0.15 });
  gsap.from(win, { scale: 0.86, opacity: 0, duration: 1.5, ease: 'power3.out' });
  gsap.from('.hero__corners p', { opacity: 0, y: 10, duration: 1, delay: 0.7, stagger: 0.1 });

  const hero = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom bottom', scrub: 0.7, invalidateOnRefresh: true },
  });
  hero
    .fromTo(win, { '--r': () => r0() + 'px' }, { '--r': () => r1() + 'px', duration: 1, ease: 'power2.inOut' }, 0)
    .to('.hero__veil', { opacity: 0, duration: 0.55 }, 0.08)
    .to('.hero__shade', { opacity: 1, duration: 0.5 }, 0.3)
    .to('.hero__mark', { color: '#faf6f0', scale: 1.08, duration: 0.6 }, 0.22)
    .to('.hero__corners', { color: '#faf6f0', duration: 0.4 }, 0.3)
    .to('.hero__line', { opacity: 1, y: 0, duration: 0.3 }, 0.78)
    .to({}, { duration: 0.15 });

  ScrollTrigger.create({ trigger: '.hero', start: 'bottom top+=72', onToggle: (s) => top.classList.toggle('is-solid', s.isActive || s.progress === 1), onEnter: () => top.classList.add('is-solid'), onLeaveBack: () => top.classList.remove('is-solid') });

  /* ----- cocina: galería horizontal fijada (escritorio) ----- */
  /* va antes que el resto: su pin-spacing desplaza a todos los triggers de debajo */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 900px)', () => {
    const track = document.querySelector('.track');
    const dist = () => Math.max(0, track.scrollWidth - innerWidth);
    gsap.to(track, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: '.cocina__pin', start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 0.6, invalidateOnRefresh: true, anticipatePin: 1 },
    });
  });
  /* ----- un día en LASCAVA: el color de la página cambia con la hora ----- */
  const tones = {
    manana:   { '--bg': '#f4ece1', '--ink': '#3f1a12', '--soft': '#86675c', '--rule': 'rgba(63,26,18,0.2)' },
    mediodia: { '--bg': '#efe4d5', '--ink': '#3f1a12', '--soft': '#82635a', '--rule': 'rgba(63,26,18,0.2)' },
    tarde:    { '--bg': '#ead8c3', '--ink': '#3a1710', '--soft': '#7d5c50', '--rule': 'rgba(58,23,16,0.22)' },
    noche:    { '--bg': '#1a0d09', '--ink': '#f3e8da', '--soft': '#b39a88', '--rule': 'rgba(243,232,218,0.16)' },
  };
  const meta = document.querySelector('meta[name="theme-color"]');
  let current = 'manana';
  const tone = (name) => {
    if (name === current) return;
    current = name;
    gsap.to(root, { ...tones[name], duration: 1.1, ease: 'power2.inOut', overwrite: 'auto' });
    if (meta) meta.content = tones[name]['--bg'];
  };
  document.querySelectorAll('[data-tone]').forEach((sec) => {
    ScrollTrigger.create({
      trigger: sec, start: 'top 60%', end: 'bottom 60%',
      onEnter: () => tone(sec.dataset.tone), onEnterBack: () => tone(sec.dataset.tone),
    });
  });
  ScrollTrigger.create({ trigger: '#manana', start: 'top 60%', onLeaveBack: () => tone('manana') });

  /* ----- apariciones ----- */
  gsap.utils.toArray('[data-reveal]').forEach((el) => {
    gsap.from(el, { y: 34, opacity: 0, duration: 1.15, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } });
  });
  ScrollTrigger.batch('.rt', { start: 'top 92%', once: true, onEnter: (els) => els.forEach((e) => e.classList.add('is-in')) });
  gsap.utils.toArray('.collage figure, .tartas__duo figure, .noche__duo figure, .tartas__hero').forEach((f, i) => {
    gsap.from(f, { clipPath: 'inset(100% 0 0 0)', duration: 1.4, ease: 'power3.inOut', delay: (i % 3) * 0.12, scrollTrigger: { trigger: f, start: 'top 88%', once: true } });
  });

  /* parallax suave dentro de cada marco */
  gsap.utils.toArray('[data-speed]').forEach((img) => {
    const s = parseFloat(img.dataset.speed) || 1;
    gsap.fromTo(img, { yPercent: -4 * s }, { yPercent: 4 * s, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  gsap.from('.dish', { y: 50, opacity: 0, duration: 1.1, ease: 'power3.out', stagger: 0.07, scrollTrigger: { trigger: '.track', start: 'top 92%', once: true } });

  /* ----- el letrero se enciende al caer la noche ----- */
  const neon = document.querySelector('.noche__neon img');
  if (neon) {
    ScrollTrigger.create({
      trigger: '.noche__neon', start: 'top 65%', once: true,
      onEnter: () => gsap.timeline()
        .to(neon, { filter: 'brightness(1.05) saturate(1)', duration: 0.07 })
        .to(neon, { filter: 'brightness(0.3) saturate(0.6)', duration: 0.06 })
        .to(neon, { filter: 'brightness(0.95) saturate(1)', duration: 0.08, delay: 0.08 })
        .to(neon, { filter: 'brightness(0.45) saturate(0.7)', duration: 0.05, delay: 0.16 })
        .to(neon, { filter: 'brightness(1) saturate(1)', duration: 0.9, ease: 'power2.out' }),
    });
  }

  /* ----- la rama de tilo se dibuja ----- */
  document.querySelectorAll('.tilo').forEach((svg) => {
    const marks = svg.querySelectorAll('path, circle, ellipse');
    marks.forEach((m) => {
      const len = m.getTotalLength();
      m.style.strokeDasharray = len;
      m.style.strokeDashoffset = len;
    });
    gsap.to(marks, { strokeDashoffset: 0, duration: 2.6, ease: 'power1.inOut', stagger: 0.035, scrollTrigger: { trigger: svg, start: 'top 85%', once: true } });
  });

  /* ----- recalcular cuando cargan fuentes e imágenes ----- */
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
  addEventListener('load', () => ScrollTrigger.refresh());
})();
