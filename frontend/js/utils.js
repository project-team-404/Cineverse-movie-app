/* ============================================================
   CINEVERSE — UTILITIES
   ============================================================ */

/* ── DOM helpers ── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

/* ── Format runtime ── */
function fmtRuntime(min) {
  if (!min) return '—';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h ${m}m` : `${m}m`;
}

/* ── Format date ── */
function fmtYear(dateStr) {
  return dateStr ? dateStr.slice(0, 4) : '—';
}

/* ── Round rating ── */
function fmtRating(r) {
  return r ? r.toFixed(1) : '—';
}

/* ── Genre names from IDs ── */
function genreNames(ids, max = 2) {
  return (ids || [])
    .slice(0, max)
    .map(id => TMDB.GENRES[id] || '')
    .filter(Boolean)
    .join(' · ');
}

/* ── Star rating HTML ── */
function starsHTML(rating) {
  const full = Math.round(rating / 2);
  return Array.from({ length: 5 }, (_, i) =>
    `<svg viewBox="0 0 24 24" fill="${i < full ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.5">
       <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
     </svg>`
  ).join('');
}

/* ── Toast ── */
function toast(msg, type = 'info', duration = 3500) {
  const icons = { info: '🎬', success: '✓', error: '✕' };
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span class="toast-icon">${icons[type]}</span><span>${msg}</span>`;
  container.appendChild(el);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => el.classList.add('show'));
  });
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 400);
  }, duration);
}

/* ── Watchlist (localStorage) ── */
const Watchlist = {
  key: 'cv_watchlist',
  get() { try { return JSON.parse(localStorage.getItem(this.key)) || []; } catch { return []; } },
  add(movie) {
    const list = this.get();
    if (!list.find(m => m.id === movie.id)) {
      list.unshift({ id: movie.id, title: movie.title, poster_path: movie.poster_path, vote_average: movie.vote_average, release_date: movie.release_date, genre_ids: movie.genre_ids });
      localStorage.setItem(this.key, JSON.stringify(list));
      toast(`Added "${movie.title}" to Watchlist`, 'success');
    } else {
      this.remove(movie.id);
      toast(`Removed from Watchlist`, 'info');
    }
    document.dispatchEvent(new CustomEvent('watchlist-update'));
  },
  remove(id) {
    const list = this.get().filter(m => m.id !== id);
    localStorage.setItem(this.key, JSON.stringify(list));
  },
  has(id) { return this.get().some(m => m.id === id); },
};

/* ── Favorites ── */
const Favorites = {
  key: 'cv_favorites',
  get() { try { return JSON.parse(localStorage.getItem(this.key)) || []; } catch { return []; } },
  toggle(movie) {
    const list = this.get();
    if (list.find(m => m.id === movie.id)) {
      localStorage.setItem(this.key, JSON.stringify(list.filter(m => m.id !== movie.id)));
      toast(`Removed from Favorites`, 'info');
    } else {
      list.unshift({ id: movie.id, title: movie.title, poster_path: movie.poster_path });
      localStorage.setItem(this.key, JSON.stringify(list));
      toast(`Added "${movie.title}" to Favorites ♥`, 'success');
    }
    document.dispatchEvent(new CustomEvent('favorites-update'));
  },
  has(id) { return this.get().some(m => m.id === id); },
};

/* ── Watch History (simulate continue watching) ── */
const WatchHistory = {
  key: 'cv_history',
  get() { try { return JSON.parse(localStorage.getItem(this.key)) || []; } catch { return []; } },
  add(movie) {
    const list = this.get().filter(m => m.id !== movie.id);
    list.unshift({ ...movie, progress: Math.random() * 0.7 + 0.1, timestamp: Date.now() });
    localStorage.setItem(this.key, JSON.stringify(list.slice(0, 20)));
  },
};

/* ── Intersection Observer for scroll reveals ── */
function initReveal() {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
  );

  $$('.reveal, .reveal-left, .reveal-right, .reveal-scale, .stagger-children').forEach(el => io.observe(el));

  /* Observe newly added elements */
  const mo = new MutationObserver(mutations => {
    mutations.forEach(m => {
      m.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return;
        const targets = [
          ...(node.matches?.('.reveal, .reveal-left, .reveal-right, .reveal-scale, .stagger-children') ? [node] : []),
          ...$$('.reveal, .reveal-left, .reveal-right, .reveal-scale, .stagger-children', node),
        ];
        targets.forEach(el => io.observe(el));
      });
    });
  });
  mo.observe(document.body, { childList: true, subtree: true });
}

/* ── Lazy image loader ── */
function lazyLoadImages() {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const img = entry.target;
        const src = img.dataset.src;
        if (!src) return;
        img.src = src;
        img.addEventListener('load', () => img.classList.add('loaded'), { once: true });
        img.addEventListener('error', () => { img.src = FALLBACK_POSTER; img.classList.add('loaded'); }, { once: true });
        io.unobserve(img);
      });
    },
    { rootMargin: '200px' }
  );
  $$('img.lazy').forEach(img => io.observe(img));
  // Re-observe new images
  const mo = new MutationObserver(mutations => {
    mutations.forEach(m => {
      m.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return;
        const imgs = node.matches?.('img.lazy') ? [node] : $$('img.lazy', node);
        imgs.forEach(img => io.observe(img));
      });
    });
  });
  mo.observe(document.body, { childList: true, subtree: true });
}

/* ── Drag-to-scroll carousels ── */
function initCarouselDrag(track) {
  let isDown = false, startX, scrollLeft;
  track.addEventListener('mousedown', e => {
    isDown = true;
    track.style.cursor = 'grabbing';
    startX = e.pageX - track.offsetLeft;
    scrollLeft = track.scrollLeft;
  });
  document.addEventListener('mouseup', () => {
    isDown = false;
    track.style.cursor = 'grab';
  });
  track.addEventListener('mouseleave', () => { isDown = false; track.style.cursor = 'grab'; });
  track.addEventListener('mousemove', e => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - track.offsetLeft;
    const dist = (x - startX) * 1.5;
    track.scrollLeft = scrollLeft - dist;
  });
}

/* ── Carousel arrow buttons ── */
function initCarouselArrows(wrap) {
  const track = wrap.querySelector('.carousel-track');
  const prev = wrap.querySelector('.carousel-btn-prev');
  const next = wrap.querySelector('.carousel-btn-next');
  if (!track || !prev || !next) return;

  function update() {
    prev.disabled = track.scrollLeft <= 0;
    next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 1;
  }

  const scrollAmount = () => Math.min(track.clientWidth * 0.75, 400);

  prev.addEventListener('click', () => {
    track.scrollBy({ left: -scrollAmount(), behavior: 'smooth' });
  });
  next.addEventListener('click', () => {
    track.scrollBy({ left: scrollAmount(), behavior: 'smooth' });
  });
  track.addEventListener('scroll', update, { passive: true });
  update();
  initCarouselDrag(track);
}

/* ── Navbar scroll behavior ── */
function initNavbar() {
  const nav = document.querySelector('.navbar');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });

  // Hamburger
  const hamburger = nav.querySelector('.nav-hamburger');
  const drawer    = nav.querySelector('.nav-mobile-drawer');
  if (hamburger && drawer) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      drawer.classList.toggle('open');
    });
  }

  // Search overlay
  const searchBtn     = nav.querySelector('.nav-search-btn');
  const searchOverlay = document.getElementById('search-overlay');
  const searchClose   = document.getElementById('search-overlay-close');
  const searchInput   = document.getElementById('search-overlay-input');

  if (searchBtn && searchOverlay) {
    searchBtn.addEventListener('click', () => {
      searchOverlay.classList.add('active');
      setTimeout(() => searchInput?.focus(), 100);
    });
    searchClose?.addEventListener('click', () => searchOverlay.classList.remove('active'));
    searchOverlay.addEventListener('click', e => {
      if (e.target === searchOverlay) searchOverlay.classList.remove('active');
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') searchOverlay.classList.remove('active');
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchOverlay.classList.add('active');
        setTimeout(() => searchInput?.focus(), 100);
      }
    });
  }
}

/* ── Magnetic button effect ── */
function initMagnetic() {
  $$('.btn-primary, .btn-ghost').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      const rect = btn.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 8;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 8;
      btn.style.transform = `translate(${x}px, ${y}px) translateY(-2px)`;
    });
    btn.addEventListener('mouseleave', () => {
      btn.style.transform = '';
    });
  });
}

/* ── Loading screen ── */
function hideLoadingScreen() {
  const screen = document.querySelector('.loading-screen');
  if (!screen) return;
  if (screen.classList.contains('hidden')) return; // already hidden

  const bar = screen.querySelector('.loading-bar-fill');
  let progress = 0;

  /* Animate bar to 100% */
  const interval = setInterval(() => {
    progress = Math.min(progress + Math.random() * 15 + 5, 100);
    if (bar) bar.style.width = progress + '%';
    if (progress >= 100) {
      clearInterval(interval);
      setTimeout(() => screen.classList.add('hidden'), 200);
    }
  }, 80);

  /* Hard deadline — no matter what, hide within 3s */
  setTimeout(() => {
    clearInterval(interval);
    if (bar) bar.style.width = '100%';
    screen.classList.add('hidden');
  }, 3000);
}

/* ── Force hide loading screen on DOMContentLoaded as fallback ── */
document.addEventListener('DOMContentLoaded', () => {
  /* If hideLoadingScreen was never called by init(), force it after 1.5s */
  setTimeout(() => {
    const screen = document.querySelector('.loading-screen');
    if (screen && !screen.classList.contains('hidden')) {
      hideLoadingScreen();
    }
  }, 1500);
});

/* ── Mouse parallax on hero ── */
function initHeroParallax() {
  const hero = document.querySelector('.hero');
  const depth = document.querySelector('.hero-depth-layer');
  if (!hero || !depth) return;
  hero.addEventListener('mousemove', e => {
    const x = (e.clientX / window.innerWidth * 100).toFixed(1);
    const y = (e.clientY / window.innerHeight * 100).toFixed(1);
    depth.style.setProperty('--mouse-x', `${x}%`);
    depth.style.setProperty('--mouse-y', `${y}%`);
  });
}

/* ── Number count-up ── */
function countUp(el, target, duration = 1500) {
  const start = performance.now();
  const update = (now) => {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(target * ease).toLocaleString();
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}