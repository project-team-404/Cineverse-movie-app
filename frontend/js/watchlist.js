/* ================================================================
   CINEVERSE — watchlist.js  v2.0
   GET    /watchlist/         → [{id, movie:{id, title,...}}]
   POST   /watchlist/add/{id}
   DELETE /watchlist/{id}

   NOTE: response uses movie.id (NOT movie_id like favorites)
================================================================ */

'use strict';

const WL_BASE = 'https://movie-app-qhzc.onrender.com';
const WL_PLACEHOLDER = 'assets/images/placeholder.jpg';

function wlToken()    { return localStorage.getItem('access_token') || ''; }
function wlLoggedIn() { return !!wlToken(); }

function wlHeaders() {
  return { 'Accept': 'application/json', 'Authorization': `Bearer ${wlToken()}` };
}

/* ── Boot ── */
document.addEventListener('DOMContentLoaded', async () => {
  initNavbar();

  if (!wlLoggedIn()) {
    hideSkeleton();
    showSection('wl-auth');
    return;
  }

  updateNavAvatar();

  try {
    const movies = await loadWatchlistMovies();
    hideSkeleton();
    renderGrid(movies);
  } catch (err) {
    console.error('[WL]', err);
    hideSkeleton();
    toast('Could not load watchlist. Please try again.', 'error');
    showSection('wl-empty');
  }
});

/* ================================================================
   FETCH — GET /watchlist/ returns [{id, movie:{id, title,...}}]
   The full movie object is ALREADY inside the response.
   We use movie.id (NOT movie_id).
================================================================ */
async function loadWatchlistMovies() {
  const res = await fetch(`${WL_BASE}/watchlist/`, { headers: wlHeaders() });

  if (res.status === 401) {
    localStorage.removeItem('access_token');
    window.location.href = 'login.html';
    return [];
  }
  if (!res.ok) throw new Error(`GET /watchlist/ → ${res.status}`);

  const list = await res.json(); /* [{id, movie:{id,...}}] */

  if (!Array.isArray(list)) return [];

  return list
    .filter(item => item.movie && item.movie.id != null)
    .map(item => normalizeMovie(item.movie)); /* use item.movie directly */
}

/* ── Normalize ── */
function normalizeMovie(m) {
  const images = Array.isArray(m.images) ? m.images : [];
  const poster = resolveImg(m.poster_url || images[0]?.image_url || '');
  return {
    id:           m.id,
    title:        m.title || 'Untitled',
    description:  m.description || '',
    release_year: m.release_year || '',
    rating:       Number(m.rating ?? 0),
    poster_url:   poster || WL_PLACEHOLDER,
    genre:        m.genre || {},
  };
}

function resolveImg(raw) {
  raw = String(raw || '').trim();
  if (!raw || raw === 'null') return '';
  if (/^https?:\/\//i.test(raw) || raw.startsWith('data:')) return raw;
  if (raw.startsWith('/')) return WL_BASE + raw;
  return raw;
}

/* ================================================================
   RENDER
================================================================ */
function renderGrid(movies) {
  const countEl = document.getElementById('wl-count');
  if (countEl) countEl.textContent = `${movies.length} film${movies.length !== 1 ? 's' : ''}`;

  if (!movies.length) { showSection('wl-empty'); return; }

  const grid = document.getElementById('wl-grid');
  grid.innerHTML = movies.map((m, i) => buildCard(m, i)).join('');
  showSection('wl-grid');

  /* Wire remove-from-watchlist */
  grid.querySelectorAll('.cv-remove-wl').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault(); e.stopPropagation();
      if (btn.dataset.loading) return;
      const id = btn.dataset.id;
      btn.dataset.loading = '1';
      btn.style.opacity = '0.4';
      await removeWatchlist(id, btn.closest('.mgc'));
      delete btn.dataset.loading;
      btn.style.opacity = '';
    });
  });

  /* Wire add-to-favorites from this page */
  grid.querySelectorAll('.cv-add-fav').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault(); e.stopPropagation();
      if (btn.dataset.loading) return;
      const id = btn.dataset.id;
      btn.dataset.loading = '1';
      btn.style.opacity = '0.4';
      const active = btn.classList.contains('active');
      try {
        const method = active ? 'DELETE' : 'POST';
        const url    = active
          ? `${WL_BASE}/favorites/delete/${id}`
          : `${WL_BASE}/favorites/add/${id}`;
        const res = await fetch(url, { method, headers: wlHeaders() });
        if (res.ok) {
          btn.classList.toggle('active', !active);
          btn.innerHTML = heartSvg(!active);
          toast(!active ? '♥ Added to Favorites' : 'Removed from Favorites', !active ? 'success' : '');
        } else {
          toast('Could not update favorites.', 'error');
        }
      } catch { toast('Network error.', 'error'); }
      delete btn.dataset.loading;
      btn.style.opacity = '';
    });
  });
}

/* ── Remove from watchlist: DELETE /watchlist/{movie_id} ── */
async function removeWatchlist(movieId, cardEl) {
  try {
    const res = await fetch(`${WL_BASE}/watchlist/${movieId}`, {
      method: 'DELETE',
      headers: wlHeaders()
    });
    if (res.ok) {
      if (cardEl) {
        cardEl.style.transition = 'opacity 0.3s, transform 0.3s';
        cardEl.style.opacity = '0';
        cardEl.style.transform = 'scale(0.92)';
        setTimeout(() => {
          cardEl.remove();
          const rem = document.querySelectorAll('#wl-grid .mgc').length;
          const countEl = document.getElementById('wl-count');
          if (countEl) countEl.textContent = `${rem} film${rem !== 1 ? 's' : ''}`;
          if (rem === 0) showSection('wl-empty');
        }, 300);
      }
      toast('Removed from Watchlist', '');
    } else {
      toast('Could not remove. Please try again.', 'error');
    }
  } catch { toast('Network error.', 'error'); }
}

/* ── Card HTML ── */
function buildCard(m, i) {
  const rating = m.rating ? m.rating.toFixed(1) : '--';
  const year   = m.release_year || '--';
  const genre  = m.genre?.name || 'Film';

  return `
    <div class="mgc" role="listitem" style="animation:fwlFadeUp 0.5s cubic-bezier(0.16,1,0.3,1) ${i * 0.05}s both">
      <div class="mgc-poster">
        <img src="${esc(m.poster_url)}" alt="${esc(m.title)}" loading="lazy" onerror="this.src='${WL_PLACEHOLDER}'">
        <div class="mgc-rating">
          <svg viewBox="0 0 24 24" fill="#f4c542" width="10" height="10"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          ${rating}
        </div>
        <div class="mgc-gradient"></div>
        <div class="mgc-actions">
          <a href="movie-details.html?id=${m.id}" class="mgc-play-btn" aria-label="Watch ${esc(m.title)}">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M8 5v14l11-7z"/></svg>
          </a>
          <div class="mgc-action-row">
            <button class="mgc-action-btn cv-remove-wl active" data-id="${m.id}" aria-label="Remove from Watchlist" title="Remove from Watchlist">
              ${bookmarkSvg(true)}
            </button>
            <button class="mgc-action-btn cv-add-fav" data-id="${m.id}" aria-label="Add to Favorites" title="Add to Favorites">
              ${heartSvg(false)}
            </button>
          </div>
        </div>
      </div>
      <div class="mgc-info">
        <a href="movie-details.html?id=${m.id}" class="mgc-title">${esc(m.title)}</a>
        <div class="mgc-meta-row">
          <span>${year}</span>
          <span class="mgc-genre-tag">${esc(genre)}</span>
        </div>
      </div>
    </div>`;
}

/* ── SVGs ── */
function heartSvg(a) {
  return `<svg viewBox="0 0 24 24" fill="${a?'currentColor':'none'}" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
}
function bookmarkSvg(a) {
  return `<svg viewBox="0 0 24 24" fill="${a?'currentColor':'none'}" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`;
}

/* ── Helpers ── */
function hideSkeleton() {
  const sk = document.getElementById('skeleton-grid');
  if (sk) sk.style.display = 'none';
}

function showSection(id) {
  ['wl-grid','wl-empty','wl-auth'].forEach(s => {
    const el = document.getElementById(s);
    if (el) el.style.display = s === id ? '' : 'none';
  });
}

function toast(msg, type = 'success') {
  let c = document.getElementById('toast-container');
  if (!c) { c = document.createElement('div'); c.id='toast-container'; document.body.appendChild(c); }
  const t = document.createElement('div');
  t.className = `toast toast--${type}`;
  t.innerHTML = `<span class="toast__icon">${type==='success'?'✓':'!'}</span><span class="toast__message">${msg}</span>`;
  c.appendChild(t);
  setTimeout(() => { t.classList.add('toast--exit'); setTimeout(() => t.remove(), 350); }, 3000);
}

function updateNavAvatar() {
  const name = localStorage.getItem('user_name') || '';
  const el = document.getElementById('nav-avatar');
  if (el && name) el.textContent = name[0].toUpperCase();
}

function initNavbar() {
  const h = document.getElementById('nav-hamburger');
  const d = document.getElementById('nav-mobile-drawer');
  if (h && d) h.addEventListener('click', () => { const o = d.classList.toggle('open'); h.setAttribute('aria-expanded', String(o)); });
  const nb = document.querySelector('.navbar');
  if (nb) window.addEventListener('scroll', () => nb.classList.toggle('scrolled', scrollY > 40), { passive: true });
}

function esc(v) {
  return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}