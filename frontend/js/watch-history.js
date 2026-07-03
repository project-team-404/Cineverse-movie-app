/* ================================================================
   CINEVERSE — watch-history.js  v1.0
   GET  /watch-history/                → full history
   GET  /watch-history/continue-watching → in-progress only
   GET  /watch-history/{movie_id}      → single movie progress
   POST /watch-history/                → add/update progress
   PATCH /watch-history/{movie_id}/complete → mark completed

   Architecture mirrors favorites.js / watchlist.js exactly.
================================================================ */

'use strict';

const WH_BASE        = window.API_BASE||
    "https://cineverse-movie-app.onrender.com";;
const WH_PLACEHOLDER = 'assets/images/placeholder.jpg';

function whToken()    { return localStorage.getItem('access_token') || ''; }
function whLoggedIn() { return !!whToken(); }

function whHeaders() {
  return {
    'Accept': 'application/json',
    'Authorization': `Bearer ${whToken()}`
  };
}

function whJsonHeaders() {
  return {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${whToken()}`
  };
}

/* ── Carousel state ── */
let _carouselOffset  = 0;
let _carouselItems   = 0;
const CAROUSEL_STEP  = 220; /* px per scroll step */

/* ================================================================
   BOOT
================================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  initNavbar();
  initProfileDropdown();

  if (!whLoggedIn()) {
    whHideSkeleton();
    whShowSection('wh-auth');
    return;
  }

  updateNavAvatar();

  try {
    const [history, continueWatching] = await Promise.all([
      loadHistory(),
      loadContinueWatching()
    ]);

    whHideSkeleton();
    populateStats(history, continueWatching);
    renderContinueWatching(continueWatching);
    renderHistory(history);

  } catch (err) {
    console.error('[WH]', err);
    whHideSkeleton();
    whToast('Could not load watch history. Please try again.', 'error');
    whShowSection('wh-empty');
  }
});

/* ================================================================
   FETCH
================================================================ */
async function loadHistory() {
  const res = await fetch(`${WH_BASE}/watch-history/`, { headers: whHeaders() });
  if (res.status === 401) { localStorage.removeItem('access_token'); window.location.href = 'login.html'; return []; }
  if (!res.ok) throw new Error(`GET /watch-history/ → ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function loadContinueWatching() {
  const res = await fetch(`${WH_BASE}/watch-history/continue-watching`, { headers: whHeaders() });
  if (res.status === 401) { localStorage.removeItem('access_token'); window.location.href = 'login.html'; return []; }
  if (!res.ok) return []; /* non-fatal */
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}

async function fetchMovieDetails(movieId) {
  try {
    const res = await fetch(`${WH_BASE}/movies/${movieId}`, { headers: whHeaders() });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

/* ================================================================
   STATS
================================================================ */
function populateStats(history, continueWatching) {
  const watched   = history.length;
  const completed = history.filter(h => h.completed).length;
  const contCount = continueWatching.length;

  /* Total watch time in seconds → hours */
  const totalSecs = history.reduce((acc, h) => acc + (h.progress || 0), 0);
  const hours     = Math.floor(totalSecs / 3600);
  const mins      = Math.floor((totalSecs % 3600) / 60);
  const timeStr   = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  animateCount('stat-watched',   watched);
  animateCount('stat-continue',  contCount);
  animateCount('stat-completed', completed);

  const timeEl = document.getElementById('stat-time');
  if (timeEl) timeEl.textContent = timeStr || '0m';

  /* Update hero count */
  const countEl = document.getElementById('wh-count');
  if (countEl) countEl.textContent = `${watched} film${watched !== 1 ? 's' : ''}`;
}

function animateCount(id, target) {
  const el = document.getElementById(id);
  if (!el || target === 0) { if (el) el.textContent = '0'; return; }
  let start = 0;
  const dur  = 900;
  const step = 16;
  const inc  = target / (dur / step);
  const tick = setInterval(() => {
    start = Math.min(start + inc, target);
    el.textContent = Math.floor(start);
    if (start >= target) clearInterval(tick);
  }, step);
}

/* ================================================================
   CONTINUE WATCHING CAROUSEL
================================================================ */
async function renderContinueWatching(items) {
  const section  = document.getElementById('wh-continue-section');
  const carousel = document.getElementById('wh-carousel');
  if (!section || !carousel) return;

  if (!items.length) { section.style.display = 'none'; return; }

  /* Fetch movie details for each item in parallel */
  const enriched = await Promise.all(
    items.map(async item => {
      const movie = await fetchMovieDetails(item.movie_id);
      return movie ? { ...item, movie: normalizeMovie(movie) } : null;
    })
  );
  const valid = enriched.filter(Boolean);
  if (!valid.length) { section.style.display = 'none'; return; }

  _carouselItems = valid.length;

  carousel.innerHTML = valid.map((item, i) => buildCwCard(item, i)).join('');
  section.style.display = '';

  /* Wire carousel buttons */
  document.getElementById('carousel-prev')?.addEventListener('click', () => shiftCarousel(-1));
  document.getElementById('carousel-next')?.addEventListener('click', () => shiftCarousel(1));
}

function shiftCarousel(dir) {
  const carousel  = document.getElementById('wh-carousel');
  const wrapWidth = carousel?.parentElement?.offsetWidth || 0;
  const maxOffset = Math.max(0, (_carouselItems * CAROUSEL_STEP) - wrapWidth);
  _carouselOffset = Math.max(0, Math.min(_carouselOffset + dir * CAROUSEL_STEP * 2, maxOffset));
  if (carousel) carousel.style.transform = `translateX(-${_carouselOffset}px)`;
}

function buildCwCard(item, i) {
  const m   = item.movie;
  const pct = calcPct(item.progress, item.movie_runtime_s);
  const delay = i * 0.06;

  return `
    <div class="wh-cw-card" role="listitem" style="animation-delay:${delay}s">
      <div class="wh-cw-card__poster">
        <img src="${whEsc(m.poster_url)}" alt="${whEsc(m.title)}" loading="lazy" onerror="this.src='${WH_PLACEHOLDER}'">
        <div class="wh-cw-card__gradient"></div>
        <span class="wh-cw-card__pct">${pct}%</span>
      </div>
      <div class="wh-cw-card__info">
        <div class="wh-cw-card__title">${whEsc(m.title)}</div>
        <div class="wh-progress-bar">
          <div class="wh-progress-fill" style="width:${pct}%"></div>
        </div>
        <a href="movie-details.html?id=${m.id}" class="wh-resume-btn">
          <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12"><path d="M8 5v14l11-7z"/></svg>
          Resume
        </a>
      </div>
    </div>`;
}

/* ================================================================
   HISTORY GRID
================================================================ */
async function renderHistory(items) {
  if (!items.length) { whShowSection('wh-empty'); return; }

  /* Fetch movie details for all history items */
  const enriched = await Promise.all(
    items.map(async item => {
      const movie = await fetchMovieDetails(item.movie_id);
      return movie ? { ...item, movie: normalizeMovie(movie) } : null;
    })
  );
  const valid = enriched.filter(Boolean);

  if (!valid.length) { whShowSection('wh-empty'); return; }

  const grid = document.getElementById('wh-grid');
  grid.innerHTML = valid.map((item, i) => buildHistoryCard(item, i)).join('');
  whShowSection('wh-grid');

  /* Wire Mark Completed buttons */
  grid.querySelectorAll('.wh-btn-complete').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault(); e.stopPropagation();
      if (btn.dataset.loading) return;
      btn.dataset.loading = '1';
      btn.style.opacity = '0.4';
      await markCompleted(btn.dataset.id, btn.closest('.mgc'));
      delete btn.dataset.loading;
      btn.style.opacity = '';
    });
  });
}

function buildHistoryCard(item, i) {
  const m         = item.movie;
  const pct       = calcPct(item.progress, item.movie_runtime_s);
  const dateStr   = formatDate(item.watched_at);
  const isComplete = item.completed;
  const delay      = i * 0.05;

  return `
    <div class="mgc" role="listitem" style="animation:fwlFadeUp 0.5s cubic-bezier(0.16,1,0.3,1) ${delay}s both">
      <div class="mgc-poster">
        <img src="${whEsc(m.poster_url)}" alt="${whEsc(m.title)}" loading="lazy" onerror="this.src='${WH_PLACEHOLDER}'">
        ${isComplete ? `<div class="wh-completed-badge">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="10" height="10"><polyline points="20 6 9 17 4 12"/></svg>
          Done
        </div>` : ''}
        <div class="mgc-rating">
          <svg viewBox="0 0 24 24" fill="#f4c542" width="10" height="10"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          ${m.rating ? m.rating.toFixed(1) : '--'}
        </div>
        <div class="mgc-gradient"></div>
        <div class="mgc-actions">
          <a href="movie-details.html?id=${m.id}" class="mgc-play-btn" aria-label="Resume ${whEsc(m.title)}">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M8 5v14l11-7z"/></svg>
          </a>
        </div>
      </div>
      <div class="mgc-info">
        <a href="movie-details.html?id=${m.id}" class="mgc-title">${whEsc(m.title)}</a>
        <div class="mgc-meta-row">
          <span>${m.release_year || '--'}</span>
          <span class="mgc-genre-tag">${whEsc(m.genre?.name || 'Film')}</span>
        </div>
      </div>
      <div class="wh-card-extra">
        <div class="wh-card-date">${dateStr}</div>
        <div class="wh-card-progress-row">
          <div class="wh-card-progress-bar">
            <div class="wh-card-progress-fill" style="width:${pct}%"></div>
          </div>
          <span class="wh-card-pct">${pct}%</span>
        </div>
        <div class="wh-card-actions">
          <a href="movie-details.html?id=${m.id}" class="wh-card-btn wh-card-btn--resume">
            <svg viewBox="0 0 24 24" fill="currentColor" width="10" height="10"><path d="M8 5v14l11-7z"/></svg>
            Resume
          </a>
          ${!isComplete ? `
          <button class="wh-card-btn wh-card-btn--complete wh-btn-complete" data-id="${m.id}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="10" height="10"><polyline points="20 6 9 17 4 12"/></svg>
            Done
          </button>` : `
          <span class="wh-card-btn wh-card-btn--complete" style="opacity:0.5;cursor:default;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="10" height="10"><polyline points="20 6 9 17 4 12"/></svg>
            Done
          </span>`}
        </div>
      </div>
    </div>`;
}

/* ================================================================
   MARK COMPLETED
================================================================ */
async function markCompleted(movieId, cardEl) {
  try {
    const res = await fetch(`${WH_BASE}/watch-history/${movieId}/complete`, {
      method: 'PATCH',
      headers: whHeaders()
    });
    if (res.ok) {
      whToast('✓ Marked as completed', 'success');
      /* Refresh the card: replace Complete button with Done badge */
      if (cardEl) {
        const completeBtn = cardEl.querySelector('.wh-btn-complete');
        if (completeBtn) {
          completeBtn.outerHTML = `
            <span class="wh-card-btn wh-card-btn--complete" style="opacity:0.5;cursor:default;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="10" height="10"><polyline points="20 6 9 17 4 12"/></svg>
              Done
            </span>`;
        }
        /* Add completed badge to poster */
        const poster = cardEl.querySelector('.mgc-poster');
        if (poster && !poster.querySelector('.wh-completed-badge')) {
          const badge = document.createElement('div');
          badge.className = 'wh-completed-badge';
          badge.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="10" height="10"><polyline points="20 6 9 17 4 12"/></svg> Done`;
          poster.prepend(badge);
        }
        /* Bump completed stat */
        const statEl = document.getElementById('stat-completed');
        if (statEl) statEl.textContent = Number(statEl.textContent || 0) + 1;
      }
    } else {
      whToast('Could not mark as completed. Please try again.', 'error');
    }
  } catch { whToast('Network error.', 'error'); }
}

/* ================================================================
   NORMALIZE
================================================================ */
function normalizeMovie(m) {
  const images = Array.isArray(m.images) ? m.images : [];
  const raw    = m.poster_url || images[0]?.image_url || '';
  return {
    id:           m.id,
    title:        m.title || 'Untitled',
    release_year: m.release_year || '',
    rating:       Number(m.rating ?? 0),
    poster_url:   whResolveImg(raw) || WH_PLACEHOLDER,
    genre:        m.genre || {},
    runtime:      m.runtime || 0 /* minutes */
  };
}

function whResolveImg(raw) {
  raw = String(raw || '').trim();
  if (!raw || raw === 'null') return '';
  if (/^https?:\/\//i.test(raw) || raw.startsWith('data:')) return raw;
  if (raw.startsWith('/')) return WH_BASE + raw;
  return raw;
}

/* ================================================================
   HELPERS
================================================================ */
function calcPct(progressSecs, runtimeSecs) {
  /* Fallback: assume 2h runtime if backend doesn't provide it */
  const total = runtimeSecs || 7200;
  if (!progressSecs || progressSecs <= 0) return 0;
  return Math.min(100, Math.round((progressSecs / total) * 100));
}

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric'
    });
  } catch { return ''; }
}

function whHideSkeleton() {
  const sk = document.getElementById('wh-skeleton-grid');
  if (sk) sk.style.display = 'none';
}

function whShowSection(id) {
  ['wh-grid', 'wh-empty', 'wh-auth'].forEach(s => {
    const el = document.getElementById(s);
    if (!el) return;
    if (s === id) {
      /* fwl-grid is a grid container — restore grid display, not '' */
      el.style.display = s === 'wh-grid' ? 'grid' : '';
    } else {
      el.style.display = 'none';
    }
  });
}

function whToast(msg, type = 'success') {
  let c = document.getElementById('toast-container');
  if (!c) { c = document.createElement('div'); c.id = 'toast-container'; document.body.appendChild(c); }
  const t = document.createElement('div');
  t.className = `toast toast--${type}`;
  t.innerHTML = `<span class="toast__icon">${type === 'success' ? '✓' : '!'}</span><span class="toast__message">${msg}</span>`;
  c.appendChild(t);
  setTimeout(() => { t.classList.add('toast--exit'); setTimeout(() => t.remove(), 350); }, 3000);
}

function updateNavAvatar() {
  const name = localStorage.getItem('user_name') || '';
  const el   = document.getElementById('nav-avatar');
  if (el && name) el.textContent = name[0].toUpperCase();
}

function initNavbar() {
  const h = document.getElementById('nav-hamburger');
  const d = document.getElementById('nav-mobile-drawer');
  if (h && d) h.addEventListener('click', () => {
    const o = d.classList.toggle('open');
    h.setAttribute('aria-expanded', String(o));
  });
  const nb = document.querySelector('.navbar');
  if (nb) window.addEventListener('scroll', () => nb.classList.toggle('scrolled', scrollY > 40), { passive: true });
}

function initProfileDropdown() {
  const profileBtn = document.getElementById('profile-btn');
  const dropdown   = document.getElementById('profile-dropdown');
  if (!profileBtn || !dropdown) return;

  profileBtn.onclick = () => dropdown.classList.toggle('active');

  document.addEventListener('click', e => {
    if (!profileBtn.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove('active');
    }
  });

  const username = localStorage.getItem('user_name') || 'Guest';
  const email    = localStorage.getItem('user_email') || '';
  const initial  = username.charAt(0).toUpperCase();

  const nameEl   = document.getElementById('dropdown-name');
  const emailEl  = document.getElementById('dropdown-email');
  const avatarEl = document.getElementById('dropdown-avatar');

  if (nameEl)   nameEl.textContent   = username;
  if (emailEl)  emailEl.textContent  = email;
  if (avatarEl) avatarEl.textContent = initial;

  profileBtn.textContent = initial;

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.onclick = () => {
    localStorage.clear();
    window.location.href = 'login.html';
  };
}

function whEsc(v) {
  return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}