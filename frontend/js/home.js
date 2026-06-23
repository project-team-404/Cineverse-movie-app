/* ============================================================
   CINEVERSE - HOME PAGE CONTROLLER
   Backend data version, existing UI preserved.
   ============================================================ */

const CINEVERSE_API_BASE =
  window.CINEVERSE_API_BASE ||
  localStorage.getItem('cineverse_api_base') ||
  'https://movie-app-qhzc.onrender.com';

const CINEVERSE_API_LIMIT = 200;
const CV_PLACEHOLDER = 'assets/images/placeholder.jpg';
const CV_BACKDROP_FALLBACK = FALLBACK_BACKDROPS?.[0] || CV_PLACEHOLDER;

let homeMovies = [];
let heroMovies = [];
let heroIndex = 0;
let heroTimer = null;

const BACKEND_GENRES = {
  28: 'Action', 12: 'Adventure', 16: 'Animation', 35: 'Comedy', 80: 'Crime',
  99: 'Documentary', 18: 'Drama', 10751: 'Family', 14: 'Fantasy', 36: 'History',
  27: 'Horror', 10402: 'Music', 9648: 'Mystery', 10749: 'Romance', 878: 'Sci-Fi',
  10770: 'TV Movie', 53: 'Thriller', 10752: 'War', 37: 'Western'
};

/* Let existing component builders accept backend/full image URLs. */
if (window.TMDB) {
  const originalPosterURL = TMDB.posterURL.bind(TMDB);
  const originalBackdropURL = TMDB.backdropURL.bind(TMDB);

  TMDB.posterURL = function(path, size) {
    return resolveApiImage(path) || originalPosterURL(path, size);
  };

  TMDB.backdropURL = function(path, size) {
    return resolveApiImage(path) || originalBackdropURL(path, size);
  };
}

async function apiGet(path, params = {}) {
  const url = new URL(path, normalizeBaseUrl(CINEVERSE_API_BASE));

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'all') {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.json();
}

async function fetchBackendMovies(params = {}) {
  const data = await apiGet('/movies/', { page: 1, limit: CINEVERSE_API_LIMIT, ...params });
  return normalizeMovieList(data);
}

async function searchBackendMovies(query) {
  const data = await apiGet('/movies/search/', { q: query, page: 1, limit: 12 });
  return normalizeMovieList(data);
}

async function loadBackendGenres() {
  try {
    const genres = await apiGet('/genres/');
    if (!Array.isArray(genres)) return;

    genres.forEach(genre => {
      if (genre?.id && genre?.name) {
        BACKEND_GENRES[genre.id] = genre.name;
        if (TMDB?.GENRES) TMDB.GENRES[genre.id] = genre.name;
      }
    });
  } catch (error) {
    console.warn('Genres endpoint unavailable:', error.message);
  }
}

function normalizeBaseUrl(value) {
  const base = String(value || '').trim();
  return base.endsWith('/') ? base : `${base}/`;
}

function normalizeMovieList(data) {
  const list = Array.isArray(data) ? data : data?.results || data?.items || [];
  return list.map(normalizeMovie).filter(movie => movie.id !== undefined && movie.id !== null);
}

function normalizeMovie(movie) {
  const images = Array.isArray(movie.images) ? movie.images : [];
  const genre = normalizeGenre(movie.genre, movie.genre_id, movie.genre_name);
  const releaseYear = movie.release_year || yearFromDate(movie.release_date);
  const releaseDate = movie.release_date || (releaseYear ? `${releaseYear}-01-01` : '');
  const rating = Number(movie.rating ?? movie.vote_average ?? 0);
  const poster = resolveApiImage(movie.poster_url || movie.poster_path || movie.image_url || images[0]?.image_url || images[0]?.url || '');
  const backdrop = resolveApiImage(movie.backdrop_url || movie.backdrop_path || images[1]?.image_url || poster);

  return {
    id: movie.id,
    title: movie.title || movie.name || 'Untitled',
    overview: movie.description || movie.overview || '',
    description: movie.description || movie.overview || '',
    release_date: releaseDate,
    release_year: releaseYear,
    runtime: movie.duration || movie.runtime,
    language: movie.language || '',
    vote_average: rating,
    rating,
    popularity: Number(movie.popularity ?? rating ?? 0),
    poster_path: poster,
    backdrop_path: backdrop,
    poster_url: poster,
    backdrop_url: backdrop,
    trailer_url: movie.trailer_url || '',
    genre_ids: genre.id ? [genre.id] : [],
    genres: [genre],
    images,
    raw: movie,
  };
}

function normalizeGenre(genre, genreId, genreName) {
  if (genre && typeof genre === 'object') {
    return { id: genre.id ?? genreId ?? null, name: genre.name || BACKEND_GENRES[genre.id] || 'Film' };
  }

  if (typeof genre === 'string' && genre.trim()) {
    return { id: genreId ?? genreIdFromName(genre), name: genre.trim() };
  }

  if (genreId && BACKEND_GENRES[genreId]) return { id: genreId, name: BACKEND_GENRES[genreId] };
  if (genreName) return { id: genreId ?? genreIdFromName(genreName), name: genreName };
  return { id: null, name: 'Film' };
}

function genreIdFromName(name) {
  const wanted = String(name || '').toLowerCase();
  const hit = Object.entries(BACKEND_GENRES).find(([, value]) => value.toLowerCase() === wanted);
  return hit ? Number(hit[0]) : null;
}

function genreLabel(movie) {
  return movie?.genres?.[0]?.name || BACKEND_GENRES[movie?.genre_ids?.[0]] || 'Film';
}

function yearFromDate(value) {
  const match = String(value || '').match(/\d{4}/);
  return match ? Number(match[0]) : null;
}

function resolveApiImage(value) {
  const raw = String(value || '').trim();
  if (!raw || raw === 'null' || raw === 'undefined') return '';
  if (/^https?:\/\//i.test(raw) || raw.startsWith('data:') || raw.startsWith('blob:')) return raw;
  if (raw.startsWith('//')) return `${location.protocol}${raw}`;
  if (raw.startsWith('/')) return new URL(raw, normalizeBaseUrl(CINEVERSE_API_BASE)).toString();
  return raw;
}

function getPoster(movie) {
  return resolveApiImage(movie?.poster_path || movie?.poster_url || movie?.images?.[0]?.image_url) || CV_PLACEHOLDER;
}

function getBackdrop(movie) {
  return resolveApiImage(movie?.backdrop_path || movie?.backdrop_url || movie?.images?.[1]?.image_url || getPoster(movie)) || CV_BACKDROP_FALLBACK;
}

function byRating(list) {
  return [...list].sort((a, b) => (b.vote_average || 0) - (a.vote_average || 0));
}

function byRecent(list) {
  return [...list].sort((a, b) => String(b.release_date || '').localeCompare(String(a.release_date || '')));
}

function byPopularity(list) {
  return [...list].sort((a, b) => (b.popularity || b.vote_average || 0) - (a.popularity || a.vote_average || 0));
}

function setTrackEmpty(track, message = 'No movies available from the backend yet.') {
  if (track) track.innerHTML = `<p class="load-error">${message}</p>`;
}

/* ============================================================
   HERO
============================================================ */
function initHero() {
  heroMovies = byPopularity(homeMovies).slice(0, 8);
  if (!heroMovies.length) return;

  window.__heroEnhancedOwned = true;

  const backdrop = document.querySelector('.hero-backdrop');
  const thumbsWrap = document.querySelector('.hero-thumbs');
  const indicators = document.querySelector('.hero-indicators');
  const counter = document.querySelector('.hsc-current');
  const totalEl = document.querySelector('.hsc-total');

  if (!backdrop) return;

  backdrop.innerHTML = heroMovies.map((movie, index) => `
    <div class="hero-slide${index === 0 ? ' active' : ''}" data-backend="1">
      <img src="${escAttr(getBackdrop(movie))}" alt="${escAttr(movie.title)} backdrop" loading="${index === 0 ? 'eager' : 'lazy'}">
    </div>
  `).join('');

  if (thumbsWrap) {
    thumbsWrap.innerHTML = heroMovies.map((movie, index) => `
      <div class="hero-thumb${index === 0 ? ' active' : ''}" data-index="${index}" role="button" tabindex="0" aria-label="View ${escAttr(movie.title)}">
        <img src="${escAttr(getPoster(movie))}" alt="${escAttr(movie.title)}" loading="lazy">
      </div>
    `).join('');

    thumbsWrap.querySelectorAll('.hero-thumb').forEach(thumb => {
      thumb.addEventListener('click', () => goToHeroSlide(Number(thumb.dataset.index)));
      thumb.addEventListener('keydown', event => {
        if (event.key === 'Enter') goToHeroSlide(Number(thumb.dataset.index));
      });
    });
  }

  if (indicators) {
    indicators.innerHTML = heroMovies.map((_, index) => `
      <div class="hero-dot${index === 0 ? ' active' : ''}" data-index="${index}" role="tab" tabindex="0" aria-label="Slide ${index + 1}"></div>
    `).join('');

    indicators.querySelectorAll('.hero-dot').forEach(dot => {
      dot.addEventListener('click', () => goToHeroSlide(Number(dot.dataset.index)));
      dot.addEventListener('keydown', event => {
        if (event.key === 'Enter') goToHeroSlide(Number(dot.dataset.index));
      });
    });
  }

  if (totalEl) totalEl.textContent = String(heroMovies.length).padStart(2, '0');
  if (counter) counter.textContent = '01';

  renderHeroContent(heroMovies[0]);
  startHeroAutoplay();

  const hero = document.getElementById('hero');
  if (hero) {
    hero.addEventListener('mouseenter', () => clearInterval(heroTimer));
    hero.addEventListener('mouseleave', startHeroAutoplay);
  }
}

function renderHeroContent(movie) {
  const title = document.querySelector('.hero-title');
  const desc = document.querySelector('.hero-desc');
  const rating = document.querySelector('.hero-rating-score');
  const year = document.querySelector('.hero-year');
  const genres = document.querySelector('.hero-genres');
  const playBtn = document.querySelector('.hero-play-btn');
  const moreBtn = document.querySelector('.hero-more-btn');

  const words = String(movie.title || '').split(' ');
  const last = words.pop() || '';

  if (title) title.innerHTML = `${escHtml(words.join(' '))}${words.length ? ' ' : ''}<span class="title-accent">${escHtml(last)}</span>`;
  if (desc) desc.textContent = (movie.overview || '').slice(0, 190);
  if (rating) rating.textContent = fmtRating(movie.vote_average);
  if (year) year.textContent = fmtYear(movie.release_date);
  if (genres) genres.innerHTML = `<span class="hero-genre-tag">${escHtml(genreLabel(movie))}</span>`;
  if (playBtn) playBtn.dataset.id = movie.id;
  if (moreBtn) moreBtn.href = `movie-details.html?id=${movie.id}`;
}

function goToHeroSlide(index) {
  if (!heroMovies.length) return;
  const next = ((index % heroMovies.length) + heroMovies.length) % heroMovies.length;

  document.querySelectorAll('.hero-slide').forEach((slide, i) => slide.classList.toggle('active', i === next));
  document.querySelectorAll('.hero-thumb').forEach((thumb, i) => thumb.classList.toggle('active', i === next));
  document.querySelectorAll('.hero-dot').forEach((dot, i) => dot.classList.toggle('active', i === next));

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

function resetHeroAutoplay() {
  startHeroAutoplay();
}

/* ============================================================
   HOME SECTIONS
============================================================ */
function loadFeaturedSection() {
  const mainArea = document.querySelector('.featured-main');
  const sidebarArea = document.querySelector('.featured-sidebar');
  if (!mainArea || !sidebarArea) return;

  const movies = byPopularity(homeMovies).slice(0, 5);
  if (!movies.length) {
    mainArea.innerHTML = '<div class="skeleton" style="width:100%;height:100%"></div>';
    sidebarArea.innerHTML = '';
    return;
  }

  sidebarArea.innerHTML = movies.map((movie, index) => buildFeaturedSidebarCard(movie, index + 1)).join('');
  showFeaturedMain(movies[0]);
  sidebarArea.querySelector('.featured-sidebar-card')?.classList.add('active');

  sidebarArea.addEventListener('click', event => {
    const card = event.target.closest('.featured-sidebar-card');
    if (!card) return;
    sidebarArea.querySelectorAll('.featured-sidebar-card').forEach(item => item.classList.remove('active'));
    card.classList.add('active');
    showFeaturedMain(movies[Number(card.dataset.rank) - 1]);
  });

  lazyLoadImages();
}

function showFeaturedMain(movie) {
  const mainArea = document.querySelector('.featured-main');
  if (!mainArea || !movie) return;

  mainArea.innerHTML = `
    <img src="${escAttr(getBackdrop(movie))}" alt="${escAttr(movie.title)}" loading="eager">
    <div class="featured-main-overlay"></div>
    <div class="featured-main-content">
      <span class="featured-main-tag">Featured</span>
      <h2 class="featured-main-title">${escHtml(movie.title)}</h2>
      <p class="featured-main-desc">${escHtml((movie.overview || '').slice(0, 150))}</p>
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
  mainArea.querySelector('[data-featured-wl]')?.addEventListener('click', event => {
    event.preventDefault();
    Watchlist.add(movie);
  });
  initMagnetic();
}

function loadTrendingSection() {
  const target = document.getElementById('trending-track');
  const movies = byPopularity(homeMovies).slice(0, 10);
  if (!target) return;
  if (!movies.length) {
    setTrackEmpty(target);
    return;
  }

  target.innerHTML = movies.map((movie, index) => buildTrendingCard(movie, index)).join('');
  bindTrendingEvents(target, movies);
  updateTrendingDetail(movies[0], 0);
}

function buildTrendingCard(movie, index) {
  return `
    <div class="trending-card${index === 0 ? ' active-card' : ''}" role="listitem" tabindex="0" data-index="${index}" aria-label="${escAttr(movie.title)}">
      <div class="trending-card-poster">
        <img src="${escAttr(getPoster(movie))}" alt="${escAttr(movie.title)} poster" loading="${index < 4 ? 'eager' : 'lazy'}">
        <div class="trending-card-rank">${String(index + 1).padStart(2, '0')}</div>
        <div class="trending-card-rating">${Icons.star}${fmtRating(movie.vote_average)}</div>
        <div class="trending-card-overlay">
          <button class="trending-card-play" aria-label="Watch ${escAttr(movie.title)}">${Icons.play}</button>
        </div>
      </div>
      <div class="trending-card-info">
        <h3 class="trending-card-title">${escHtml(movie.title)}</h3>
        <p class="trending-card-meta">${fmtYear(movie.release_date)} · ${escHtml(genreLabel(movie))}</p>
      </div>
    </div>`;
}

function bindTrendingEvents(track, movies) {
  let activeIndex = 0;
  const prevBtn = document.querySelector('.trending-btn-prev');
  const nextBtn = document.querySelector('.trending-btn-next');

  function select(index) {
    activeIndex = Math.max(0, Math.min(movies.length - 1, index));
    track.querySelectorAll('.trending-card').forEach((card, i) => card.classList.toggle('active-card', i === activeIndex));
    updateTrendingDetail(movies[activeIndex], activeIndex);
    track.querySelectorAll('.trending-card')[activeIndex]?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  }

  track.querySelectorAll('.trending-card').forEach(card => {
    card.addEventListener('click', event => {
      if (event.target.closest('.trending-card-play')) {
        window.location.href = `movie-details.html?id=${movies[Number(card.dataset.index)].id}`;
        return;
      }
      select(Number(card.dataset.index));
    });
    card.addEventListener('keydown', event => {
      if (event.key === 'Enter') select(Number(card.dataset.index));
    });
  });

  prevBtn?.addEventListener('click', () => select(activeIndex - 1));
  nextBtn?.addEventListener('click', () => select(activeIndex + 1));
  initCarouselDrag(track);
}

function updateTrendingDetail(movie, index) {
  const detail = document.getElementById('trending-detail');
  if (!detail || !movie) return;

  detail.classList.add('panel-transitioning');
  setTimeout(() => {
    detail.querySelector('.tdp-eyebrow').textContent = `Trending #${index + 1}`;
    detail.querySelector('.tdp-title').textContent = movie.title;
    detail.querySelector('.tdp-rating-val').textContent = fmtRating(movie.vote_average);
    detail.querySelector('.tdp-year').textContent = fmtYear(movie.release_date);
    detail.querySelector('.tdp-genre').textContent = genreLabel(movie);
    detail.querySelector('.tdp-desc').textContent = movie.overview || '';
    const watchBtn = detail.querySelector('.tdp-watch-btn');
    const wlBtn = detail.querySelector('.tdp-wl-btn');
    if (watchBtn) watchBtn.href = `movie-details.html?id=${movie.id}`;
    if (wlBtn) wlBtn.onclick = () => Watchlist.add(movie);
    detail.classList.remove('panel-transitioning');
  }, 160);
}

function loadTopRatedSection() {
  fillMovieTrack('toprated-track', byRating(homeMovies).slice(0, 16), 'featured');
}

function loadNowPlayingSection() {
  fillMovieTrack('nowplaying-track', byRecent(homeMovies).slice(0, 14));
}

function loadUpcomingSection() {
  fillMovieTrack('upcoming-track', byRecent(homeMovies).slice(0, 14), 'wide');
}

function loadRecommended() {
  const track = document.getElementById('recommended-track');
  const movies = byRating(homeMovies).slice(5, 20);
  if (!track) return;
  if (!movies.length) {
    setTrackEmpty(track);
    return;
  }

  track.innerHTML = movies.map((movie, index) => {
    const score = Math.max(72, Math.round((movie.vote_average || 7) * 10));
    return buildMovieCard(movie).replace('</div>\n  </article>',
      `<span class="rec-score" style="margin:4px 4px 0;font-size:10px">${score}% Match</span>
      </div>\n  </article>`);
  }).join('');

  bindCardEvents(track);
  initCarouselArrows(track.closest('.carousel-wrap'));
  lazyLoadImages();
}

function loadContinueWatching() {
  const track = document.getElementById('cw-track');
  if (!track) return;

  let history = WatchHistory.get();
  if (!history.length) {
    history = byPopularity(homeMovies).slice(0, 6).map(movie => ({ ...movie, progress: 0.15 + Math.random() * 0.65 }));
  }

  if (!history.length) {
    document.getElementById('section-cw')?.remove();
    return;
  }

  track.innerHTML = history.slice(0, 10).map(buildCWCard).join('');
  bindCardEvents(track);
  initCarouselArrows(track.closest('.carousel-wrap'));
  lazyLoadImages();
}

function fillMovieTrack(id, movies, variant = '') {
  const track = document.getElementById(id);
  if (!track) return;
  if (!movies.length) {
    setTrackEmpty(track);
    return;
  }

  track.innerHTML = movies.map(movie => buildMovieCard(movie, variant)).join('');
  bindCardEvents(track);
  initCarouselArrows(track.closest('.carousel-wrap'));
  lazyLoadImages();
}

function loadGenreGrid() {
  const grid = document.getElementById('genre-grid');
  if (!grid) return;
  const genreIds = [28, 35, 27, 878, 18, 53, 10749, 80, 12, 16];
  grid.innerHTML = genreIds.map(id => buildGenreCard(id)).join('');
}

/* ============================================================
   SEARCH
============================================================ */
function initSearch() {
  const input = document.getElementById('search-overlay-input');
  const resultsEl = document.getElementById('search-live-results');
  if (!input || !resultsEl) return;

  let searchTimer;
  input.addEventListener('input', () => {
    clearTimeout(searchTimer);
    const q = input.value.trim();
    if (!q) {
      resultsEl.innerHTML = '';
      return;
    }

    searchTimer = setTimeout(async () => {
      let results = [];
      try {
        results = await searchBackendMovies(q);
      } catch (error) {
        console.warn('Search endpoint failed:', error.message);
      }

      if (!results.length) {
        const qLower = q.toLowerCase();
        results = homeMovies.filter(movie =>
          movie.title.toLowerCase().includes(qLower) ||
          movie.overview.toLowerCase().includes(qLower) ||
          genreLabel(movie).toLowerCase().includes(qLower)
        ).slice(0, 6);
      }

      resultsEl.innerHTML = results.slice(0, 6).map(movie => `
        <a href="movie-details.html?id=${movie.id}" class="search-result-item" style="
          display:flex;align-items:center;gap:12px;padding:10px 12px;
          border-radius:10px;cursor:pointer;transition:background 0.2s;
        " onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background=''">
          <img src="${escAttr(getPoster(movie))}" alt="${escAttr(movie.title)}" width="32" height="48"
               style="width:32px;height:48px;object-fit:cover;border-radius:4px;flex-shrink:0">
          <div>
            <div style="font-size:0.9rem;font-weight:600;color:#fff">${escHtml(movie.title)}</div>
            <div style="font-size:0.75rem;color:rgba(255,255,255,0.4)">${fmtYear(movie.release_date)} · ${fmtRating(movie.vote_average)} ★</div>
          </div>
        </a>
      `).join('');
    }, 350);
  });
}

/* ============================================================
   STATS / INIT
============================================================ */
function initStatsBanner() {
  const banner = document.getElementById('stats-banner');
  if (!banner) return;

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      $$('.count-up', banner).forEach(el => countUp(el, parseInt(el.dataset.target, 10)));
      io.unobserve(entry.target);
    });
  }, { threshold: 0.5 });
  io.observe(banner);
}

async function init() {
  hideLoadingScreen();
  initNavbar();
  initHeroParallax();
  initReveal();
  initSearch();

  try {
    await loadBackendGenres();
    homeMovies = await fetchBackendMovies();
  } catch (error) {
    console.error('Backend movie load failed:', error);
    homeMovies = [];
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
  initMagnetic();
  lazyLoadImages();
}

function escHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escAttr(value) {
  return escHtml(value);
}

document.addEventListener('DOMContentLoaded', init);
