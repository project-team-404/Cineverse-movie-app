/* ================================================================
   CINEVERSE — favorites.js  v2.0
   GET  /favorites/           → [{id, user_id, movie_id}]
   POST /favorites/add/{id}
   DELETE /favorites/delete/{id}
================================================================ */

'use strict';

const FAV_BASE = 'https://cineverse-movie-app.onrender.com';
const FAV_PLACEHOLDER = 'assets/images/placeholder.jpg';

function favToken()    { return localStorage.getItem('access_token') || ''; }
function favLoggedIn() { return !!favToken(); }

function favHeaders() {
  return { 'Accept': 'application/json', 'Authorization': `Bearer ${favToken()}` };
}

/* ── Boot ── */
document.addEventListener('DOMContentLoaded', async () => {
  initNavbar();

  if (!favLoggedIn()) {
    hideSkeleton();
    showSection('fav-auth');
    return;
  }

  updateNavAvatar();

  try {
    const movies = await loadFavoriteMovies();
    hideSkeleton();
    renderGrid(movies);
  } catch (err) {
    console.error('[FAV]', err);
    hideSkeleton();
    toast('Could not load favorites. Please try again.', 'error');
    showSection('fav-empty');
  }
});

/* ================================================================
   FETCH — GET /favorites/ returns [{id, user_id, movie_id}]
   Then fetch each movie by movie_id from /movies/{id}
================================================================ */
async function loadFavoriteMovies() {
  const res = await fetch(`${FAV_BASE}/favorites/`, { headers: favHeaders() });

  if (res.status === 401) {
    localStorage.removeItem('access_token');
    window.location.href = 'login.html';
    return [];
  }
  if (!res.ok) throw new Error(`GET /favorites/ → ${res.status}`);

  const list = await res.json(); /* [{id, user_id, movie_id}] */

  if (!Array.isArray(list) || list.length === 0) return [];

  /* Fetch full movie details for each movie_id */
  const results = await Promise.all(
    list.map(async item => {
      const movieId = item.movie_id;
      if (!movieId) return null;
      try {
        const mRes = await fetch(`${FAV_BASE}/movies/${movieId}`, { headers: favHeaders() });
        if (!mRes.ok) return null;
        return normalizeMovie(await mRes.json());
      } catch { return null; }
    })
  );

  return results.filter(Boolean);
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
    poster_url:   poster || FAV_PLACEHOLDER,
    genre:        m.genre || {},
  };
}

function resolveImg(raw) {
  raw = String(raw || '').trim();
  if (!raw || raw === 'null') return '';
  if (/^https?:\/\//i.test(raw) || raw.startsWith('data:')) return raw;
  if (raw.startsWith('/')) return FAV_BASE + raw;
  return raw;
}

/* ================================================================
   RENDER
================================================================ */
function renderGrid(movies) {
  const countEl = document.getElementById('fav-count');
  if (countEl) countEl.textContent = `${movies.length} film${movies.length !== 1 ? 's' : ''}`;

  if (!movies.length) { showSection('fav-empty'); return; }

  const grid = document.getElementById('fav-grid');
  grid.innerHTML = movies.map((m, i) => buildCard(m, i)).join('');
  showSection('fav-grid');

  /* Wire remove-from-favorites */
  grid.querySelectorAll('.cv-remove-fav').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault(); e.stopPropagation();
      if (btn.dataset.loading) return;
      const id = btn.dataset.id;
      btn.dataset.loading = '1';
      btn.style.opacity = '0.4';
      await removeFavorite(id, btn.closest('.mgc'));
      delete btn.dataset.loading;
      btn.style.opacity = '';
    });
  });

  /* Wire add-to-watchlist from this page */
  grid.querySelectorAll('.cv-add-wl').forEach(btn => {
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
          ? `${FAV_BASE}/watchlist/${id}`
          : `${FAV_BASE}/watchlist/add/${id}`;
        const res = await fetch(url, { method, headers: favHeaders() });
        if (res.ok) {
          btn.classList.toggle('active', !active);
          btn.innerHTML = bookmarkSvg(!active);
          toast(!active ? '📌 Added to Watchlist' : 'Removed from Watchlist', !active ? 'success' : '');
        } else {
          toast('Could not update watchlist.', 'error');
        }
      } catch { toast('Network error.', 'error'); }
      delete btn.dataset.loading;
      btn.style.opacity = '';
    });
  });
}

/* ── Remove from favorites ── */
async function removeFavorite(movieId, cardEl) {
  try {
    const res = await fetch(`${FAV_BASE}/favorites/delete/${movieId}`, {
      method: 'DELETE',
      headers: favHeaders()
    });
    if (res.ok) {
      if (cardEl) {
        cardEl.style.transition = 'opacity 0.3s, transform 0.3s';
        cardEl.style.opacity = '0';
        cardEl.style.transform = 'scale(0.92)';
        setTimeout(() => {
          cardEl.remove();
          const rem = document.querySelectorAll('#fav-grid .mgc').length;
          const countEl = document.getElementById('fav-count');
          if (countEl) countEl.textContent = `${rem} film${rem !== 1 ? 's' : ''}`;
          if (rem === 0) showSection('fav-empty');
        }, 300);
      }
      toast('Removed from Favorites', '');
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
        <img src="${esc(m.poster_url)}" alt="${esc(m.title)}" loading="lazy" onerror="this.src='${FAV_PLACEHOLDER}'">
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
            <button class="mgc-action-btn cv-add-wl" data-id="${m.id}" aria-label="Watchlist" title="Add to Watchlist">
              ${bookmarkSvg(false)}
            </button>
            <button class="mgc-action-btn cv-remove-fav active" data-id="${m.id}" aria-label="Remove from Favorites" title="Remove from Favorites">
              ${heartSvg(true)}
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
  ['fav-grid','fav-empty','fav-auth'].forEach(s => {
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
const profileBtn =
document.getElementById(
'profile-btn'
);


const dropdown =
document.getElementById(
'profile-dropdown'
);


profileBtn.onclick=()=>{

dropdown.classList.toggle(
'active'
);

};



document.addEventListener(

'click',

e=>{

if(

!profileBtn.contains(e.target)

&&

!dropdown.contains(e.target)

){

dropdown.classList.remove(

'active'

);

}

}

);



const username=

localStorage.getItem(

'user_name'

)||'Guest';



const email=

localStorage.getItem(

'user_email'

)||'';



document.getElementById(

'dropdown-name'

).textContent=username;



document.getElementById(

'dropdown-email'

).textContent=email;



const initial=

username.charAt(

0

).toUpperCase();



profileBtn.textContent=initial;



document.getElementById(

'dropdown-avatar'

).textContent=initial;



document.getElementById(

'logout-btn'

).onclick=()=>{


localStorage.clear();



window.location.href=

'login.html';


};
