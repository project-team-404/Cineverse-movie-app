/* ============================================================
   CINEVERSE - HOME ENHANCED INTERACTIONS
   Visual-only helpers. Movie data is owned by home.js.
   ============================================================ */

/* ── HERO SLIDE COUNTER — ensure counter is visible ── */
(function ensureHeroCounter() {
  const counter = document.querySelector('.hero-slide-counter');
  if (!counter) return;

  counter.style.opacity = '0';
  counter.style.transform = 'translateY(10px)';

  setTimeout(() => {
    counter.style.transition = 'opacity 0.7s ease 1.4s, transform 0.7s ease 1.4s';
    counter.style.opacity = '1';
    counter.style.transform = 'translateY(0)';
  }, 100);
})();

/* ── MOOD CARDS — enhanced hover interactions ── */
(function initMoodCards() {
  const cards = document.querySelectorAll('.mood-card');
  if (!cards.length) return;

  cards.forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `translateY(-12px) scale(1.03) rotateX(${y * -6}deg) rotateY(${x * 6}deg)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transition = 'transform 0.6s cubic-bezier(0.16,1,0.3,1), border-color 0.35s, box-shadow 0.35s';
      card.style.transform = '';
      setTimeout(() => { card.style.transition = ''; }, 600);
    });

    card.addEventListener('mouseenter', () => {
      card.style.transition = 'transform 0.1s ease, border-color 0.35s, box-shadow 0.35s';
    });
  });
})();

/* ── RECOMMENDED SECTION — match score badge attribute ── */
(function initRecommendedSection() {
  const track = document.getElementById('recommended-track');
  if (!track) return;

  const observer = new MutationObserver(() => {
    const posters = track.querySelectorAll('.movie-card-poster:not([data-match])');
    posters.forEach((poster, index) => {
      const scoreEl = poster.closest('.movie-card')?.querySelector('.rec-score');
      poster.setAttribute('data-match', scoreEl?.textContent?.trim() || `${Math.max(70, 96 - index * 2)}% Match`);
    });
  });

  observer.observe(track, { childList: true, subtree: false });
})();

/* ── STATS BANNER — countup with intersection observer ── */
(function reinitStats() {
  const banner = document.getElementById('stats-banner');
  if (!banner) return;

  function countUpLocal(el, target, duration) {
    const start = performance.now();
    const update = now => {
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(target * ease).toLocaleString();
      if (progress < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      banner.querySelectorAll('.count-up').forEach(el => {
        countUpLocal(el, parseInt(el.dataset.target, 10) || 0, 1600);
      });
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.4 });

  observer.observe(banner);
})();

/* ── GENRE GRID — delayed stagger entrance ── */
(function initGenreGrid() {
  const grid = document.getElementById('genre-grid');
  if (!grid) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const cards = grid.querySelectorAll('.genre-card');
      cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'scale(0.93) translateY(20px)';
        setTimeout(() => {
          card.style.transition = `opacity 0.55s cubic-bezier(0.16,1,0.3,1) ${index * 0.06}s,
                                    transform 0.55s cubic-bezier(0.16,1,0.3,1) ${index * 0.06}s`;
          card.style.opacity = '1';
          card.style.transform = 'scale(1) translateY(0)';
        }, 50);
      });
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.1 });

  observer.observe(grid);
})();

/* ── EDITORIAL BAND — parallax on scroll ── */
(function initEditorialParallax() {
  const band = document.querySelector('.editorial-band');
  if (!band) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    requestAnimationFrame(() => {
      const rect = band.getBoundingClientRect();
      const ratio = 1 - (rect.top / window.innerHeight);
      const offset = (ratio - 0.5) * 30;
      const inner = band.querySelector('.editorial-inner');
      if (inner) inner.style.transform = `translateY(${offset}px)`;
      ticking = false;
    });
    ticking = true;
  }, { passive: true });
})();

/* ── PROMO BANNER — magnetic tilt effect ── */
(function initPromoBanner() {
  const banner = document.querySelector('.promo-inner');
  if (!banner) return;

  banner.addEventListener('mousemove', e => {
    const rect = banner.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    banner.style.transform = `perspective(1000px) rotateX(${y * -3}deg) rotateY(${x * 3}deg)`;
  });

  banner.addEventListener('mouseleave', () => {
    banner.style.transition = 'transform 0.5s cubic-bezier(0.16,1,0.3,1)';
    banner.style.transform = '';
    setTimeout(() => { banner.style.transition = ''; }, 500);
  });
})();

/* ── CURSOR GLOW on hero ── */
(function initHeroCursorGlow() {
  const hero = document.getElementById('hero');
  const depth = document.querySelector('.hero-depth-layer');
  if (!hero || !depth) return;

  hero.addEventListener('mousemove', e => {
    const x = ((e.clientX / window.innerWidth) * 100).toFixed(1);
    const y = ((e.clientY / window.innerHeight) * 100).toFixed(1);
    depth.style.setProperty('--mouse-x', `${x}%`);
    depth.style.setProperty('--mouse-y', `${y}%`);
  });
})();
