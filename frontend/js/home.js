/* ============================================================
   CINEVERSE - HOME PAGE CONTROLLER
   Synced to FastAPI backend: https://cineverse-movie-app.onrender.com
   API fields used exactly as returned:
     movie: id, title, description, release_year, duration,
            language, rating, poster_url, trailer_url,
            genre{id,name}, images[{id,image_url}]
     genre: id, name
   Home endpoint: GET /movies/home/ → {top_rated, latest, recently_added}
     top_rated      → Top Rated All Time section
     recently_added → Recently Added section
     latest         → Latest Releases section
   ============================================================ */

/* ── BASE CONFIG ── */
const CINEVERSE_API_BASE = 'https://cineverse-movie-app.onrender.com';
const CINEVERSE_API_LIMIT = 200;
const CV_PLACEHOLDER = 'assets/images/placeholder.jpg';
const CV_BACKDROP_FALLBACK =
  (typeof FALLBACK_BACKDROPS !== 'undefined' && Array.isArray(FALLBACK_BACKDROPS) && FALLBACK_BACKDROPS[0])
  || CV_PLACEHOLDER;

/* ── STATE (fetched once, reused everywhere) ── */
let homeMovies      = [];   // all movies from GET /movies/
let homeData        = null; // structured data from GET /movies/home/
let cachedGenres    = [];   // raw list from GET /genres/
let genreMap        = {};   // {id: name} built from cachedGenres
let heroMovies      = [];
let heroIndex       = 0;
let heroTimer       = null;

/* ── PATCH TMDB IF PRESENT ── */
if (typeof TMDB !== 'undefined' && TMDB) {
  const _posterURL   = TMDB.posterURL.bind(TMDB);
  const _backdropURL = TMDB.backdropURL.bind(TMDB);
  TMDB.posterURL   = (path, size) => resolveApiImage(path) || _posterURL(path, size);
  TMDB.backdropURL = (path, size) => resolveApiImage(path) || _backdropURL(path, size);
}

/* ============================================================
   API HELPERS
============================================================ */
function normalizeBaseUrl(v) {
  const s = String(v || '').trim();
  return s.endsWith('/') ? s : s + '/';
}

async function apiGet(path, params = {}) {
  const url = new URL(path, normalizeBaseUrl(CINEVERSE_API_BASE));
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '' && v !== 'all') url.searchParams.set(k, v);
  });
  const res = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${url}`);
  return res.json();
}

/* ============================================================
   IMAGE RESOLUTION
   Backend poster_url is always an absolute URL (http/https).
   Never double-prepend the base.
============================================================ */
function resolveApiImage(value) {
  const raw = String(value || '').trim();
  if (!raw || raw === 'null' || raw === 'undefined') return '';
  if (/^https?:\/\//i.test(raw) || raw.startsWith('data:') || raw.startsWith('blob:')) return raw;
  if (raw.startsWith('//')) return location.protocol + raw;
  if (raw.startsWith('/')) return normalizeBaseUrl(CINEVERSE_API_BASE).replace(/\/$/, '') + raw;
  return raw;
}

function getPoster(movie) {
  /* Priority: poster_url (backend field) → images[0].image_url → placeholder */
  const url = resolveApiImage(
    movie?.poster_url ||
    movie?.poster_path ||
    (movie?.images && movie.images[0] && movie.images[0].image_url) ||
    ''
  );
  return url || CV_PLACEHOLDER;
}

function getBackdrop(movie) {
  /* Prefer images[1] as backdrop, then images[0], then poster_url */
  const url = resolveApiImage(
    movie?.backdrop_url ||
    (movie?.images && movie.images[1] && movie.images[1].image_url) ||
    (movie?.images && movie.images[0] && movie.images[0].image_url) ||
    movie?.poster_url ||
    movie?.poster_path ||
    ''
  );
  return url || getPoster(movie) || CV_BACKDROP_FALLBACK;
}

/* ============================================================
   MOVIE NORMALIZATION
   Maps every backend field to a unified shape used by all UI builders.
   release_year (int) → release_date string for fmtYear compatibility.
============================================================ */
function normalizeMovie(raw) {
  if (!raw || raw.id == null) return null;

  const images      = Array.isArray(raw.images) ? raw.images : [];
  // Backend: genre is an object {id, name}
  const genreObj    = (raw.genre && typeof raw.genre === 'object') ? raw.genre : {};
  const genreId     = genreObj.id ?? raw.genre_id ?? null;
  const genreName   = genreObj.name || (genreId != null ? genreMap[genreId] : null) || 'Film';

  // Backend: release_year is an integer, not a date string
  const releaseYear = raw.release_year || yearFromStr(raw.release_date) || null;
  // Construct a sortable date string so byRecent() works
  const releaseDate = raw.release_date || (releaseYear ? String(releaseYear) + '-01-01' : '');

  // Backend: rating (not vote_average)
  const rating      = Number(raw.rating ?? raw.vote_average ?? 0);

  // Resolve poster — primary field is poster_url
  const poster      = resolveApiImage(raw.poster_url || raw.poster_path ||
                        (images[0] && images[0].image_url) || '');
  // Backdrop: try images[1] first, fall back to images[0]/poster
  const backdrop    = resolveApiImage(
                        (images[1] && images[1].image_url) ||
                        (images[0] && images[0].image_url) ||
                        raw.poster_url || '') || poster;

  return {
    id:           raw.id,
    title:        raw.title || raw.name || 'Untitled',
    overview:     raw.description || raw.overview || '',
    description:  raw.description || raw.overview || '',
    release_date: releaseDate,
    release_year: releaseYear,
    runtime:      raw.duration || raw.runtime || null,
    language:     raw.language || '',
    vote_average: rating,
    rating,
    // Use rating as popularity proxy since backend has no popularity field
    popularity:   Number(raw.popularity ?? rating),
    poster_path:  poster,
    poster_url:   poster,
    backdrop_path: backdrop,
    backdrop_url:  backdrop,
    trailer_url:  raw.trailer_url || '',
    genre_ids:    genreId != null ? [genreId] : [],
    genres:       [{ id: genreId, name: genreName }],
    images,
    raw,
  };
}

function normalizeMovieList(data) {
  const list = Array.isArray(data) ? data
             : (data && Array.isArray(data.results)) ? data.results
             : (data && Array.isArray(data.items))   ? data.items
             : [];
  return list.map(normalizeMovie).filter(Boolean);
}

/* ============================================================
   DATA FETCHING  — fetch once, cache, never duplicate requests
============================================================ */
async function fetchAllData() {
  // Fetch genres and movies in parallel
  const [genresRaw, moviesRaw, homeRaw] = await Promise.allSettled([
    apiGet('/genres/'),
    apiGet('/movies/', { page: 1, limit: CINEVERSE_API_LIMIT }),
    apiGet('/movies/home/'),
  ]);

  /* ── Genres ── */
  if (genresRaw.status === 'fulfilled' && Array.isArray(genresRaw.value)) {
    cachedGenres = genresRaw.value.filter(g => g?.id != null && g?.name);
    genreMap = {};
    cachedGenres.forEach(g => {
      genreMap[g.id] = g.name;
      if (typeof TMDB !== 'undefined' && TMDB?.GENRES) TMDB.GENRES[g.id] = g.name;
    });
  } else {
    console.warn('GET /genres/ failed:', genresRaw.reason?.message);
  }

  /* ── Movies (full list) ── */
  if (moviesRaw.status === 'fulfilled') {
    homeMovies = normalizeMovieList(moviesRaw.value);
  } else {
    console.warn('GET /movies/ failed:', moviesRaw.reason?.message);
    homeMovies = [];
  }

  /* ── Home structured data ── */
  if (homeRaw.status === 'fulfilled' && homeRaw.value && typeof homeRaw.value === 'object') {
    const h = homeRaw.value;
    homeData = {
      top_rated:       normalizeMovieList(h.top_rated       || []),
      latest:          normalizeMovieList(h.latest          || []),
      recently_added:  normalizeMovieList(h.recently_added  || []),
    };
  } else {
    console.warn('GET /movies/home/ failed:', homeRaw.reason?.message);
    homeData = null;
  }
}

async function searchBackendMovies(query) {
  const data = await apiGet('/movies/search/', { q: query, page: 1, limit: 12 });
  return normalizeMovieList(data);
}

/* ============================================================
   SORT HELPERS  (client-side, on cached data)
============================================================ */
function byRating(list)      { return [...list].sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0)); }
function byRecent(list)      { return [...list].sort((a, b) => String(b.release_date || '').localeCompare(String(a.release_date || ''))); }
function byPopularity(list)  { return [...list].sort((a, b) => (b.popularity || b.vote_average || 0) - (a.popularity || a.vote_average || 0)); }

/* ============================================================
   UTILITY
============================================================ */
function yearFromStr(v) {
  const m = String(v || '').match(/\d{4}/);
  return m ? Number(m[0]) : null;
}

function genreLabel(movie) {
  return movie?.genres?.[0]?.name || genreMap[movie?.genre_ids?.[0]] || 'Film';
}

function setTrackEmpty(track, msg = 'No movies available yet.') {
  if (track) track.innerHTML = `<p class="load-error" style="padding:20px;color:var(--white-30);font-size:0.9rem">${msg}</p>`;
}

function escHtml(v) {
  return String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
}
function escAttr(v) { return escHtml(v); }

/* ============================================================
   HERO
   Uses top-rated movies from /movies/home/ if available,
   otherwise falls back to byPopularity(homeMovies).
============================================================ */
function initHero() {
  heroMovies = (homeData?.top_rated?.length ? homeData.top_rated : byPopularity(homeMovies)).slice(0, 8);
  if (!heroMovies.length) return;

  window.__heroEnhancedOwned = true;

  const backdrop   = document.querySelector('.hero-backdrop');
  const thumbsWrap = document.querySelector('.hero-thumbs');
  const indicators = document.querySelector('.hero-indicators');
  const counter    = document.querySelector('.hsc-current');
  const totalEl    = document.querySelector('.hsc-total');

  if (!backdrop) return;

  backdrop.innerHTML = heroMovies.map((movie, i) => `
    <div class="hero-slide${i === 0 ? ' active' : ''}" data-backend="1">
      <img src="${escAttr(getBackdrop(movie))}"
           alt="${escAttr(movie.title)} backdrop"
           loading="${i === 0 ? 'eager' : 'lazy'}"
           onerror="this.src='${CV_PLACEHOLDER}'">
    </div>
  `).join('');

  if (thumbsWrap) {
    thumbsWrap.innerHTML = heroMovies.map((movie, i) => `
      <div class="hero-thumb${i === 0 ? ' active' : ''}" data-index="${i}"
           role="button" tabindex="0" aria-label="View ${escAttr(movie.title)}">
        <img src="${escAttr(getPoster(movie))}"
             alt="${escAttr(movie.title)}"
             loading="lazy"
             onerror="this.src='${CV_PLACEHOLDER}'">
      </div>
    `).join('');

    thumbsWrap.querySelectorAll('.hero-thumb').forEach(thumb => {
      thumb.addEventListener('click', () => goToHeroSlide(Number(thumb.dataset.index)));
      thumb.addEventListener('keydown', e => { if (e.key === 'Enter') goToHeroSlide(Number(thumb.dataset.index)); });
    });
  }

  if (indicators) {
    indicators.innerHTML = heroMovies.map((_, i) => `
      <div class="hero-dot${i === 0 ? ' active' : ''}" data-index="${i}"
           role="tab" tabindex="0" aria-label="Slide ${i + 1}"></div>
    `).join('');

    indicators.querySelectorAll('.hero-dot').forEach(dot => {
      dot.addEventListener('click', () => goToHeroSlide(Number(dot.dataset.index)));
      dot.addEventListener('keydown', e => { if (e.key === 'Enter') goToHeroSlide(Number(dot.dataset.index)); });
    });
  }

  if (totalEl) totalEl.textContent = String(heroMovies.length).padStart(2, '0');
  if (counter)  counter.textContent = '01';

  renderHeroContent(heroMovies[0]);
  startHeroAutoplay();

  const hero = document.getElementById('hero');
  if (hero) {
    hero.addEventListener('mouseenter', () => clearInterval(heroTimer));
    hero.addEventListener('mouseleave', startHeroAutoplay);
  }
}

function renderHeroContent(movie) {
  const titleEl  = document.querySelector('.hero-title');
  const descEl   = document.querySelector('.hero-desc');
  const ratingEl = document.querySelector('.hero-rating-score');
  const yearEl   = document.querySelector('.hero-year');
  const genreEl  = document.querySelector('.hero-genres');
  const playBtn  = document.querySelector('.hero-play-btn');
  const moreBtn  = document.querySelector('.hero-more-btn');

  // Split title: last word gets gold accent
  const words = String(movie.title || '').split(' ');
  const last  = words.pop() || '';
  if (titleEl) titleEl.innerHTML = `${escHtml(words.join(' '))}${words.length ? ' ' : ''}<span class="title-accent">${escHtml(last)}</span>`;

  // Backend field: description (not overview)
  if (descEl)   descEl.textContent   = (movie.description || movie.overview || '').slice(0, 190);
  // Backend field: rating (not vote_average) — but normalizeMovie maps both to vote_average
  if (ratingEl) ratingEl.textContent = fmtRating(movie.vote_average);
  // Backend field: release_year (int) — fmtYear handles the constructed release_date string
  if (yearEl)   yearEl.textContent   = movie.release_year || fmtYear(movie.release_date) || '—';
  if (genreEl)  genreEl.innerHTML    = `<span class="hero-genre-tag">${escHtml(genreLabel(movie))}</span>`;
  if (playBtn)  playBtn.dataset.id   = movie.id;
  if (moreBtn)  moreBtn.href         = `movie-details.html?id=${movie.id}`;
}

function goToHeroSlide(index) {
  if (!heroMovies.length) return;
  const next = ((index % heroMovies.length) + heroMovies.length) % heroMovies.length;

  document.querySelectorAll('.hero-slide').forEach((s, i) => s.classList.toggle('active', i === next));
  document.querySelectorAll('.hero-thumb').forEach((t, i) => t.classList.toggle('active', i === next));
  document.querySelectorAll('.hero-dot').forEach((d, i)   => d.classList.toggle('active', i === next));

  heroIndex = next;
  const counter = document.querySelector('.hsc-current');
  if (counter) counter.textContent = String(next + 1).padStart(2, '0');
  renderHeroContent(heroMovies[next]);
  resetHeroAutoplay();
}

function startHeroAutoplay() {
  clearInterval(heroTimer);
  if (heroMovies.length < 2) return;
  heroTimer = setInterval(() => goToHeroSlide(heroIndex + 1), 7000);
}

function resetHeroAutoplay() { startHeroAutoplay(); }

/* ============================================================
   FEATURED SPOTLIGHT
   Uses byPopularity from homeMovies (top 5)
============================================================ */
function loadFeaturedSection() {
  const mainArea    = document.querySelector('.featured-main');
  const sidebarArea = document.querySelector('.featured-sidebar');
  if (!mainArea || !sidebarArea) return;

  const movies = byPopularity(homeMovies).slice(0, 5);
  if (!movies.length) {
    mainArea.innerHTML = '<div class="skeleton" style="width:100%;height:100%"></div>';
    sidebarArea.innerHTML = '';
    return;
  }

  sidebarArea.innerHTML = movies.map((movie, i) => buildFeaturedSidebarCard(movie, i + 1)).join('');
  showFeaturedMain(movies[0]);
  sidebarArea.querySelector('.featured-sidebar-card')?.classList.add('active');

  sidebarArea.addEventListener('click', e => {
    const card = e.target.closest('.featured-sidebar-card');
    if (!card) return;
    sidebarArea.querySelectorAll('.featured-sidebar-card').forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    showFeaturedMain(movies[Number(card.dataset.rank) - 1]);
  });

  lazyLoadImages();
}

function showFeaturedMain(movie) {
  const mainArea = document.querySelector('.featured-main');
  if (!mainArea || !movie) return;

  mainArea.innerHTML = `
    <img src="${escAttr(getBackdrop(movie))}" alt="${escAttr(movie.title)}" loading="eager"
         onerror="this.src='${CV_PLACEHOLDER}'">
    <div class="featured-main-overlay"></div>
    <div class="featured-main-content">
      <span class="featured-main-tag">Featured</span>
      <h2 class="featured-main-title">${escHtml(movie.title)}</h2>
      <p class="featured-main-desc">${escHtml((movie.description || movie.overview || '').slice(0, 150))}</p>
      <div style="display:flex;gap:12px;margin-top:16px">
        <a href="movie-details.html?id=${movie.id}" class="btn-primary" style="font-size:0.875rem;padding:10px 24px">
          ${Icons.play} Watch Now
        </a>
        <button class="btn-ghost" style="font-size:0.875rem;padding:10px 24px" data-featured-wl="${movie.id}">
          ${Icons.plus} Watchlist
        </button>
      </div>
    </div>
    <div class="featured-play-btn">${Icons.play}</div>`;

  mainArea.href = `movie-details.html?id=${movie.id}`;
  mainArea.querySelector('[data-featured-wl]')?.addEventListener('click', e => {
    e.preventDefault();
    Watchlist.add(movie);
  });
  if (typeof initMagnetic === 'function') initMagnetic();
}

/* ============================================================
   TRENDING THIS WEEK
   Uses byPopularity from homeMovies (top 10)
============================================================ */
function loadTrendingSection() {
  const target = document.getElementById('trending-track');
  if (!target) return;

  const movies = byPopularity(homeMovies).slice(0, 10);
  if (!movies.length) { setTrackEmpty(target); return; }

  target.innerHTML = movies.map((movie, i) => buildTrendingCard(movie, i)).join('');
  bindTrendingEvents(target, movies);
  updateTrendingDetail(movies[0], 0);
}

function buildTrendingCard(movie, index) {
  return `
    <div class="trending-card${index === 0 ? ' active-card' : ''}" role="listitem" tabindex="0"
         data-index="${index}" aria-label="${escAttr(movie.title)}">
      <div class="trending-card-poster">
        <img src="${escAttr(getPoster(movie))}"
             alt="${escAttr(movie.title)} poster"
             loading="${index < 4 ? 'eager' : 'lazy'}"
             onerror="this.src='${CV_PLACEHOLDER}'">
        <div class="trending-card-rank">${String(index + 1).padStart(2, '0')}</div>
        <div class="trending-card-rating">${Icons.star}${fmtRating(movie.vote_average)}</div>
        <div class="trending-card-overlay">
          <button class="trending-card-play" aria-label="Watch ${escAttr(movie.title)}">${Icons.play}</button>
        </div>
      </div>
      <div class="trending-card-info">
        <h3 class="trending-card-title">${escHtml(movie.title)}</h3>
        <p class="trending-card-meta">${movie.release_year || fmtYear(movie.release_date) || '—'} · ${escHtml(genreLabel(movie))}</p>
      </div>
    </div>`;
}

function bindTrendingEvents(track, movies) {
  let activeIndex = 0;
  const prevBtn = document.querySelector('.trending-btn-prev');
  const nextBtn = document.querySelector('.trending-btn-next');

  function select(index) {
    activeIndex = Math.max(0, Math.min(movies.length - 1, index));
    track.querySelectorAll('.trending-card').forEach((c, i) => c.classList.toggle('active-card', i === activeIndex));
    updateTrendingDetail(movies[activeIndex], activeIndex);
    track.querySelectorAll('.trending-card')[activeIndex]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }

  track.querySelectorAll('.trending-card').forEach(card => {
    card.addEventListener('click', e => {
      if (e.target.closest('.trending-card-play')) {
        window.location.href = `movie-details.html?id=${movies[Number(card.dataset.index)].id}`;
        return;
      }
      select(Number(card.dataset.index));
    });
    card.addEventListener('keydown', e => { if (e.key === 'Enter') select(Number(card.dataset.index)); });
  });

  prevBtn?.addEventListener('click', () => select(activeIndex - 1));
  nextBtn?.addEventListener('click', () => select(activeIndex + 1));
  if (typeof initCarouselDrag === 'function') initCarouselDrag(track);
}

function updateTrendingDetail(movie, index) {
  const detail = document.getElementById('trending-detail');
  if (!detail || !movie) return;

  detail.classList.add('panel-transitioning');
  setTimeout(() => {
    detail.querySelector('.tdp-eyebrow').textContent  = `Trending #${index + 1}`;
    detail.querySelector('.tdp-title').textContent    = movie.title;
    detail.querySelector('.tdp-rating-val').textContent = fmtRating(movie.vote_average);
    // release_year is the backend field; use it directly
    detail.querySelector('.tdp-year').textContent     = movie.release_year || fmtYear(movie.release_date) || '—';
    detail.querySelector('.tdp-genre').textContent    = genreLabel(movie);
    detail.querySelector('.tdp-desc').textContent     = movie.description || movie.overview || '';
    const watchBtn = detail.querySelector('.tdp-watch-btn');
    const wlBtn    = detail.querySelector('.tdp-wl-btn');
    if (watchBtn) watchBtn.href    = `movie-details.html?id=${movie.id}`;
    if (wlBtn)    wlBtn.onclick    = () => Watchlist.add(movie);
    detail.classList.remove('panel-transitioning');
  }, 160);
}

/* ============================================================
   TOP RATED ALL TIME
   Uses homeData.top_rated from GET /movies/home/ (sorted by backend),
   falls back to byRating(homeMovies)
============================================================ */
function loadTopRatedSection() {
  const movies = (homeData?.top_rated?.length ? homeData.top_rated : byRating(homeMovies)).slice(0, 16);
  fillMovieTrack('toprated-track', movies, 'featured');
}

/* ============================================================
   RECENTLY ADDED  — uses homeData.recently_added from GET /movies/home/
   Falls back to byRecent(homeMovies)
============================================================ */
function loadNowPlayingSection() {
  const movies = (homeData?.recently_added?.length ? homeData.recently_added : byRecent(homeMovies)).slice(0, 14);
  fillMovieTrack('nowplaying-track', movies);
}

/* ============================================================
   LATEST RELEASES  — uses homeData.latest from GET /movies/home/
   Falls back to byRecent(homeMovies)
============================================================ */
function loadUpcomingSection() {
  const movies = (homeData?.latest?.length ? homeData.latest : byRecent(homeMovies)).slice(0, 14);
  fillMovieTrack('upcoming-track', movies, 'wide');
}

/* ============================================================
   RECOMMENDED FOR YOU
   Uses mid-tier by rating (not shown in top-rated already)
============================================================ */
function loadRecommended() {
  const track  = document.getElementById('recommended-track');
  if (!track) return;

  // Use all movies sorted by rating, offset by 5 to avoid top-rated duplication
  const movies = byRating(homeMovies).slice(5, 20);
  if (!movies.length) { setTrackEmpty(track); return; }

  track.innerHTML = movies.map(movie => {
    // Match score: scale 0–10 rating to 60–100%
    const score = Math.max(60, Math.min(100, Math.round((movie.vote_average || 7) * 10)));
    return buildMovieCard(movie).replace('</div>\n  </article>',
      `<span class="rec-score" style="margin:4px 4px 0;font-size:10px">${score}% Match</span>
      </div>\n  </article>`);
  }).join('');

  bindCardEvents(track);
  initCarouselArrows(track.closest('.carousel-wrap'));
  lazyLoadImages();
}

/* ============================================================
   CONTINUE WATCHING
============================================================ */
function loadContinueWatching() {
  const track = document.getElementById('cw-track');
  if (!track) return;

  let history = (typeof WatchHistory !== 'undefined') ? WatchHistory.get() : [];
  if (!history.length) {
    history = byPopularity(homeMovies).slice(0, 6).map(m => ({ ...m, progress: 0.15 + Math.random() * 0.65 }));
  }
  if (!history.length) { document.getElementById('section-cw')?.remove(); return; }

  track.innerHTML = history.slice(0, 10).map(buildCWCard).join('');
  bindCardEvents(track);
  initCarouselArrows(track.closest('.carousel-wrap'));
  lazyLoadImages();
}

/* ============================================================
   GENERIC TRACK FILLER
============================================================ */
function fillMovieTrack(id, movies, variant = '') {
  const track = document.getElementById(id);
  if (!track) return;
  if (!movies.length) { setTrackEmpty(track); return; }
  track.innerHTML = movies.map(m => buildMovieCard(m, variant)).join('');
  bindCardEvents(track);
  initCarouselArrows(track.closest('.carousel-wrap'));
  lazyLoadImages();
}

/* ============================================================
   GENRE COLLECTIONS
   Fetched from GET /genres/ — names always come from backend.
   Decorative background images are local assets keyed by genre name.
   If a new genre is added to the backend it appears automatically.
============================================================ */
const GENRE_BG_MAP = {
  'action':           'assets/images/genres/action.jpg',
  'adventure':        'assets/images/genres/adventure.jpg',
  'animation':        'assets/images/genres/animation.jpg',
  'comedy':           'assets/images/genres/comedy.jpg',
  'crime':            'assets/images/genres/crime.jpg',
  'documentary':      'assets/images/genres/documentary.jpg',
  'drama':            'assets/images/genres/drama.jpg',
  'family':           'assets/images/genres/family.jpg',
  'fantasy':          'assets/images/genres/fantasy.jpg',
  'history':          'assets/images/genres/history.jpg',
  'horror':           'assets/images/genres/horror.jpg',
  'music':            'assets/images/genres/music.jpg',
  'mystery':          'assets/images/genres/mystery.jpg',
  'romance':          'assets/images/genres/romance.jpg',
  'sci-fi':           'assets/images/genres/scifi.jpg',
  'science fiction':  'assets/images/genres/scifi.jpg',
  'thriller':         'assets/images/genres/thriller.jpg',
  'war':              'assets/images/genres/war.jpg',
  'western':          'assets/images/genres/western.jpg',
};
const GENRE_BG_FALLBACK = 'assets/images/genres/default.jpg';

function genreDataAttr(name) {
  const n = String(name || '').toLowerCase().trim();
  if (n.includes('action'))    return 'action';
  if (n.includes('drama'))     return 'drama';
  if (n.includes('comedy'))    return 'comedy';
  if (n.includes('thriller'))  return 'thriller';
  if (n.includes('sci'))       return 'sci-fi';
  if (n.includes('horror'))    return 'horror';
  if (n.includes('romance'))   return 'romance';
  if (n.includes('animation')) return 'animation';
  return '';
}

function loadGenreGrid() {
  const grid = document.getElementById('genre-grid');
  if (!grid) return;

  // All genre names come from backend GET /genres/ — never hardcoded
  const genres = cachedGenres.slice(0, 10);
  if (!genres.length) {
    grid.innerHTML = '<p class="load-error" style="padding:20px;color:var(--white-30)">No genres available.</p>';
    return;
  }

  grid.innerHTML = genres.map(genre => {
    const nameLower = genre.name.toLowerCase().trim();
    const bg        = GENRE_BG_MAP[nameLower] || GENRE_BG_FALLBACK;
    const accent    = genreDataAttr(genre.name);
    // Count movies that belong to this genre (matched by id or name)
    const count     = homeMovies.filter(m =>
      (m.genres[0]?.id != null && m.genres[0].id === genre.id) ||
      (m.genres[0]?.name || '').toLowerCase() === nameLower
    ).length;

    return `<a href="movie_page.html?genre=${genre.id}"
               class="genre-card"
               role="listitem"
               ${accent ? `data-genre="${accent}"` : ''}
               aria-label="Browse ${escHtml(genre.name)} movies">
      <img src="${escAttr(bg)}"
           alt="${escHtml(genre.name)} genre background"
           loading="lazy"
           onerror="this.style.display='none'">
      <div class="genre-card-overlay"></div>
      <div class="genre-card-content">
        <h3 class="genre-card-name">${escHtml(genre.name)}</h3>
        ${count > 0 ? `<p class="genre-card-count">${count} title${count !== 1 ? 's' : ''}</p>` : ''}
      </div>
    </a>`;
  }).join('');
}

/* ============================================================
   SEARCH  — uses GET /movies/search/?q=
============================================================ */
function initSearch() {
  const input     = document.getElementById('search-overlay-input');
  const resultsEl = document.getElementById('search-live-results');
  if (!input || !resultsEl) return;

  let searchTimer;
  input.addEventListener('input', () => {
    clearTimeout(searchTimer);
    const q = input.value.trim();
    if (!q) { resultsEl.innerHTML = ''; return; }

    searchTimer = setTimeout(async () => {
      let results = [];
      try {
        results = await searchBackendMovies(q);
      } catch (err) {
        console.warn('Search endpoint failed:', err.message);
      }

      // Client-side fallback from cached movies
      if (!results.length) {
        const qLow = q.toLowerCase();
        results = homeMovies.filter(m =>
          m.title.toLowerCase().includes(qLow) ||
          (m.description || m.overview || '').toLowerCase().includes(qLow) ||
          genreLabel(m).toLowerCase().includes(qLow)
        ).slice(0, 6);
      }

      resultsEl.innerHTML = results.slice(0, 6).map(movie => `
        <a href="movie-details.html?id=${movie.id}" class="search-result-item" style="
          display:flex;align-items:center;gap:12px;padding:10px 12px;
          border-radius:10px;cursor:pointer;transition:background 0.2s;"
          onmouseover="this.style.background='rgba(255,255,255,0.05)'"
          onmouseout="this.style.background=''">
          <img src="${escAttr(getPoster(movie))}"
               alt="${escAttr(movie.title)}"
               width="32" height="48"
               style="width:32px;height:48px;object-fit:cover;border-radius:4px;flex-shrink:0"
               onerror="this.src='${CV_PLACEHOLDER}'">
          <div>
            <div style="font-size:0.9rem;font-weight:600;color:#fff">${escHtml(movie.title)}</div>
            <div style="font-size:0.75rem;color:rgba(255,255,255,0.4)">
              ${movie.release_year || fmtYear(movie.release_date) || '—'} · ${fmtRating(movie.vote_average)} ★
            </div>
          </div>
        </a>
      `).join('');
    }, 350);
  });
}

/* ============================================================
   STATS BANNER
============================================================ */
function initStatsBanner() {
  const banner = document.getElementById('stats-banner');
  if (!banner) return;

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      if (typeof $$ === 'function') {
        $$('.count-up', banner).forEach(el => countUp(el, parseInt(el.dataset.target, 10)));
      } else {
        banner.querySelectorAll('.count-up').forEach(el => {
          if (typeof countUp === 'function') countUp(el, parseInt(el.dataset.target, 10));
        });
      }
      io.unobserve(entry.target);
    });
  }, { threshold: 0.5 });
  io.observe(banner);
}

/* ============================================================
   INIT  — single entry point
============================================================ */
async function init() {
  if (typeof hideLoadingScreen === 'function') hideLoadingScreen();
  if (typeof initNavbar        === 'function') initNavbar();
  if (typeof initHeroParallax  === 'function') initHeroParallax();
  if (typeof initReveal        === 'function') initReveal();
  initSearch();

  try {
    // Single round-trip: fetch genres + movies + home data in parallel
    await fetchAllData();
  } catch (err) {
    console.error('Data fetch failed:', err);
    homeMovies = [];
    homeData   = null;
    cachedGenres = [];
  }

  initHero();
  loadFeaturedSection();
  loadTrendingSection();
  loadTopRatedSection();
  loadNowPlayingSection();
  loadUpcomingSection();
  loadContinueWatching();
  loadRecommended();
  loadGenreGrid();
  initStatsBanner();
  if (typeof initMagnetic      === 'function') initMagnetic();
  if (typeof lazyLoadImages    === 'function') lazyLoadImages();
}

document.addEventListener('DOMContentLoaded', init);