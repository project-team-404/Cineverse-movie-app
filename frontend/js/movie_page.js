/* ============================================================
   CINEVERSE - MOVIE PAGE CONTROLLER
   FastAPI data version, original UI classes preserved.
   ============================================================ */

const API_BASE =
  window.CINEVERSE_API_BASE ||
  localStorage.getItem('cineverse_api_base') ||
  'https://cineverse-movie-app.onrender.com';

const API_LIMIT = 200;
const PLACEHOLDER_IMAGE = '';

// Genre map is populated at runtime from the /genres/ API endpoint
const GENRE_MAP = {};

const state = {
  allMovies: [],
  filtered: [],
  genre: 'all',
  year: 'all',
  rating: 'all',
  sort: 'popularity',
  query: '',
  page: 1,
  perPage: 20,
  view: 'grid',
};

document.addEventListener('DOMContentLoaded', boot);

async function boot() {
  fixNavActiveLink();
  spawnParticles();
  wireFilters();
  wireSearch();
  wireSort();
  wireViewToggle();
  wireSearchChips();
  wireOverlaySearch();
  initReveal();
  readURLParams();
  renderLoading();

  try {
    await loadGenres();
    // Resolve genre ID to name now that GENRE_MAP is populated
    state.genre = resolveGenreParam(state.genre);
    syncChips('genre', state.genre);
    state.allMovies = await fetchMovies();
    applyFilters();
    renderGrid();
    buildCarousel('toprated-cs-track', getTopRatedMovies(), 'toprated-detail', 'Top Rated');
    buildCarousel('trending-cs-track', getPopularMovies(), 'trending-detail', 'Popular');
    buildRecentlyAdded(getRecentlyAddedMovies());
  } catch (error) {
    console.error(error);
    renderError('Could not load movies. Start FastAPI and refresh this page.');
  }
}

/* ============================================================
   API
============================================================ */
async function apiGet(path, params = {}) {
  const url = new URL(path, normalizeBaseUrl(API_BASE));

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '' && value !== 'all') {
      url.searchParams.set(key, value);
    }
  });

  const response = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.json();
}

async function fetchMovies() {
  const data = await apiGet('/movies/', { page: 1, limit: API_LIMIT });
  return normalizeMovieList(data);
}

async function fetchSearchMovies(query) {
  const data = await apiGet('/movies/search/', { q: query, page: 1, limit: API_LIMIT });
  return normalizeMovieList(data);
}

async function fetchFilteredMovies() {
  const data = await apiGet('/movies/filter/', {
    genre: state.genre === 'all' ? '' : state.genre,
    year: state.year,
    page: 1,
    limit: API_LIMIT,
  });
  return normalizeMovieList(data);
}

async function loadGenres() {
  try {
    const genres = await apiGet('/genres/');
    if (Array.isArray(genres)) {
      genres.forEach(genre => {
        if (genre && genre.id && genre.name) GENRE_MAP[genre.id] = genre.name;
      });
    }
  } catch (error) {
    console.warn('Genres endpoint not available yet:', error);
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
  const releaseYear = movie.release_year || null;
  const rating = Number(movie.rating ?? 0);
  const poster = resolveImageUrl(
    movie.poster_url ||
    movie.image_url ||
    images[0]?.image_url ||
    images[0]?.url ||
    ''
  );

  return {
    id: movie.id,
    title: movie.title || 'Untitled',
    description: movie.description || '',
    release_year: releaseYear,
    duration: movie.duration,
    language: movie.language || '',
    rating,
    poster_url: poster,
    trailer_url: movie.trailer_url || '',
    genre,
    images,
    raw: movie,
  };
}

function normalizeGenre(genre, genreId, genreName) {
  if (genre && typeof genre === 'object') {
    return { id: genre.id ?? genreId ?? null, name: genre.name || GENRE_MAP[genre.id] || 'Film' };
  }

  if (typeof genre === 'string' && genre.trim()) {
    return { id: genreId ?? null, name: genre.trim() };
  }

  if (genreId && GENRE_MAP[genreId]) {
    return { id: genreId, name: GENRE_MAP[genreId] };
  }

  if (genreName) {
    return { id: genreId ?? null, name: genreName };
  }

  return { id: null, name: 'Film' };
}

function resolveImageUrl(value) {
  const raw = String(value || '').trim();
  if (!raw || raw === 'null' || raw === 'undefined') return '';
  if (/^https?:\/\//i.test(raw) || raw.startsWith('data:') || raw.startsWith('blob:')) return raw;
  if (raw.startsWith('//')) return `${location.protocol}${raw}`;
  if (raw.startsWith('/')) {
    return new URL(raw, normalizeBaseUrl(API_BASE)).toString();
  }
  return raw;
}

function getPoster(movie) {
  return resolveImageUrl(movie?.poster_url || movie?.images?.[0]?.image_url || '');
}

function getBackdrop(movie) {
  return getPoster(movie);
}

function genreName(movie) {
  return movie?.genre?.name || 'Film';
}

function genreValueForApi(value) {
  if (!value || value === 'all') return '';
  // Genre chip data-values are now genre name strings directly (e.g. "Action", "Drama")
  // GENRE_MAP may still be populated from /genres/ API with id→name mappings for lookup
  return GENRE_MAP[value] || value;
}

function movieForStorage(movie) {
  return {
    id: movie.id,
    title: movie.title,
    description: movie.description,
    release_year: movie.release_year,
    duration: movie.duration,
    language: movie.language,
    rating: movie.rating,
    poster_url: movie.poster_url,
    trailer_url: movie.trailer_url,
    genre: movie.genre,
    images: movie.images,
  };
}

/* ============================================================
   URL PARAMS
============================================================ */
function resolveGenreParam(value) {
  // If value is a numeric ID, resolve to genre name using GENRE_MAP
  if (!value || value === 'all') return 'all';
  const asNum = Number(value);
  if (!isNaN(asNum) && GENRE_MAP[asNum]) return GENRE_MAP[asNum];
  return value; // already a name string
}

function readURLParams() {
  const params = new URLSearchParams(location.search);
  if (params.get('genre')) state.genre = params.get('genre'); // may be ID or name
  if (params.get('year')) state.year = params.get('year');
  if (params.get('q')) state.query = params.get('q').trim().toLowerCase();

  const sort = params.get('sort');
  const filter = params.get('filter');
  if (sort === 'rating' || filter === 'top_rated') state.sort = 'rating';
  if (sort === 'recent' || filter === 'now_playing' || filter === 'upcoming') state.sort = 'release';
  if (filter === 'trending' || sort === 'popularity') state.sort = 'rating'; // no popularity field; use rating

  syncChips('genre', state.genre);
  syncChips('year', state.year);
  syncChips('rating', state.rating);

  const searchInput = document.getElementById('movies-search-input');
  if (searchInput && state.query) searchInput.value = state.query;

  const sortEl = document.getElementById('sort-select');
  if (sortEl) sortEl.value = state.sort;
}

/* ============================================================
   FILTERS
============================================================ */
function applyFilters(source = state.allMovies) {
  let list = [...source];

  if (state.genre !== 'all') {
    const wanted = state.genre.toLowerCase();
    list = list.filter(movie => {
      const name = (movie.genre?.name || '').toLowerCase();
      return name === wanted || name.includes(wanted) || wanted.includes(name);
    });
  }

  if (state.year !== 'all') {
    list = list.filter(movie => String(movie.release_year || '') === String(state.year));
  }

  if (state.rating !== 'all') {
    const min = Number(state.rating);
    list = list.filter(movie => Number(movie.rating || 0) >= min);
  }

  if (state.query) {
    const q = state.query.toLowerCase();
    list = list.filter(movie =>
      movie.title.toLowerCase().includes(q) ||
      movie.description.toLowerCase().includes(q) ||
      genreName(movie).toLowerCase().includes(q) ||
      movie.language.toLowerCase().includes(q)
    );
  }

  list.sort(sortMovies);
  state.filtered = list;
  state.page = 1;
  updateResultState();
}

function sortMovies(a, b) {
  if (state.sort === 'rating') return (b.rating || 0) - (a.rating || 0);
  if (state.sort === 'release') return (b.release_year || 0) - (a.release_year || 0);
  if (state.sort === 'title') return (a.title || '').localeCompare(b.title || '');
  // Default: sort by rating descending (no popularity field from backend)
  return (b.rating || 0) - (a.rating || 0);
}

async function refreshMoviesFromApi() {
  renderLoading();
  try {
    let movies;
    if (state.query) movies = await fetchSearchMovies(state.query);
    else if (state.genre !== 'all' || state.year !== 'all') movies = await fetchFilteredMovies();
    else movies = state.allMovies.length ? state.allMovies : await fetchMovies();

    applyFilters(movies);
    renderGrid();
  } catch (error) {
    console.error(error);
    renderError('Could not load movies from FastAPI.');
  }
}

function updateResultState() {
  const countEl = document.getElementById('results-count-num');
  if (countEl) countEl.textContent = state.filtered.length.toLocaleString();

  renderActiveFilterTags();

  const empty = document.getElementById('empty-state');
  const grid = document.getElementById('movies-grid');

  if (state.filtered.length === 0) {
    if (empty) {
      empty.style.display = 'block';
      empty.classList.add('visible');
    }
    if (grid) grid.style.display = 'none';
  } else {
    if (empty) {
      empty.style.display = 'none';
      empty.classList.remove('visible');
    }
    if (grid) grid.style.display = '';
  }
}

/* ============================================================
   GRID
============================================================ */
function renderLoading() {
  const grid = document.getElementById('movies-grid');
  if (!grid) return;
  grid.style.display = '';
  grid.className = state.view === 'list' ? 'movies-grid list-view' : 'movies-grid';
  grid.innerHTML = Array.from({ length: 10 }, () => `
    <div class="skeleton-card" aria-hidden="true">
      <div class="skeleton skeleton-poster"></div>
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-meta"></div>
    </div>
  `).join('');
}

function renderGrid() {
  const grid = document.getElementById('movies-grid');
  if (!grid) return;

  const start = (state.page - 1) * state.perPage;
  const page = state.filtered.slice(start, start + state.perPage);

  grid.className = state.view === 'list' ? 'movies-grid list-view' : 'movies-grid';
  grid.innerHTML = page.map(buildGridCard).join('');

  grid.querySelectorAll('.mgc').forEach((card, i) => {
    card.style.animationDelay = `${i * 0.04}s`;
  });

  wireGridActions(grid);
  renderPagination();
}

function buildGridCard(movie) {
  const rating = movie.rating ? movie.rating.toFixed(1) : '--';
  const year = movie.release_year || '--';
  const genre = genreName(movie);
  const inWL = isInWatchlist(movie.id);
  const inFav = isInFavourite(movie.id);
  const movieJ = escAttr(JSON.stringify(movieForStorage(movie)));

  if (state.view === 'list') {
    return `
      <div class="mgc" role="listitem">
        <div class="mgc-poster" style="width:80px;flex-shrink:0;">
          <img src="${escAttr(getPoster(movie))}" alt="${escAttr(movie.title)}" loading="lazy">
          <div class="mgc-rating">${starSvg(10)} ${rating}</div>
        </div>
        <div class="mgc-info" style="flex:1;padding:8px 0;">
          <a href="movie-details.html?id=${movie.id}" class="mgc-title">${escHtml(movie.title)}</a>
          <div class="mgc-meta-row">
            <span>${year}</span>
            <span class="mgc-genre-tag">${escHtml(genre)}</span>
          </div>
          <p style="font-size:var(--text-xs);color:var(--white-30);margin-top:6px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.5">${escHtml(movie.description || '')}</p>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:8px;">
          <a href="movie-details.html?id=${movie.id}" class="mgc-play-btn" style="position:static;transform:none;opacity:1;margin-bottom:0;width:40px;height:40px;" aria-label="Watch ${escAttr(movie.title)}">
            ${playSvg(16)}
          </a>
          <div style="display:flex;gap:6px;">
            <button class="mgc-action-btn mgc-wl-btn ${inWL ? 'active' : ''}" data-movie="${movieJ}" aria-label="Watchlist">${bookmarkSvg(inWL)}</button>
            <button class="mgc-action-btn mgc-fav-btn ${inFav ? 'active' : ''}" data-movie="${movieJ}" aria-label="Favourite">${heartSvg(inFav)}</button>
          </div>
        </div>
      </div>`;
  }

  return `
    <div class="mgc" role="listitem">
      <div class="mgc-poster">
        <img src="${escAttr(getPoster(movie))}" alt="${escAttr(movie.title)}" loading="lazy">
        <div class="mgc-rating">${starSvg(10)} ${rating}</div>
        <div class="mgc-gradient"></div>
        <div class="mgc-actions">
          <a href="movie-details.html?id=${movie.id}" class="mgc-play-btn" aria-label="Watch ${escAttr(movie.title)}">
            ${playSvg(20)}
          </a>
          <div class="mgc-action-row">
            <button class="mgc-action-btn mgc-wl-btn ${inWL ? 'active' : ''}" data-movie="${movieJ}" aria-label="Watchlist">${bookmarkSvg(inWL)}</button>
            <button class="mgc-action-btn mgc-fav-btn ${inFav ? 'active' : ''}" data-movie="${movieJ}" aria-label="Favourite">${heartSvg(inFav)}</button>
            <button class="mgc-action-btn mgc-qv-btn" data-movie="${movieJ}" aria-label="Quick view">${eyeSvg()}</button>
          </div>
        </div>
      </div>
      <div class="mgc-info">
        <a href="movie-details.html?id=${movie.id}" class="mgc-title">${escHtml(movie.title)}</a>
        <div class="mgc-meta-row">
          <span>${year}</span>
          <span class="mgc-genre-tag">${escHtml(genre)}</span>
        </div>
      </div>
    </div>`;
}

function wireGridActions(root) {
  root.querySelectorAll('.mgc-wl-btn').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.preventDefault();
      e.stopPropagation();
      if (btn.dataset.cvBusy) return; /* one request in flight at a time */
      btn.dataset.cvBusy = '1';
      btn.style.opacity = '0.5';
      const result = await toggleWatchlist(readMovieData(btn));
      delete btn.dataset.cvBusy;
      btn.style.opacity = '';
      if (result === null) return; /* not logged in / error — icon unchanged */
      btn.classList.toggle('active', result);
      btn.innerHTML = bookmarkSvg(result);
    });
  });

  root.querySelectorAll('.mgc-fav-btn').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.preventDefault();
      e.stopPropagation();
      if (btn.dataset.cvBusy) return;
      btn.dataset.cvBusy = '1';
      btn.style.opacity = '0.5';
      const result = await toggleFavourite(readMovieData(btn));
      delete btn.dataset.cvBusy;
      btn.style.opacity = '';
      if (result === null) return;
      btn.classList.toggle('active', result);
      btn.innerHTML = heartSvg(result);
    });
  });

  root.querySelectorAll('.mgc-qv-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      openQuickView(readMovieData(btn));
    });
  });
}

function readMovieData(btn) {
  try {
    return JSON.parse(btn.dataset.movie || '{}');
  } catch {
    return {};
  }
}

function renderError(message) {
  const grid = document.getElementById('movies-grid');
  const countEl = document.getElementById('results-count-num');
  if (countEl) countEl.textContent = '0';
  if (!grid) return;
  grid.style.display = '';
  grid.innerHTML = `<div class="suggest-empty" style="grid-column:1/-1;padding:32px;text-align:center;">${escHtml(message)}</div>`;
}

/* ============================================================
   PAGINATION
============================================================ */
function renderPagination() {
  const wrap = document.getElementById('pagination');
  if (!wrap) return;

  const total = Math.ceil(state.filtered.length / state.perPage);
  if (total <= 1) {
    wrap.innerHTML = '';
    return;
  }

  const p = state.page;
  let pages = [];
  if (total <= 7) {
    pages = Array.from({ length: total }, (_, i) => i + 1);
  } else {
    pages = [1];
    if (p > 3) pages.push('...');
    for (let i = Math.max(2, p - 1); i <= Math.min(total - 1, p + 1); i += 1) pages.push(i);
    if (p < total - 2) pages.push('...');
    pages.push(total);
  }

  wrap.innerHTML = `
    <button class="pag-btn" id="pag-prev" aria-label="Previous page" ${p === 1 ? 'disabled' : ''}>${arrowLeftSvg()}</button>
    ${pages.map(pg => pg === '...'
      ? '<span class="pag-ellipsis">...</span>'
      : `<button class="pag-btn ${pg === p ? 'active' : ''}" data-pg="${pg}">${pg}</button>`
    ).join('')}
    <button class="pag-btn" id="pag-next" aria-label="Next page" ${p === total ? 'disabled' : ''}>${arrowRightSvg()}</button>`;

  wrap.querySelectorAll('[data-pg]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.page = Number(btn.dataset.pg);
      renderGrid();
      scrollToGrid();
    });
  });

  document.getElementById('pag-prev')?.addEventListener('click', () => {
    if (state.page > 1) {
      state.page -= 1;
      renderGrid();
      scrollToGrid();
    }
  });

  document.getElementById('pag-next')?.addEventListener('click', () => {
    if (state.page < total) {
      state.page += 1;
      renderGrid();
      scrollToGrid();
    }
  });
}

function scrollToGrid() {
  window.scrollTo({ top: (document.getElementById('movies-grid')?.offsetTop || 0) - 120, behavior: 'smooth' });
}

/* ============================================================
   ACTIVE FILTER TAGS
============================================================ */
function renderActiveFilterTags() {
  const wrap = document.getElementById('active-filters-wrap');
  if (!wrap) return;

  const tags = [];
  if (state.genre !== 'all') tags.push({ label: state.genre, key: 'genre' });
  if (state.year !== 'all') tags.push({ label: state.year, key: 'year' });
  if (state.rating !== 'all') tags.push({ label: `${state.rating}+ rating`, key: 'rating' });
  if (state.query) tags.push({ label: `"${state.query}"`, key: 'query' });

  wrap.innerHTML = tags.map(tag => `
    <div class="active-filter-tag" role="listitem">
      ${escHtml(tag.label)}
      <button class="active-filter-remove" data-clear="${escAttr(tag.key)}" aria-label="Remove ${escAttr(tag.label)} filter">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="10" height="10">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>`).join('');

  wrap.querySelectorAll('[data-clear]').forEach(btn => {
    btn.addEventListener('click', () => clearFilter(btn.dataset.clear));
  });
}

window.clearFilter = clearFilter;

function clearFilter(key) {
  if (key === 'genre') {
    state.genre = 'all';
    syncChips('genre', 'all');
  }
  if (key === 'year') {
    state.year = 'all';
    syncChips('year', 'all');
  }
  if (key === 'rating') {
    state.rating = 'all';
    syncChips('rating', 'all');
  }
  if (key === 'query') {
    state.query = '';
    const input = document.getElementById('movies-search-input');
    if (input) input.value = '';
    closeSuggestions();
  }
  refreshMoviesFromApi();
}

function syncChips(filter, value) {
  document.querySelectorAll(`[data-filter="${filter}"]`).forEach(btn => {
    btn.classList.toggle('active', btn.dataset.value === value);
  });
}

/* ============================================================
   WIRES
============================================================ */
function wireFilters() {
  document.querySelectorAll('.filter-chip[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      const value = btn.dataset.value;
      document.querySelectorAll(`[data-filter="${filter}"]`).forEach(item => item.classList.remove('active'));
      btn.classList.add('active');
      state[filter] = value;
      refreshMoviesFromApi();
    });
  });

  document.getElementById('empty-reset-btn')?.addEventListener('click', resetAllFilters);
}

function resetAllFilters() {
  state.genre = 'all';
  state.year = 'all';
  state.rating = 'all';
  state.query = '';
  state.page = 1;

  const input = document.getElementById('movies-search-input');
  if (input) input.value = '';
  closeSuggestions();

  document.querySelectorAll('.filter-chip[data-filter]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.value === 'all');
  });

  refreshMoviesFromApi();
}

function wireSearch() {
  const input = document.getElementById('movies-search-input');
  const clearBtn = document.getElementById('movies-search-clear');
  const suggest = document.getElementById('movies-suggestions');
  if (!input) return;

  let timer;
  input.addEventListener('input', () => {
    clearTimeout(timer);
    const q = input.value.trim();
    clearBtn?.classList.toggle('visible', q.length > 0);

    timer = setTimeout(async () => {
      state.query = q.toLowerCase();
      await refreshMoviesFromApi();

      if (q.length < 1) {
        closeSuggestions();
        return;
      }

      renderSuggestions(suggest, suggestFromMovies(state.filtered.length ? state.filtered : state.allMovies, q), q);
    }, 250);
  });

  clearBtn?.addEventListener('click', () => {
    input.value = '';
    state.query = '';
    clearBtn.classList.remove('visible');
    closeSuggestions();
    refreshMoviesFromApi();
    input.focus();
  });

  document.addEventListener('click', e => {
    const bar = document.getElementById('movies-search-bar');
    if (bar && !bar.contains(e.target)) closeSuggestions();
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeSuggestions();
      input.blur();
    }
  });
}

function suggestFromMovies(movies, query) {
  const q = query.toLowerCase();
  const startsWith = [];
  const contains = [];
  const details = [];

  movies.forEach(movie => {
    const title = (movie.title || '').toLowerCase();
    if (title.startsWith(q)) startsWith.push(movie);
    else if (title.includes(q)) contains.push(movie);
    else if ((movie.description || '').toLowerCase().includes(q) || genreName(movie).toLowerCase().includes(q)) details.push(movie);
  });

  return [...startsWith, ...contains, ...details].slice(0, 7);
}

function renderSuggestions(container, movies, query) {
  if (!container) return;

  if (!movies.length) {
    container.innerHTML = `<div class="suggest-empty">No movies found for "<strong>${escHtml(query)}</strong>"</div>`;
    container.classList.add('visible');
    container.style.display = 'block';
    return;
  }

  const q = query.toLowerCase();
  container.innerHTML = movies.map(movie => {
    const title = movie.title || '';
    const idx = title.toLowerCase().indexOf(q);
    const highlighted = idx === -1
      ? escHtml(title)
      : escHtml(title.slice(0, idx)) + `<em>${escHtml(title.slice(idx, idx + query.length))}</em>` + escHtml(title.slice(idx + query.length));

    return `
      <a href="movie-details.html?id=${movie.id}" class="suggest-item" aria-label="${escAttr(title)}">
        <img src="${escAttr(getPoster(movie))}" alt="${escAttr(title)}" loading="lazy">
        <div class="suggest-item-info">
          <div class="suggest-item-title">${highlighted}</div>
          <div class="suggest-item-meta">${movie.release_year || '--'} - ${escHtml(genreName(movie))}</div>
        </div>
        <div class="suggest-item-rating">${movie.rating ? movie.rating.toFixed(1) : '--'}</div>
      </a>`;
  }).join('');

  container.classList.add('visible');
  container.style.display = 'block';
}

function closeSuggestions() {
  const suggest = document.getElementById('movies-suggestions');
  if (!suggest) return;
  suggest.innerHTML = '';
  suggest.classList.remove('visible');
  suggest.style.display = 'none';
}

function wireSort() {
  const select = document.getElementById('sort-select');
  select?.addEventListener('change', () => {
    state.sort = select.value;
    applyFilters();
    renderGrid();
  });
}

function wireViewToggle() {
  const gridBtn = document.getElementById('grid-view-btn');
  const listBtn = document.getElementById('list-view-btn');

  gridBtn?.addEventListener('click', () => {
    state.view = 'grid';
    gridBtn.classList.add('active');
    gridBtn.setAttribute('aria-pressed', 'true');
    listBtn?.classList.remove('active');
    listBtn?.setAttribute('aria-pressed', 'false');
    renderGrid();
  });

  listBtn?.addEventListener('click', () => {
    state.view = 'list';
    listBtn.classList.add('active');
    listBtn.setAttribute('aria-pressed', 'true');
    gridBtn?.classList.remove('active');
    gridBtn?.setAttribute('aria-pressed', 'false');
    renderGrid();
  });
}

function wireSearchChips() {
  document.querySelectorAll('.search-chip[data-query]').forEach(chip => {
    chip.addEventListener('click', () => {
      const input = document.getElementById('movies-search-input');
      if (!input) return;
      input.value = chip.dataset.query;
      input.dispatchEvent(new Event('input'));
      input.focus();
    });
  });
}

function wireOverlaySearch() {
  document.querySelectorAll('.search-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      const input = document.getElementById('movies-search-input');
      if (!input) return;
      input.value = tag.textContent.trim();
      input.dispatchEvent(new Event('input'));
      input.focus();
    });
  });
}

/* ============================================================
   CAROUSELS
============================================================ */
function getTopRatedMovies() {
  return [...state.allMovies].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 15);
}

function getPopularMovies() {
  // Backend has no popularity field; use rating as the best available signal
  return [...state.allMovies].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 15);
}

function getRecentlyAddedMovies() {
  return [...state.allMovies].sort((a, b) => (b.id || 0) - (a.id || 0)).slice(0, 12);
}

function buildCarousel(trackId, movies, detailId, label) {
  const track = document.getElementById(trackId);
  const detail = document.getElementById(detailId);
  if (!track || !movies.length) return;

  track.innerHTML = movies.map((movie, i) => `
    <div class="cs-card ${i === 0 ? 'cs-active' : ''}" data-idx="${i}" role="listitem" tabindex="0" aria-label="${escAttr(movie.title)}">
      <div class="cs-card-poster">
        <span class="cs-card-rank">${String(i + 1).padStart(2, '0')}</span>
        <img src="${escAttr(getPoster(movie))}" alt="${escAttr(movie.title)}" loading="${i < 3 ? 'eager' : 'lazy'}">
        <div class="cs-card-badge">${starSvg(9)} ${movie.rating ? movie.rating.toFixed(1) : '--'}</div>
        <div class="cs-card-hover">
          <a href="movie-details.html?id=${movie.id}" class="cs-card-play" aria-label="Watch ${escAttr(movie.title)}">${playSvg(18)}</a>
        </div>
      </div>
      <div class="cs-card-info">
        <div class="cs-card-title">${escHtml(movie.title)}</div>
        <div class="cs-card-year">${movie.release_year || '--'}</div>
      </div>
    </div>`).join('');

  updateCarouselDetail(detail, movies[0], label, 0);

  track.querySelectorAll('.cs-card').forEach((card, i) => {
    card.addEventListener('click', () => {
      track.querySelectorAll('.cs-card').forEach(item => item.classList.remove('cs-active'));
      card.classList.add('cs-active');
      updateCarouselDetail(detail, movies[i], label, i);
    });
  });

  const stage = track.closest('.cs-stage');
  stage?.querySelector('.cs-btn-prev')?.addEventListener('click', () => track.scrollBy({ left: -210, behavior: 'smooth' }));
  stage?.querySelector('.cs-btn-next')?.addEventListener('click', () => track.scrollBy({ left: 210, behavior: 'smooth' }));
  initCarouselDrag(track);
}

function updateCarouselDetail(detail, movie, label, index) {
  if (!detail || !movie) return;

  const set = (sel, val) => {
    const el = detail.querySelector(sel);
    if (el) el.textContent = val;
  };

  detail.classList.add('cs-transitioning');
  setTimeout(() => {
    set('.cs-detail-eyebrow', `${label} #${index + 1}`);
    set('.cs-detail-title', movie.title);
    set('.cs-rating-val', movie.rating ? movie.rating.toFixed(1) : '--');
    set('.cs-year-val', movie.release_year || '--');
    set('.cs-detail-desc', movie.description || '');
    set('.cs-genre-val', genreName(movie));

    const watchBtn = detail.querySelector('.cs-watch-btn');
    if (watchBtn) watchBtn.href = `movie-details.html?id=${movie.id}`;

    const wlBtn = detail.querySelector('.cs-wl-btn');
    if (wlBtn) {
      wlBtn.dataset.movieId = movie.id; /* lets cv-patch.js delegation resolve it too */
      const inWL = isInWatchlist(movie.id);
      wlBtn.classList.toggle('active', inWL);
      wlBtn.innerHTML = `${bookmarkSvg(inWL)} ${inWL ? 'In Watchlist' : 'Watchlist'}`;
      wlBtn.onclick = async () => {
        if (wlBtn.dataset.cvBusy) return;
        wlBtn.dataset.cvBusy = '1';
        wlBtn.style.opacity = '0.5';
        const result = await toggleWatchlist(movieForStorage(movie));
        delete wlBtn.dataset.cvBusy;
        wlBtn.style.opacity = '';
        if (result === null) return;
        wlBtn.classList.toggle('active', result);
        wlBtn.innerHTML = `${bookmarkSvg(result)} ${result ? 'In Watchlist' : 'Watchlist'}`;
      };
    }

    detail.classList.remove('cs-transitioning');
  }, 180);
}

function buildRecentlyAdded(movies) {
  const track = document.getElementById('recently-track');
  if (!track || !movies.length) return;

  track.innerHTML = movies.map(movie => `
    <div class="rc-card" role="listitem">
      <a href="movie-details.html?id=${movie.id}" class="rc-card-link" aria-label="${escAttr(movie.title)}">
        <div class="rc-poster">
          <img src="${escAttr(getPoster(movie))}" alt="${escAttr(movie.title)}" loading="lazy">
          <div class="rc-badge">${starSvg(9)} ${movie.rating ? movie.rating.toFixed(1) : '--'}</div>
          <div class="rc-hover">${playSvg(28)}</div>
        </div>
        <div class="rc-info">
          <div class="rc-title">${escHtml(movie.title)}</div>
          <div class="rc-year">${movie.release_year || '--'}</div>
        </div>
      </a>
    </div>`).join('');

  initCarouselDrag(track);
}

/* ============================================================
   QUICK VIEW
============================================================ */
function openQuickView(movie) {
  const modal = document.getElementById('quickview-modal');
  const content = document.getElementById('quickview-content');
  if (!modal || !content) return;

  content.innerHTML = `
    <div style="display:flex;gap:24px;align-items:flex-start">
      <img src="${escAttr(getPoster(movie))}" alt="${escAttr(movie.title || '')}"
           style="width:120px;height:180px;object-fit:cover;border-radius:12px;flex-shrink:0;border:1px solid var(--glass-border)">
      <div style="flex:1;min-width:0">
        <p style="font-size:var(--text-xs);font-weight:700;letter-spacing:var(--tracking-widest);text-transform:uppercase;color:var(--gold);margin-bottom:8px">${escHtml(genreName(movie))}</p>
        <h3 style="font-family:var(--font-display);font-size:var(--text-3xl);letter-spacing:var(--tracking-wide);color:var(--white);margin-bottom:12px;line-height:1">${escHtml(movie.title || '')}</h3>
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px;font-size:var(--text-sm);color:var(--white-60)">
          <span style="color:var(--rating-star);font-weight:700">${movie.rating ? Number(movie.rating).toFixed(1) : '--'}</span>
          <span>${movie.release_year || '--'}</span>
          ${movie.duration ? `<span>${movie.duration} min</span>` : ''}
          ${movie.language ? `<span>${escHtml(movie.language)}</span>` : ''}
        </div>
        <p style="font-size:var(--text-sm);color:var(--white-60);line-height:1.7;margin-bottom:20px;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden">${escHtml(movie.description || 'No description available.')}</p>
        <div style="display:flex;gap:12px;flex-wrap:wrap">
          <a href="movie-details.html?id=${movie.id}" class="btn-primary" style="font-size:var(--text-sm);padding:10px 20px">
            ${playSvg(16)}
            Watch Now
          </a>
          ${movie.trailer_url ? `<button class="btn-ghost" id="quickview-trailer-btn" style="font-size:var(--text-sm);padding:10px 20px">${playSvg(16)} Trailer</button>` : ''}
        </div>
      </div>
    </div>`;

  content.querySelector('#quickview-trailer-btn')?.addEventListener('click', () => openTrailer(movie.trailer_url));
  modal.classList.add('active');
}

function openTrailer(url) {
  const modal = document.getElementById('trailer-modal');
  const frame = document.getElementById('trailer-iframe');
  if (!modal || !frame || !url) return;
  frame.src = toEmbedUrl(url);
  modal.classList.add('active');
}

function toEmbedUrl(url) {
  try {
    const parsed = new URL(url);
    const videoId = parsed.searchParams.get('v');
    if (parsed.hostname.includes('youtube.com') && videoId) return `https://www.youtube.com/embed/${videoId}`;
    if (parsed.hostname.includes('youtu.be')) return `https://www.youtube.com/embed/${parsed.pathname.replace('/', '')}`;
  } catch {
    return url;
  }
  return url;
}

/* ============================================================
   NAV / REVEAL / DRAG
============================================================ */
function fixNavActiveLink() {
  const currentPage = location.pathname.split('/').pop() || 'home.html';
  document.querySelectorAll('.nav-link, .nav-mobile-link').forEach(link => {
    link.classList.remove('active');
    link.removeAttribute('aria-current');
    const href = link.getAttribute('href') || '';
    if (href === currentPage || (currentPage === '' && href === 'home.html')) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }
  });
}

function spawnParticles() {
  const container = document.getElementById('header-particles');
  if (!container) return;
  for (let i = 0; i < 24; i += 1) {
    const span = document.createElement('span');
    span.className = 'particle';
    span.style.cssText = `left:${Math.random() * 100}%;top:${Math.random() * 100}%;--dur:${4 + Math.random() * 6}s;--delay:${Math.random() * 5}s;`;
    container.appendChild(span);
  }
}

function initCarouselDrag(track) {
  if (!track) return;
  let isDown = false;
  let startX = 0;
  let scrollLeft = 0;

  track.addEventListener('mousedown', e => {
    isDown = true;
    startX = e.pageX - track.offsetLeft;
    scrollLeft = track.scrollLeft;
  });
  track.addEventListener('mouseleave', () => { isDown = false; });
  track.addEventListener('mouseup', () => { isDown = false; });
  track.addEventListener('mousemove', e => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - track.offsetLeft;
    track.scrollLeft = scrollLeft - (x - startX);
  });
}

function initReveal() {
  const revealEls = document.querySelectorAll('.reveal');
  if (!revealEls.length) return;

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  revealEls.forEach(el => observer.observe(el));
}

/* ============================================================
   FAVORITES / WATCHLIST — backed by the FastAPI backend
   (cv-api.js, loaded on this page, is the single source of truth).
   No localStorage — every toggle is a real API call to:
     POST/DELETE /favorites/{movie_id}
     POST /watchlist/add/{movie_id}  DELETE /watchlist/{movie_id}
============================================================ */
function isInWatchlist(id) {
  return typeof cvIsWatchlisted === 'function' ? cvIsWatchlisted(id) : false;
}

function isInFavourite(id) {
  return typeof cvIsFavorite === 'function' ? cvIsFavorite(id) : false;
}

/* Returns: true = now in watchlist, false = removed, null = error/not logged in */
async function toggleWatchlist(movie) {
  if (typeof cvToggleWatchlist !== 'function' || !movie?.id) return null;
  return await cvToggleWatchlist(movie.id);
}

/* Returns: true = now favorited, false = removed, null = error/not logged in */
async function toggleFavourite(movie) {
  if (typeof cvToggleFavorite !== 'function' || !movie?.id) return null;
  return await cvToggleFavorite(movie.id);
}

/* ============================================================
   SVG / ESCAPE HELPERS
============================================================ */
function starSvg(size) {
  return `<svg viewBox="0 0 24 24" fill="#f4c542" width="${size}" height="${size}" aria-hidden="true"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
}

function playSvg(size) {
  return `<svg viewBox="0 0 24 24" fill="currentColor" width="${size}" height="${size}" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>`;
}

function bookmarkSvg(active) {
  return `<svg viewBox="0 0 24 24" fill="${active ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" width="14" height="14" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`;
}

function heartSvg(active) {
  return `<svg viewBox="0 0 24 24" fill="${active ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" width="14" height="14" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
}

function eyeSvg() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
}

function arrowLeftSvg() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16" aria-hidden="true"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>';
}

function arrowRightSvg() {
  return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16" aria-hidden="true"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';
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