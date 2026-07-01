/* ================================================================
   CINEVERSE — MOVIE DETAILS PAGE CONTROLLER  v2.0
   API: https://movie-app-qhzc.onrender.com
   Reads ?id= from URL, fetches movie and related data.
================================================================ */

'use strict';

const API_BASE = window.API_BASE||
    "https://cineverse-movie-app.onrender.com";;
const PLACEHOLDER = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 450"><rect width="300" height="450" fill="#0f1530"/><text x="150" y="220" text-anchor="middle" fill="#ffffff20" font-size="48">🎬</text><text x="150" y="270" text-anchor="middle" fill="#ffffff15" font-size="14">No Image</text></svg>'
);

/* ── State ── */
let movie        = null;
let movieId      = null;
let isFav        = false;
let isWL         = false;
let currentRating = 0;
let galleryImages = [];
let lightboxIndex = 0;
let similarMovies = [];

/* ── Auth token ── */
function getToken() {
  // login.js stores the token under 'access_token'
  return localStorage.getItem('access_token') || '';
}

/* ── Helpers ── */
function normalizeBaseUrl(url) {
  return url.endsWith('/') ? url : url + '/';
}

function resolveImageUrl(raw) {
  if (!raw || raw === 'null' || raw === 'undefined' || String(raw).trim() === '') return PLACEHOLDER;
  raw = String(raw).trim();
  if (/^https?:\/\//i.test(raw) || raw.startsWith('data:')) return raw;
  if (raw.startsWith('//')) return 'https:' + raw;
  if (raw.startsWith('/')) return API_BASE + raw;
  return raw;
}

async function apiGet(path, params = {}) {
  const url = new URL(path, normalizeBaseUrl(API_BASE));
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  });
  const headers = { Accept: 'application/json' };
  if (getToken()) headers['authorization'] = `Bearer ${getToken()}`;
  const res = await fetch(url.toString(), { headers });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

async function apiPost(path, body = {}) {
  const res = await fetch(normalizeBaseUrl(API_BASE) + path.replace(/^\//, ''), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(getToken() ? { 'authorization': `Bearer ${getToken()}` } : {})
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

async function apiDelete(path) {
  const res = await fetch(normalizeBaseUrl(API_BASE) + path.replace(/^\//, ''), {
    method: 'DELETE',
    headers: {
      'Accept': 'application/json',
      ...(getToken() ? { 'authorization': `Bearer ${getToken()}` } : {})
    }
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.status === 204 ? null : res.json();
}

async function apiPatch(path, body = {}) {
  const res = await fetch(normalizeBaseUrl(API_BASE) + path.replace(/^\//, ''), {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(getToken() ? { 'authorization': `Bearer ${getToken()}` } : {})
    },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}
/* ================================================================
   WATCH HISTORY
================================================================ */


function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function el(id) { return document.getElementById(id); }

function setTextContent(id, value) {
  const node = el(id);
  if (node) node.textContent = value;
}

function truncate(str, max) {
  if (!str) return '';
  return str.length > max ? str.slice(0, max).trimEnd() + '…' : str;
}

/* ================================================================
   BOOT
================================================================ */
document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  movieId = params.get('id');

  console.log('Movie ID:', movieId);

  if (!movieId) {
    showError('No movie ID provided. Please go back and select a movie.');
    return;
  }

  initNav();
  initLightbox();
  initTrailerModal();
  animateLoadingBar();

  try {
    movie = await getMovieDetails(movieId);
    console.log('Movie Data:', movie);

    await renderPage(movie);
    hideLoading();
    showContent();
    initScrollReveal();
    initParallax();
    initFloatingPanel();

    // These are non-critical — run independently, never block page display
    loadReviews().catch(console.warn);
    loadSimilarMovies().catch(console.warn);
    loadFavStatus().catch(console.warn);

  } catch (err) {
    console.error('Failed to load movie:', err);
    showError('Unable to load movie details. The server may be starting up — please try again in a moment.');
  }
});

/* ================================================================
   API MODULES
================================================================ */
async function getMovieDetails(id) {
  return apiGet(`/movies/${id}`);
}

async function getSimilarMovies(genreName, currentId) {
  try {
    // Use backend filter endpoint to fetch movies of the same genre directly
    const data = await apiGet('/movies/filter/', {
      genre: genreName,
      page: 1,
      limit: 50,
    });
    const list = Array.isArray(data) ? data : (data?.results || data?.items || data?.movies || []);
    // Exclude the current movie
    const sameGenre = list.filter(m => String(m.id) !== String(currentId));
    return sameGenre.slice(0, 6);
  } catch {
    return [];
  }
}

/* ================================================================
   LOADING / ERROR
================================================================ */
function animateLoadingBar() {
  let progress = 0;
  const bar = el('loading-bar');
  const tick = setInterval(() => {
    progress += Math.random() * 12;
    if (progress >= 90) { clearInterval(tick); progress = 90; }
    if (bar) bar.style.width = progress + '%';
  }, 120);
  window._loadingTick = tick;
}

function hideLoading() {
  clearInterval(window._loadingTick);
  const bar = el('loading-bar');
  if (bar) bar.style.width = '100%';
  setTimeout(() => {
    const screen = el('loading-screen');
    if (screen) screen.classList.add('hidden');
  }, 400);
}

function showContent() {
  const content = el('page-content');
  if (content) {
    content.classList.remove('hidden');
    // Trigger reflow so CSS transitions fire
    content.offsetHeight; // eslint-disable-line
  }
}

function showError(msg) {
  clearInterval(window._loadingTick);
  const screen = el('loading-screen');
  if (screen) screen.classList.add('hidden');
  const err = el('error-screen');
  if (err) err.classList.remove('hidden');
  const msgEl = el('error-msg');
  if (msgEl) msgEl.textContent = msg || 'Unable to load movie details. Please try again.';
  const retryBtn = el('retry-btn');
  if (retryBtn) {
    retryBtn.replaceWith(retryBtn.cloneNode(true)); // clear old listeners
    el('retry-btn').addEventListener('click', () => location.reload());
  }
}

/* ================================================================
   RENDER PAGE
================================================================ */
async function renderPage(m) {
  const poster   = resolveImageUrl(m.poster_url);
  const backdrop = (m.images && m.images.length > 0 && m.images[0].image_url)
    ? resolveImageUrl(m.images[0].image_url)
    : poster;

  const genreName = m.genre?.name || 'Film';
  const rating    = Number(m.rating || 0);
  const year      = m.release_year || '—';
  const runtime   = m.duration ? `${m.duration} min` : '—';
  const lang      = m.language || '—';

  document.title = `${m.title} — CineVerse`;

  renderMovieHero(m, backdrop, poster, genreName, rating, year, runtime, lang);
  renderMovieInfo(m, genreName, rating, year, runtime, lang);
  renderPoster(poster, m.title);
  renderTrailer(m);
  renderGallery(m);
  renderStats(rating, m.duration, lang, genreName, year);
  wireButtons(m);
}

/* ── SECTION 1: HERO ── */
function renderMovieHero(m, backdrop, poster, genreName, rating, year, runtime, lang) {
  const heroBg = el('hero-bg');
  if (heroBg) {
    heroBg.style.backgroundImage = `url(${backdrop})`;
    const img = new Image();
    img.onload  = () => heroBg.classList.add('loaded');
    img.onerror = () => {
      // Fallback to poster if backdrop fails
      heroBg.style.backgroundImage = `url(${poster})`;
      const img2 = new Image();
      img2.onload = () => heroBg.classList.add('loaded');
      img2.src = poster;
    };
    img.src = backdrop;
  }

  const trailerBg = el('trailer-bg-img');
  if (trailerBg) trailerBg.style.backgroundImage = `url(${backdrop})`;

  setTextContent('hero-title',         m.title || 'Untitled');
  setTextContent('hero-genre-eyebrow', genreName);
  setTextContent('hero-rating',        rating.toFixed(1));
  setTextContent('hero-year',          year);
  setTextContent('hero-runtime',       runtime);
  setTextContent('hero-lang',          lang);
  setTextContent('hero-genre',         genreName);
  setTextContent('hero-desc',          truncate(m.description, 200));
}

/* ── SECTION 2: INFO CARDS ── */
function renderMovieInfo(m, genreName, rating, year, runtime, lang) {
  setTextContent('info-rating',  rating.toFixed(1));
  setTextContent('info-runtime', runtime);
  setTextContent('info-lang',    lang);
  setTextContent('info-year',    year);
  setTextContent('info-genre',   genreName);
}

/* ── SECTION 3: STORY / POSTER ── */
function renderPoster(posterUrl, title) {
  const storyDesc   = el('story-desc');
  const storyPoster = el('story-poster');

  if (storyDesc && movie?.description) {
    storyDesc.textContent = movie.description;
  }

  if (storyPoster) {
    if (posterUrl && posterUrl !== PLACEHOLDER) {
      storyPoster.src   = posterUrl;
      storyPoster.alt   = title || 'Movie Poster';
      storyPoster.onerror = () => {
        storyPoster.src = PLACEHOLDER;
      };
    } else {
      // Show premium placeholder card
      const wrap = storyPoster.closest('.story-poster-wrap');
      if (wrap) {
        wrap.innerHTML = `
          <div style="
            width:100%; aspect-ratio:2/3; background:var(--bg-elevated);
            border-radius:var(--radius-2xl); display:flex; flex-direction:column;
            align-items:center; justify-content:center; gap:var(--space-4);
            border:1px solid var(--glass-border);
          ">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" width="48" height="48" style="color:rgba(255,255,255,0.15)"><rect x="2" y="2" width="20" height="20" rx="3"/><path d="M2 9h20M9 2v20"/></svg>
            <span style="color:var(--white-30); font-size:var(--text-sm); letter-spacing:var(--tracking-widest); text-transform:uppercase;">No Poster</span>
          </div>
        `;
      }
    }
  }
}

/* ── SECTION 4: TRAILER ── */
function renderTrailer(m) {
  const trailerUrl = m?.trailer_url;
  const hasTrailer = trailerUrl && String(trailerUrl).trim() !== '' &&
                     trailerUrl !== 'null' && trailerUrl !== 'undefined';

  const previewCard = el('trailer-preview');
  if (!previewCard) return;

  if (!hasTrailer) {
    // Premium "No Trailer" empty state — replace the whole preview card
    previewCard.innerHTML = `
      <div style="
        width:100%; height:100%; display:flex; flex-direction:column;
        align-items:center; justify-content:center; gap:var(--space-5);
        background:var(--bg-elevated); border-radius:var(--radius-2xl);
        border:1px dashed rgba(255,255,255,0.1);
      ">
        <div style="
          width:72px; height:72px; border-radius:50%;
          background:var(--white-05); border:1px solid var(--glass-border);
          display:flex; align-items:center; justify-content:center;
          color:var(--white-30);
        ">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="28" height="28">
            <polygon points="5,3 19,12 5,21" stroke-dasharray="3 2"/>
            <line x1="2" y1="2" x2="22" y2="22" stroke="currentColor" stroke-width="1.5"/>
          </svg>
        </div>
        <div style="text-align:center;">
          <div style="font-family:var(--font-display); font-size:var(--text-2xl); letter-spacing:var(--tracking-wide); color:var(--white-60); margin-bottom:var(--space-2);">No Trailer Available</div>
          <div style="font-size:var(--text-sm); color:var(--white-30); letter-spacing:var(--tracking-wide);">Check back soon for the official trailer</div>
        </div>
      </div>
    `;
    previewCard.style.cursor = 'default';
    // Also disable the play button click
    el('trailer-play-btn')?.remove();
  } else {
    // Trailer exists — wire up the preview card click
    previewCard.addEventListener('click', openTrailer);
  }
}

/* ── SECTION 5: GALLERY ── */
function renderGallery(m) {
  const track = el('gallery-track');
  if (!track) return;

  // Build image list from images array + poster fallback
  galleryImages = [];
  if (m.images && m.images.length > 0) {
    m.images.forEach(img => {
      if (img.image_url && String(img.image_url).trim() !== '') {
        galleryImages.push(resolveImageUrl(img.image_url));
      }
    });
  }

  // Add poster if not already there
  const posterUrl = resolveImageUrl(m.poster_url);
  if (posterUrl !== PLACEHOLDER && !galleryImages.includes(posterUrl)) {
    galleryImages.unshift(posterUrl);
  }

  // Deduplicate
  galleryImages = [...new Set(galleryImages)];

  if (!galleryImages.length) {
    track.innerHTML = `
      <div style="
        width:100%; padding:var(--space-16) var(--space-8);
        display:flex; flex-direction:column; align-items:center; gap:var(--space-4);
        color:var(--white-30);
      ">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
        <span style="font-size:var(--text-sm); letter-spacing:var(--tracking-widest); text-transform:uppercase;">No Images Available</span>
      </div>
    `;
    // Hide the nav buttons
    el('gallery-prev')?.style && (el('gallery-prev').style.display = 'none');
    el('gallery-next')?.style && (el('gallery-next').style.display = 'none');
    return;
  }

  track.innerHTML = galleryImages.map((src, i) => `
    <div class="gallery-item" data-index="${i}" role="button" tabindex="0" aria-label="View image ${i + 1}">
      <img src="${escHtml(src)}" alt="Gallery image ${i + 1}" loading="lazy" onerror="this.src='${PLACEHOLDER}'">
      <div class="gallery-item-overlay">
        <svg class="gallery-zoom-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="28" height="28">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
        </svg>
      </div>
    </div>
  `).join('');

  track.querySelectorAll('.gallery-item').forEach(item => {
    item.addEventListener('click',   () => openLightbox(parseInt(item.dataset.index)));
    item.addEventListener('keydown', e  => { if (e.key === 'Enter') openLightbox(parseInt(item.dataset.index)); });
  });

  el('gallery-prev')?.addEventListener('click', () => track.scrollBy({ left: -360, behavior: 'smooth' }));
  el('gallery-next')?.addEventListener('click', () => track.scrollBy({ left:  360, behavior: 'smooth' }));
}

/* ── SECTION 6: SIMILAR MOVIES ── */
async function loadSimilarMovies() {
  const track = el('similar-track');
  if (!track || !movie) return;

  // Skeleton loaders
  track.innerHTML = Array.from({ length: 6 }, () => `
    <div class="movie-card-skeleton">
      <div class="skeleton sk-poster"></div>
      <div class="skeleton sk-title"></div>
      <div class="skeleton sk-year"></div>
    </div>
  `).join('');

  try {
    similarMovies = await getSimilarMovies(movie.genre?.name, movieId);

    if (!similarMovies.length) {
      track.innerHTML = `
        <div style="padding:var(--space-8); color:var(--white-30); font-size:var(--text-sm);">
          No similar movies found.
        </div>
      `;
      return;
    }

    track.innerHTML = similarMovies.map(m => buildMovieCard(m)).join('');
    wireCarousel('sim-prev', 'sim-next', track);
  } catch (err) {
    console.warn('Similar movies error:', err);
    track.innerHTML = `
      <div style="padding:var(--space-8); color:var(--white-30); font-size:var(--text-sm);">
        Could not load similar movies.
      </div>
    `;
  }
}

/* ── STATS ── */
function renderStats(rating, duration, lang, genreName, year) {
  setTextContent('stat-rating',  rating ? rating.toFixed(1) : '—');
  setTextContent('stat-runtime', duration || '—');
  setTextContent('stat-lang',    lang);
  setTextContent('stat-genre',   genreName);
  setTextContent('stat-year',    year);

  const statRatingBar = el('stat-bar-rating');
  if (statRatingBar) statRatingBar.style.setProperty('--fill-w', `${(rating / 10) * 100}%`);

  const statRuntimeBar = el('stat-bar-runtime');
  if (statRuntimeBar && duration) statRuntimeBar.style.setProperty('--fill-w', `${Math.min((duration / 240) * 100, 100)}%`);

  const statYearBar = el('stat-bar-year');
  if (statYearBar && year && year !== '—') {
    statYearBar.style.setProperty('--fill-w', `${Math.min(((year - 1900) / 130) * 100, 100)}%`);
  }
}

/* ================================================================
   LIGHTBOX
================================================================ */
function initLightbox() {
  const lb        = el('lightbox');
  const closeBtn  = el('lightbox-close');
  const prevBtn   = el('lb-prev');
  const nextBtn   = el('lb-next');

  if (!lb) return;

  closeBtn?.addEventListener('click', closeLightbox);
  lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });

  prevBtn?.addEventListener('click', () => {
    lightboxIndex = (lightboxIndex - 1 + galleryImages.length) % galleryImages.length;
    renderLightboxImage();
  });
  nextBtn?.addEventListener('click', () => {
    lightboxIndex = (lightboxIndex + 1) % galleryImages.length;
    renderLightboxImage();
  });

  document.addEventListener('keydown', e => {
    if (!lb || lb.classList.contains('hidden')) return;
    if (e.key === 'ArrowLeft')  { lightboxIndex = (lightboxIndex - 1 + galleryImages.length) % galleryImages.length; renderLightboxImage(); }
    if (e.key === 'ArrowRight') { lightboxIndex = (lightboxIndex + 1) % galleryImages.length; renderLightboxImage(); }
    if (e.key === 'Escape')     closeLightbox();
  });
}

function openLightbox(index) {
  lightboxIndex = index;
  const lb = el('lightbox');
  if (lb) lb.classList.remove('hidden');
  renderLightboxImage();
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  el('lightbox')?.classList.add('hidden');
  document.body.style.overflow = '';
}

function renderLightboxImage() {
  const img     = el('lightbox-img');
  const counter = el('lightbox-counter');
  if (img) {
    img.src = galleryImages[lightboxIndex] || PLACEHOLDER;
    img.alt = `Gallery image ${lightboxIndex + 1}`;
  }
  if (counter) counter.textContent = `${lightboxIndex + 1} / ${galleryImages.length}`;
}

/* ================================================================
   TRAILER MODAL
================================================================ */
function initTrailerModal() {
  const modal    = el('trailer-modal');
  const closeBtn = el('trailer-close');

  if (!modal) return;

  closeBtn?.addEventListener('click', closeTrailer);
  modal.addEventListener('click', e => { if (e.target === modal) closeTrailer(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modal.classList.contains('active')) closeTrailer();
  });
}

function getYouTubeId(url) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

/* ================================================================
   WATCH HISTORY — POST /watch-history/
   Called on trailer open and during video playback.
================================================================ */
async function updateWatchHistory(progressSecs, completed) {
  if (!getToken() || !movieId) return;
  try {
    await fetch('https://cineverse-movie-app.onrender.com/watch-history/', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
      },
      body: JSON.stringify({
        movie_id:  Number(movieId),
        progress:  progressSecs || 0,
        completed: completed || false
      })
    });
  } catch (e) {
    /* non-fatal — watch history is a background task */
    console.warn('[WH] updateWatchHistory failed:', e.message);
  }
}

function openTrailer() {
  const trailerUrl = movie?.trailer_url;
  if (!trailerUrl || String(trailerUrl).trim() === '') {
    showToast('No trailer available for this movie.', 'error');
    return;
  }

  const ytId  = getYouTubeId(trailerUrl);
  const modal = el('trailer-modal');
  const wrap  = el('trailer-video-wrap');
  if (!modal || !wrap) return;

  if (ytId) {
    wrap.innerHTML = `<iframe src="https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
  } else {
   wrap.innerHTML = `
<video
    id="movie-player"
    controls
    autoplay
    style="width:100%;height:100%;background:#000">

    <source src="${escHtml(trailerUrl)}">

    <p style="color:#fff;text-align:center;padding:2rem">
        Unable to play trailer.
    </p>

</video>`;
const player = document.getElementById("movie-player");

if (player) {

    // Update watch progress while watching
    player.addEventListener("timeupdate", () => {

        updateWatchHistory(
            Math.floor(player.currentTime),
            false
        );

    });

    // Mark as completed when finished
    player.addEventListener("ended", () => {

        updateWatchHistory(
            Math.floor(player.duration),
            true
        );

    });

}
  }

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  // Save watch history
updateWatchHistory(0, false);
}

function closeTrailer() {
  const modal = el('trailer-modal');
  const wrap  = el('trailer-video-wrap');
  if (modal) modal.classList.remove('active');
  if (wrap)  wrap.innerHTML = '';
  document.body.style.overflow = '';
}

/* ================================================================
   BUTTONS
================================================================ */
function wireButtons(m) {
  // Trailer
  el('btn-trailer')?.addEventListener('click', openTrailer);
  el('float-trailer')?.addEventListener('click', openTrailer);

  // Watchlist
  isWL = isInWatchlist(m.id);
  updateWLUI();
  const toggleWL = () => {
    isWL = toggleWatchlist(m);
    updateWLUI();
    showToast(isWL ? '✓ Added to Watchlist' : 'Removed from Watchlist', isWL ? 'success' : '');
  };
  el('btn-watchlist')?.addEventListener('click', toggleWL);
  el('float-wl')?.addEventListener('click', toggleWL);

  // Favorites
  el('btn-fav-hero')?.addEventListener('click', toggleFavAPI);
  el('float-fav')?.addEventListener('click', toggleFavAPI);

  // Share
  const shareHandler = async () => {
    const data = { title: m.title, text: m.description, url: window.location.href };
    if (navigator.share) {
      try { await navigator.share(data); } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        showToast('Link copied to clipboard!', 'success');
      } catch {
        showToast('Copy the URL from your address bar.', '');
      }
    }
  };
  el('btn-share')?.addEventListener('click', shareHandler);
  el('float-share')?.addEventListener('click', shareHandler);
}

function updateWLUI() {
  const label   = el('watchlist-label');
  const btn     = el('btn-watchlist');
  const floatBtn = el('float-wl');
  if (label)    label.textContent = isWL ? 'In Watchlist' : 'Add to Watchlist';
  if (btn)      btn.style.borderColor = isWL ? 'var(--gold-dim)' : '';
  if (floatBtn) floatBtn.classList.toggle('active', isWL);
}

function updateFavUI() {
  const heroIcon  = el('fav-hero-icon');
  const heroBtn   = el('btn-fav-hero');
  const floatIcon = el('float-fav-icon');
  const floatBtn  = el('float-fav');
  if (heroIcon)  heroIcon.style.fill  = isFav ? 'var(--rose)' : 'none';
  if (heroBtn)   heroBtn.classList.toggle('active', isFav);
  if (floatIcon) floatIcon.style.fill = isFav ? 'var(--rose)' : 'none';
  if (floatBtn)  floatBtn.classList.toggle('active', isFav);
}

async function loadFavStatus() {
  if (!getToken() || !movieId) return;
  try {
    const favs = await apiGet('/favorites/');
    const list = Array.isArray(favs) ? favs : (favs?.items || []);
    isFav = list.some(f => String(f.id || f.movie_id) === String(movieId));
    updateFavUI();
  } catch {}
}

async function toggleFavAPI() {
  if (!getToken()) { showToast('Sign in to manage favorites.', 'error'); return; }
  try {
    if (isFav) {
      await apiDelete(`/favorites/${movieId}`);
      isFav = false;
      showToast('Removed from Favorites');
    } else {
      await apiPost(`/favorites/${movieId}`);
      isFav = true;
      showToast('♥ Added to Favorites', 'success');
    }
    updateFavUI();
  } catch {
    showToast('Could not update favorites. Are you signed in?', 'error');
  }
}

/* ── Watchlist (localStorage) ── */
function getWatchlist() {
  try { return JSON.parse(localStorage.getItem('cv_watchlist') || '[]'); } catch { return []; }
}
function saveWatchlist(list) { localStorage.setItem('cv_watchlist', JSON.stringify(list)); }
function isInWatchlist(id) { return getWatchlist().some(m => String(m.id) === String(id)); }
function toggleWatchlist(mv) {
  let list = getWatchlist();
  const idx = list.findIndex(m => String(m.id) === String(mv.id));
  if (idx >= 0) { list.splice(idx, 1); saveWatchlist(list); return false; }
  list.push({ id: mv.id, title: mv.title, poster_url: mv.poster_url, release_year: mv.release_year });
  saveWatchlist(list);
  return true;
}

/* ================================================================
   MOVIE CARD BUILDER
================================================================ */
function buildMovieCard(m) {
  const poster = resolveImageUrl(m.poster_url);
  const rating = m.rating ? Number(m.rating).toFixed(1) : '—';
  const year   = m.release_year || '—';
  return `
    <div class="movie-card">
      <a href="movie-details.html?id=${m.id}" class="movie-card-poster" tabindex="-1">
        <img src="${escHtml(poster)}" alt="${escHtml(m.title || '')}" loading="lazy" onerror="this.src='${PLACEHOLDER}'">
        <div class="movie-card-rating">
          <svg viewBox="0 0 24 24" width="10" height="10" fill="#f4c542"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          ${rating}
        </div>
        <div class="movie-card-overlay">
          <a href="movie-details.html?id=${m.id}" class="movie-card-play" aria-label="Watch ${escHtml(m.title || '')}">
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><polygon points="5,3 19,12 5,21"/></svg>
          </a>
        </div>
      </a>
      <div class="movie-card-info">
        <a href="movie-details.html?id=${m.id}" class="movie-card-title">${escHtml(m.title || '')}</a>
        <div class="movie-card-year">${year}</div>
      </div>
    </div>
  `;
}

function wireCarousel(prevId, nextId, track) {
  el(prevId)?.addEventListener('click', () => track.scrollBy({ left: -200, behavior: 'smooth' }));
  el(nextId)?.addEventListener('click', () => track.scrollBy({ left:  200, behavior: 'smooth' }));

  // Drag scroll
  let isDown = false, startX = 0, scrollLeft = 0;
  track.addEventListener('mousedown',  e => { isDown = true; track.style.cursor = 'grabbing'; startX = e.pageX - track.offsetLeft; scrollLeft = track.scrollLeft; });
  track.addEventListener('mouseleave', () => { isDown = false; track.style.cursor = 'grab'; });
  track.addEventListener('mouseup',    () => { isDown = false; track.style.cursor = 'grab'; });
  track.addEventListener('mousemove',  e => {
    if (!isDown) return;
    const x = e.pageX - track.offsetLeft;
    track.scrollLeft = scrollLeft - (x - startX) * 1.5;
  });
}

/* ================================================================
   REVIEWS
================================================================ */
async function loadReviews() {
  const list    = el('reviews-list');
  const loading = el('reviews-loading');
  if (!list || !movieId) return;

  try {
    const data    = await apiGet(`/reviews/${movieId}`);
    const reviews = Array.isArray(data) ? data : (data?.results || data?.items || []);

    if (loading) loading.remove();

    if (!reviews.length) {
      el('reviews-empty')?.classList.remove('hidden');
      return;
    }

    list.innerHTML = reviews.map((r, i) => buildReviewCard(r, i)).join('');
    wireReviewActions();
  } catch {
    if (loading) loading.remove();
    el('reviews-empty')?.classList.remove('hidden');
  }
}

function buildReviewCard(review, idx) {
  const stars    = Number(review.rating || 0);
  const starsHtml = Array.from({ length: 5 }, (_, i) =>
    `<span class="review-star">${i < stars ? '★' : '☆'}</span>`
  ).join('');
  const username = review.user?.name || review.username || `Viewer ${idx + 1}`;
  const initial  = username[0]?.toUpperCase() || 'U';
  const date     = review.created_at ? new Date(review.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '';
  const reviewId = review.id;
  const isOwn    = getToken() && (review.user_id || review.user?.id);

  return `
    <div class="review-card" data-review-id="${reviewId}" style="animation-delay:${idx * 0.05}s">
      <div class="review-card-header">
        <div class="review-meta-left">
          <div class="review-avatar">${initial}</div>
          <div>
            <div class="review-user">${escHtml(username)}</div>
            <div class="review-stars">${starsHtml}</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:var(--space-4);flex-shrink:0;">
          <div class="review-date">${date}</div>
          ${isOwn ? `<div class="review-actions-row">
            <button class="review-action-btn edit-review" data-id="${reviewId}" data-rating="${stars}" data-text="${escHtml(review.content || '')}">Edit</button>
            <button class="review-action-btn delete delete-review" data-id="${reviewId}">Delete</button>
          </div>` : ''}
        </div>
      </div>
      <p class="review-text">${escHtml(review.content || '')}</p>
    </div>
  `;
}

function wireReviewActions() {
  document.querySelectorAll('.edit-review').forEach(btn => {
    btn.addEventListener('click', () => {
      openReviewForm(true, btn.dataset.id, parseInt(btn.dataset.rating) || 0, btn.dataset.text);
    });
  });
  document.querySelectorAll('.delete-review').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this review?')) return;
      try {
        await apiDelete(`/reviews/${btn.dataset.id}`);
        btn.closest('.review-card')?.remove();
        showToast('Review deleted.', 'success');
        checkReviewsEmpty();
      } catch { showToast('Could not delete review.', 'error'); }
    });
  });
}

function checkReviewsEmpty() {
  const list = el('reviews-list');
  if (list && !list.querySelector('.review-card')) {
    el('reviews-empty')?.classList.remove('hidden');
  }
}

// Write review
document.addEventListener('DOMContentLoaded', () => {
  el('btn-write-review')?.addEventListener('click', () => {
    if (!getToken()) {
      showToast('Please sign in to write a review.', 'error');
      setTimeout(() => { window.location.href = 'login.html'; }, 1200);
      return;
    }
    el('review-auth-note')?.classList.add('hidden');
    openReviewForm(false);
  });

  el('cancel-review-btn')?.addEventListener('click', () => {
    el('review-form-wrap')?.classList.add('hidden');
    currentRating = 0;
    renderStarPicker(0);
    if (el('review-textarea')) el('review-textarea').value = '';
  });

  el('submit-review-btn')?.addEventListener('click', async () => {
    if (!getToken()) { showToast('Sign in to submit a review.', 'error'); return; }
    const text = el('review-textarea')?.value?.trim();
    if (!text) { showToast('Please write something first.', 'error'); return; }
    const editId = el('edit-review-id')?.value;
    const submitBtn = el('submit-review-btn');
    try {
      if (submitBtn) { submitBtn.textContent = 'Submitting…'; submitBtn.disabled = true; }
      if (editId) {
        await apiPatch(`/reviews/${editId}`, { content: text, rating: currentRating });
        showToast('Review updated!', 'success');
      } else {
        await apiPost(`/reviews/${movieId}`, { content: text, rating: currentRating });
        showToast('Review posted!', 'success');
      }
      el('review-form-wrap')?.classList.add('hidden');
      currentRating = 0;
      if (el('review-textarea')) el('review-textarea').value = '';
      loadReviews().catch(console.warn);
    } catch {
      showToast('Could not submit review. Are you signed in?', 'error');
    } finally {
      if (submitBtn) { submitBtn.textContent = 'Submit Review'; submitBtn.disabled = false; }
    }
  });

  // Star picker
  document.querySelectorAll('.star-btn').forEach(btn => {
    btn.addEventListener('click',     () => { currentRating = parseInt(btn.dataset.val); renderStarPicker(currentRating); });
    btn.addEventListener('mouseover', () => renderStarPicker(parseInt(btn.dataset.val)));
    btn.addEventListener('mouseout',  () => renderStarPicker(currentRating));
  });
});

function openReviewForm(isEdit = false, reviewId = null, rating = 0, text = '') {
  const wrap    = el('review-form-wrap');
  const heading = el('review-form-heading');
  const textarea = el('review-textarea');
  const editId   = el('edit-review-id');
  if (heading)  heading.textContent = isEdit ? 'Edit Your Review' : 'Write a Review';
  if (textarea) textarea.value = text;
  if (editId)   editId.value   = reviewId || '';
  currentRating = rating;
  renderStarPicker(rating);
  wrap?.classList.remove('hidden');
  wrap?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderStarPicker(activeRating) {
  document.querySelectorAll('.star-btn').forEach(btn => {
    btn.classList.toggle('active', parseInt(btn.dataset.val) <= activeRating);
  });
}

/* ================================================================
   NAVBAR
================================================================ */
function initNav() {
  const navbar    = document.querySelector('.navbar');
  const hamburger = el('nav-hamburger');
  const drawer    = el('nav-mobile-drawer');

  window.addEventListener('scroll', () => {
    if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });

  hamburger?.addEventListener('click', () => {
    hamburger.classList.toggle('open');
    drawer?.classList.toggle('open');
  });

  // login.js stores name/email as flat strings under 'user_name' and 'user_email'
  const userName  = localStorage.getItem('user_name');
  const userEmail = localStorage.getItem('user_email');
  const avatar    = el('nav-avatar');
  if (avatar && (userName || userEmail)) {
    avatar.textContent = (userName || userEmail || 'U')[0].toUpperCase();
  }
}

/* ================================================================
   SCROLL REVEAL & PARALLAX
================================================================ */
function initScrollReveal() {
  const items = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        if (entry.target.id === 'stats-section') animateStatBars();
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  items.forEach(item => io.observe(item));
}

function animateStatBars() {
  ['stat-bar-rating', 'stat-bar-runtime', 'stat-bar-year'].forEach(id => {
    const bar = el(id);
    if (!bar) return;
    const target = bar.style.getPropertyValue('--fill-w') || '0%';
    setTimeout(() => { bar.style.width = target; }, 100);
  });
}

function initParallax() {
  const bg         = el('hero-bg');
  const hero       = el('details-hero');
  const depthLayer = el('hero-depth');

  if (bg) {
    window.addEventListener('scroll', () => {
      const y = window.scrollY;
      if (y < window.innerHeight * 1.2) {
        bg.style.transform = `scale(1) translateY(${y * 0.35}px)`;
      }
    }, { passive: true });
  }

  if (hero && depthLayer) {
    hero.addEventListener('mousemove', e => {
      const x = ((e.clientX / window.innerWidth)  * 100).toFixed(1);
      const y = ((e.clientY / window.innerHeight) * 100).toFixed(1);
      depthLayer.style.setProperty('--mx', `${x}%`);
      depthLayer.style.setProperty('--my', `${y}%`);
    });
  }
}

/* ================================================================
   FLOATING PANEL
================================================================ */
function initFloatingPanel() {
  const panel = el('floating-panel');
  if (!panel) return;
  const toggle = () => {
    panel.classList.toggle('visible', window.scrollY > window.innerHeight * 0.5);
  };
  window.addEventListener('scroll', toggle, { passive: true });
}

/* ================================================================
   TOAST
================================================================ */
function showToast(msg, type = '') {
  const container = el('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `toast${type ? ' ' + type : ''}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toast-out 0.3s var(--ease-cinematic) forwards';
    setTimeout(() => toast.remove(), 300);
  }, 2800);
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