/* ============================================================
   CINEVERSE — MOVIE PAGE CONTROLLER  (FIXED VERSION)
   Fixes:
   - Nav active link updates on click
   - Genre / Year / Rating filters actually work
   - Autocomplete: type "op" → lists movies starting with "op"
   - Removed sticky search logic
   - MGC card classes match the CSS
   - Pagination uses .pag-btn (matches CSS)
   ============================================================ */

/* -- IMAGES -- */
const MOVIE_IMAGES = {};
function getPoster(movie_id, poster_path) {
  if (MOVIE_IMAGES[movie_id]) return MOVIE_IMAGES[movie_id];
  if (poster_path) return 'https://image.tmdb.org/t/p/w342' + poster_path;
  return 'assets/images/placeholder.jpg';
}
function getBackdrop(movie_id, backdrop_path) {
  if (MOVIE_IMAGES[movie_id]) return MOVIE_IMAGES[movie_id];
  if (backdrop_path) return 'https://image.tmdb.org/t/p/w780' + backdrop_path;
  return 'assets/images/placeholder.jpg';
}

/* -- STATE -- */
const state = {
  allMovies : [],
  filtered  : [],
  genre     : 'all',
  year      : 'all',
  rating    : 'all',
  sort      : 'popularity',
  query     : '',
  page      : 1,
  perPage   : 20,
  view      : 'grid',
};

/* -- GENRE MAP -- */
const GENRE_MAP = {
  28:'Action', 12:'Adventure', 16:'Animation', 35:'Comedy', 80:'Crime',
  99:'Documentary', 18:'Drama', 10751:'Family', 14:'Fantasy', 36:'History',
  27:'Horror', 10402:'Music', 9648:'Mystery', 10749:'Romance', 878:'Sci-Fi',
  10770:'TV Movie', 53:'Thriller', 10752:'War', 37:'Western'
};
function genreName(ids=[]) { return (ids||[]).slice(0,1).map(id => GENRE_MAP[id]||'').join(''); }
function genreNames(ids=[]) { return (ids||[]).slice(0,3).map(id => GENRE_MAP[id]||'Film'); }

/* ============================================================
   BOOT
============================================================ */
(async function boot() {
  /* Fix nav active state immediately */
  fixNavActiveLink();

  /* Spawn particles if header exists */
  spawnParticles();

  /* Fetch data */
  const [p1, p2, p3, trendData, topData] = await Promise.all([
    fetchPage(1), fetchPage(2), fetchPage(3),
    fetchTrending(),
    fetchTopRated(),
  ]);

  state.allMovies = [
    ...(p1?.results||[]),
    ...(p2?.results||[]),
    ...(p3?.results||[]),
  ];

  readURLParams();
  applyFilters();
  renderGrid();

  buildCarousel('toprated-cs-track',  topData?.results||[],   'toprated-detail',  'Top Rated');
  buildCarousel('trending-cs-track',  trendData?.results||[], 'trending-detail',  'Trending');
  buildRecentlyAdded(state.allMovies.slice(0, 12));

  wireFilters();
  wireSearch();
  wireSort();
  wireViewToggle();
  wireSearchChips();

  initReveal();

  /* URL search query */
  const urlQ = new URLSearchParams(location.search).get('q');
  if (urlQ) {
    const inp = document.getElementById('movies-search-input');
    if (inp) {
      inp.value = urlQ;
      state.query = urlQ.toLowerCase();
      applyFilters();
      renderGrid();
    }
  }
})();

/* ============================================================
   FIX NAV ACTIVE LINK
   Marks the current page link as active, and updates on click
============================================================ */
function fixNavActiveLink() {
  const currentPage = location.pathname.split('/').pop() || 'home.html';

  /* Remove all active classes first */
  document.querySelectorAll('.nav-link, .nav-mobile-link').forEach(link => {
    link.classList.remove('active');
    link.removeAttribute('aria-current');

    /* Mark current page */
    const href = link.getAttribute('href') || '';
    if (href === currentPage || (currentPage === '' && href === 'home.html')) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    }

    /* On click — update active state */
    link.addEventListener('click', function() {
      document.querySelectorAll('.nav-link, .nav-mobile-link').forEach(l => {
        l.classList.remove('active');
        l.removeAttribute('aria-current');
      });
      this.classList.add('active');
      this.setAttribute('aria-current', 'page');
    });
  });
}

/* ============================================================
   FETCH
============================================================ */
async function fetchPage(page) {
  try {
    const url = `https://api.themoviedb.org/3/discover/movie?api_key=2dca580c2a14b55200e784d157207b4d&language=en-US&sort_by=popularity.desc&page=${page}`;
    const res = await fetch(url);
    return res.ok ? res.json() : null;
  } catch { return null; }
}
async function fetchTrending() {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/trending/movie/week?api_key=2dca580c2a14b55200e784d157207b4d`);
    return res.ok ? res.json() : null;
  } catch { return null; }
}
async function fetchTopRated() {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/movie/top_rated?api_key=2dca580c2a14b55200e784d157207b4d&language=en-US&page=1`);
    return res.ok ? res.json() : null;
  } catch { return null; }
}

/* ============================================================
   URL PARAMS
============================================================ */
function readURLParams() {
  const p = new URLSearchParams(location.search);
  if (p.get('genre'))  state.genre  = p.get('genre');
  if (p.get('year'))   state.year   = p.get('year');
  if (p.get('filter')) {
    const f = p.get('filter');
    if (f === 'trending')    state.sort = 'popularity';
    if (f === 'top_rated')   state.sort = 'rating';
    if (f === 'now_playing') state.sort = 'release';
    if (f === 'upcoming')    state.sort = 'release';
  }
  if (p.get('sort')) {
    const s = p.get('sort');
    if (s === 'rating') state.sort = 'rating';
    if (s === 'recent') state.sort = 'release';
  }

  /* Sync filter chips to URL state */
  syncChips('genre',  state.genre);
  syncChips('year',   state.year);
  syncChips('rating', state.rating);

  const sortEl = document.getElementById('sort-select');
  if (sortEl) sortEl.value = state.sort;
}

/* ============================================================
   APPLY FILTERS — Genre, Year, Rating, Search all work
============================================================ */
function applyFilters() {
  let list = [...state.allMovies];

  /* Genre filter */
  if (state.genre !== 'all') {
    const gid = parseInt(state.genre, 10);
    list = list.filter(m => (m.genre_ids||[]).includes(gid));
  }

  /* Year filter */
  if (state.year !== 'all') {
    list = list.filter(m => (m.release_date||'').startsWith(state.year));
  }

  /* Rating filter */
  if (state.rating !== 'all') {
    const min = parseFloat(state.rating);
    list = list.filter(m => (m.vote_average||0) >= min);
  }

  /* Search filter */
  if (state.query) {
    const q = state.query.toLowerCase();
    list = list.filter(m =>
      m.title?.toLowerCase().includes(q) ||
      m.overview?.toLowerCase().includes(q)
    );
  }

  /* Sort */
  list.sort((a, b) => {
    if (state.sort === 'rating')  return (b.vote_average||0) - (a.vote_average||0);
    if (state.sort === 'release') return (b.release_date||'').localeCompare(a.release_date||'');
    if (state.sort === 'title')   return (a.title||'').localeCompare(b.title||'');
    return (b.popularity||0) - (a.popularity||0);
  });

  state.filtered = list;
  state.page = 1;

  /* Update results count */
  const countEl = document.getElementById('results-count-num');
  if (countEl) countEl.textContent = list.length.toLocaleString();

  renderActiveFilterTags();

  /* Show / hide empty state */
  const empty = document.getElementById('empty-state');
  const grid  = document.getElementById('movies-grid');
  if (list.length === 0) {
    if (empty) { empty.style.display = 'block'; empty.classList.add('visible'); }
    if (grid)  grid.style.display = 'none';
  } else {
    if (empty) { empty.style.display = 'none'; empty.classList.remove('visible'); }
    if (grid)  grid.style.display = '';
  }
}

/* ============================================================
   RENDER GRID
============================================================ */
function renderGrid() {
  const grid = document.getElementById('movies-grid');
  if (!grid) return;

  const start = (state.page - 1) * state.perPage;
  const page  = state.filtered.slice(start, start + state.perPage);

  if (state.view === 'list') {
    grid.className = 'movies-grid list-view';
  } else {
    grid.className = 'movies-grid';
  }

  grid.innerHTML = page.map((m, i) => buildGridCard(m, i)).join('');

  /* Stagger animation delays */
  grid.querySelectorAll('.mgc').forEach((card, i) => {
    card.style.animationDelay = (i * 0.04) + 's';
  });

  /* Wire watchlist buttons */
  grid.querySelectorAll('.mgc-wl-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      const movie = JSON.parse(btn.dataset.movie);
      const added = toggleWatchlist(movie);
      btn.classList.toggle('active', added);
      const svg = btn.querySelector('svg');
      if (svg) svg.setAttribute('fill', added ? 'currentColor' : 'none');
    });
  });

  /* Wire favourite buttons */
  grid.querySelectorAll('.mgc-fav-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      const movie = JSON.parse(btn.dataset.movie);
      const added = toggleFavourite(movie);
      btn.classList.toggle('active', added);
      const svg = btn.querySelector('svg');
      if (svg) svg.setAttribute('fill', added ? 'currentColor' : 'none');
    });
  });

  /* Wire quick view */
  grid.querySelectorAll('.mgc-qv-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault(); e.stopPropagation();
      const movie = JSON.parse(btn.dataset.movie);
      openQuickView(movie);
    });
  });

  renderPagination();
}

/* ============================================================
   BUILD GRID CARD — uses .mgc classes to match CSS
============================================================ */
function buildGridCard(movie, idx) {
  const rating = movie.vote_average?.toFixed(1) || '--';
  const year   = movie.release_date?.slice(0,4) || '--';
  const genre  = genreName(movie.genre_ids);
  const inWL   = isInWatchlist(movie.id);
  const movieJ = JSON.stringify({
    id: movie.id, title: movie.title,
    vote_average: movie.vote_average,
    release_date: movie.release_date,
    genre_ids: movie.genre_ids,
    overview: movie.overview,
    poster_path: movie.poster_path,
  }).replace(/"/g, '&quot;');

  /* LIST VIEW */
  if (state.view === 'list') {
    return `
      <div class="mgc" role="listitem">
        <div class="mgc-poster" style="width:80px;flex-shrink:0;">
          <img src="${getPoster(movie.id, movie.poster_path)}" alt="${escHtml(movie.title)}" loading="lazy">
          <div class="mgc-rating">
            <svg viewBox="0 0 24 24" fill="#f4c542" width="10" height="10"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            ${rating}
          </div>
        </div>
        <div class="mgc-info" style="flex:1;padding:8px 0;">
          <a href="movie-details.html?id=${movie.id}" class="mgc-title">${escHtml(movie.title)}</a>
          <div class="mgc-meta-row">
            <span>${year}</span>
            ${genre ? `<span class="mgc-genre-tag">${genre}</span>` : ''}
          </div>
          <p style="font-size:var(--text-xs);color:var(--white-30);margin-top:6px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.5">${escHtml(movie.overview||'')}</p>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:8px;">
          <a href="movie-details.html?id=${movie.id}" class="mgc-play-btn" style="position:static;transform:none;opacity:1;margin-bottom:0;width:40px;height:40px;" aria-label="Watch ${escHtml(movie.title)}">
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M8 5v14l11-7z"/></svg>
          </a>
          <div style="display:flex;gap:6px;">
            <button class="mgc-action-btn mgc-wl-btn ${inWL?'active':''}" data-movie="${movieJ}" aria-label="Watchlist">
              <svg viewBox="0 0 24 24" fill="${inWL?'currentColor':'none'}" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
            </button>
            <button class="mgc-action-btn mgc-fav-btn" data-movie="${movieJ}" aria-label="Favourite">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </button>
          </div>
        </div>
      </div>`;
  }

  /* GRID VIEW */
  return `
    <div class="mgc" role="listitem">
      <div class="mgc-poster">
        <img src="${getPoster(movie.id, movie.poster_path)}" alt="${escHtml(movie.title)}" loading="lazy">
        <div class="mgc-rating">
          <svg viewBox="0 0 24 24" fill="#f4c542" width="10" height="10"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          ${rating}
        </div>
        <div class="mgc-gradient"></div>
        <div class="mgc-actions">
          <a href="movie-details.html?id=${movie.id}" class="mgc-play-btn" aria-label="Watch ${escHtml(movie.title)}">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M8 5v14l11-7z"/></svg>
          </a>
          <div class="mgc-action-row">
            <button class="mgc-action-btn mgc-wl-btn ${inWL?'active':''}" data-movie="${movieJ}" aria-label="Watchlist">
              <svg viewBox="0 0 24 24" fill="${inWL?'currentColor':'none'}" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
            </button>
            <button class="mgc-action-btn mgc-fav-btn" data-movie="${movieJ}" aria-label="Favourite">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </button>
            <button class="mgc-action-btn mgc-qv-btn" data-movie="${movieJ}" aria-label="Quick view">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </button>
          </div>
        </div>
      </div>
      <div class="mgc-info">
        <a href="movie-details.html?id=${movie.id}" class="mgc-title">${escHtml(movie.title)}</a>
        <div class="mgc-meta-row">
          <span>${year}</span>
          ${genre ? `<span class="mgc-genre-tag">${genre}</span>` : ''}
        </div>
      </div>
    </div>`;
}

/* ============================================================
   PAGINATION — uses .pag-btn (matches CSS)
============================================================ */
function renderPagination() {
  const wrap = document.getElementById('pagination');
  if (!wrap) return;

  const total = Math.ceil(state.filtered.length / state.perPage);
  if (total <= 1) { wrap.innerHTML = ''; return; }

  const p = state.page;
  let pages = [];
  if (total <= 7) {
    pages = Array.from({length: total}, (_, i) => i + 1);
  } else {
    pages = [1];
    if (p > 3) pages.push('…');
    for (let i = Math.max(2, p-1); i <= Math.min(total-1, p+1); i++) pages.push(i);
    if (p < total - 2) pages.push('…');
    pages.push(total);
  }

  wrap.innerHTML = `
    <button class="pag-btn" id="pag-prev" aria-label="Previous page" ${p===1?'disabled':''}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
    </button>
    ${pages.map(pg => pg === '…'
      ? `<span class="pag-ellipsis">…</span>`
      : `<button class="pag-btn ${pg===p?'active':''}" data-pg="${pg}">${pg}</button>`
    ).join('')}
    <button class="pag-btn" id="pag-next" aria-label="Next page" ${p===total?'disabled':''}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
    </button>`;

  wrap.querySelectorAll('[data-pg]').forEach(btn => {
    btn.addEventListener('click', () => {
      state.page = parseInt(btn.dataset.pg, 10);
      renderGrid();
      scrollToGrid();
    });
  });
  document.getElementById('pag-prev')?.addEventListener('click', () => {
    if (state.page > 1) { state.page--; renderGrid(); scrollToGrid(); }
  });
  document.getElementById('pag-next')?.addEventListener('click', () => {
    if (state.page < total) { state.page++; renderGrid(); scrollToGrid(); }
  });
}

function scrollToGrid() {
  window.scrollTo({ top: (document.getElementById('movies-grid')?.offsetTop||0) - 120, behavior: 'smooth' });
}

/* ============================================================
   ACTIVE FILTER TAGS
============================================================ */
function renderActiveFilterTags() {
  const wrap = document.getElementById('active-filters-wrap');
  if (!wrap) return;

  const tags = [];
  if (state.genre  !== 'all') tags.push({ label: GENRE_MAP[state.genre] || state.genre, key: 'genre' });
  if (state.year   !== 'all') tags.push({ label: state.year, key: 'year' });
  if (state.rating !== 'all') tags.push({ label: `${state.rating}+ ★`, key: 'rating' });
  if (state.query)             tags.push({ label: `"${state.query}"`, key: 'query' });

  wrap.innerHTML = tags.map(t => `
    <div class="active-filter-tag" role="listitem">
      ${escHtml(t.label)}
      <button class="active-filter-remove" onclick="clearFilter('${t.key}')" aria-label="Remove ${escHtml(t.label)} filter">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="10" height="10">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>`).join('');
}

window.clearFilter = function(key) {
  if (key === 'genre')  { state.genre  = 'all'; syncChips('genre',  'all'); }
  if (key === 'year')   { state.year   = 'all'; syncChips('year',   'all'); }
  if (key === 'rating') { state.rating = 'all'; syncChips('rating', 'all'); }
  if (key === 'query')  {
    state.query = '';
    const inp = document.getElementById('movies-search-input');
    if (inp) inp.value = '';
    closeSuggestions();
  }
  applyFilters(); renderGrid();
};

function syncChips(filter, value) {
  document.querySelectorAll(`[data-filter="${filter}"]`).forEach(btn => {
    btn.classList.toggle('active', btn.dataset.value === value);
  });
}

/* ============================================================
   WIRE FILTERS — clicking Year/Genre/Rating actually works
============================================================ */
function wireFilters() {
  document.querySelectorAll('.filter-chip[data-filter]').forEach(btn => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;
      const value  = btn.dataset.value;

      /* Remove active from siblings in same filter group */
      document.querySelectorAll(`[data-filter="${filter}"]`).forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      /* Update state */
      state[filter] = value;
      state.page    = 1;

      applyFilters();
      renderGrid();
    });
  });

  /* Empty state reset */
  document.getElementById('empty-reset-btn')?.addEventListener('click', resetAllFilters);
}

function resetAllFilters() {
  state.genre  = 'all';
  state.year   = 'all';
  state.rating = 'all';
  state.query  = '';
  state.page   = 1;

  const inp = document.getElementById('movies-search-input');
  if (inp) inp.value = '';
  closeSuggestions();

  document.querySelectorAll('.filter-chip[data-filter]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.value === 'all');
  });
  applyFilters();
  renderGrid();
}

/* ============================================================
   WIRE SEARCH + AUTOCOMPLETE
   Type "op" → shows movies whose title STARTS WITH "op" first,
   then contains "op" — highlighted in gold
============================================================ */
function wireSearch() {
  const input    = document.getElementById('movies-search-input');
  const clearBtn = document.getElementById('movies-search-clear');
  const suggest  = document.getElementById('movies-suggestions');
  if (!input) return;

  let debounceTimer;

  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const q = input.value.trim();

    /* Show/hide clear button */
    if (clearBtn) clearBtn.classList.toggle('visible', q.length > 0);

    debounceTimer = setTimeout(() => {
      state.query = q.toLowerCase();
      applyFilters();
      renderGrid();

      if (q.length < 1) { closeSuggestions(); return; }

      /* ── Autocomplete logic ──
         Priority 1: title STARTS with query
         Priority 2: title CONTAINS query (but doesn't start with it)
         Priority 3: overview contains query
      */
      const ql = q.toLowerCase();
      const startsWith = [];
      const contains   = [];
      const overviewHit = [];

      state.allMovies.forEach(m => {
        const title = (m.title||'').toLowerCase();
        if (title.startsWith(ql)) {
          startsWith.push(m);
        } else if (title.includes(ql)) {
          contains.push(m);
        } else if ((m.overview||'').toLowerCase().includes(ql)) {
          overviewHit.push(m);
        }
      });

      /* Merge and cap at 7 */
      const hits = [...startsWith, ...contains, ...overviewHit].slice(0, 7);

      if (!suggest) return;

      if (hits.length === 0) {
        suggest.innerHTML = `<div class="suggest-empty">No movies found for "<strong>${escHtml(q)}</strong>"</div>`;
        suggest.classList.add('visible');
        suggest.style.display = 'block';
        return;
      }

      suggest.innerHTML = hits.map(m => {
        const title = m.title || '';
        /* Highlight matched part in gold */
        const idx = title.toLowerCase().indexOf(ql);
        let highlightedTitle = escHtml(title);
        if (idx !== -1) {
          highlightedTitle =
            escHtml(title.slice(0, idx)) +
            `<em>${escHtml(title.slice(idx, idx + q.length))}</em>` +
            escHtml(title.slice(idx + q.length));
        }

        return `
          <a href="movie-details.html?id=${m.id}" class="suggest-item" aria-label="${escHtml(title)}">
            <img src="${getPoster(m.id, m.poster_path)}" alt="${escHtml(title)}" loading="lazy">
            <div class="suggest-item-info">
              <div class="suggest-item-title">${highlightedTitle}</div>
              <div class="suggest-item-meta">${m.release_date?.slice(0,4)||'--'} · ${genreName(m.genre_ids)||'Film'}</div>
            </div>
            <div class="suggest-item-rating">★ ${m.vote_average?.toFixed(1)||'--'}</div>
          </a>`;
      }).join('');

      suggest.classList.add('visible');
      suggest.style.display = 'block';
    }, 200);
  });

  /* Clear button */
  clearBtn?.addEventListener('click', () => {
    input.value  = '';
    state.query  = '';
    if (clearBtn) clearBtn.classList.remove('visible');
    closeSuggestions();
    applyFilters();
    renderGrid();
    input.focus();
  });

  /* Close on outside click */
  document.addEventListener('click', e => {
    const bar = document.getElementById('movies-search-bar');
    if (bar && !bar.contains(e.target)) closeSuggestions();
  });

  /* Keyboard: Escape closes */
  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') { closeSuggestions(); input.blur(); }
  });
}

function closeSuggestions() {
  const suggest = document.getElementById('movies-suggestions');
  if (suggest) { suggest.innerHTML = ''; suggest.classList.remove('visible'); suggest.style.display = 'none'; }
}

/* ============================================================
   WIRE SORT
============================================================ */
function wireSort() {
  const sel = document.getElementById('sort-select');
  sel?.addEventListener('change', () => {
    state.sort = sel.value;
    applyFilters();
    renderGrid();
  });
}

/* ============================================================
   WIRE VIEW TOGGLE
============================================================ */
function wireViewToggle() {
  const gridBtn = document.getElementById('grid-view-btn');
  const listBtn = document.getElementById('list-view-btn');

  gridBtn?.addEventListener('click', () => {
    state.view = 'grid';
    gridBtn.classList.add('active'); gridBtn.setAttribute('aria-pressed', 'true');
    listBtn?.classList.remove('active'); listBtn?.setAttribute('aria-pressed', 'false');
    renderGrid();
  });
  listBtn?.addEventListener('click', () => {
    state.view = 'list';
    listBtn.classList.add('active'); listBtn.setAttribute('aria-pressed', 'true');
    gridBtn?.classList.remove('active'); gridBtn?.setAttribute('aria-pressed', 'false');
    renderGrid();
  });
}

/* ============================================================
   WIRE SEARCH CHIPS
============================================================ */
function wireSearchChips() {
  document.querySelectorAll('.search-chip[data-query]').forEach(chip => {
    chip.addEventListener('click', () => {
      const q = chip.dataset.query;
      const inp = document.getElementById('movies-search-input');
      if (inp) {
        inp.value = q;
        inp.dispatchEvent(new Event('input'));
        inp.focus();
      }
    });
  });
}

/* ============================================================
   BUILD PREMIUM CAROUSEL
============================================================ */
function buildCarousel(trackId, movies, detailId, label) {
  const track  = document.getElementById(trackId);
  const detail = document.getElementById(detailId);
  if (!track || !movies.length) return;

  let activeIdx = 0;

  track.innerHTML = movies.slice(0, 15).map((m, i) => {
    const rating = m.vote_average?.toFixed(1) || '--';
    return `
      <div class="cs-card ${i===0?'cs-active':''}" data-idx="${i}" role="listitem" tabindex="0" aria-label="${escHtml(m.title||'')}">
        <div class="cs-card-poster">
          <span class="cs-card-rank">${String(i+1).padStart(2,'0')}</span>
          <img src="${getPoster(m.id, m.poster_path)}" alt="${escHtml(m.title||'')}" loading="${i<3?'eager':'lazy'}">
          <div class="cs-card-badge">
            <svg viewBox="0 0 24 24" fill="#f4c542" width="9" height="9"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            ${rating}
          </div>
          <div class="cs-card-hover">
            <a href="movie-details.html?id=${m.id}" class="cs-card-play" aria-label="Watch ${escHtml(m.title||'')}">
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18"><path d="M8 5v14l11-7z"/></svg>
            </a>
          </div>
        </div>
        <div class="cs-card-info">
          <div class="cs-card-title">${escHtml(m.title||'')}</div>
          <div class="cs-card-year">${m.release_date?.slice(0,4)||'--'}</div>
        </div>
      </div>`;
  }).join('');

  /* Update detail panel */
  function updateDetail(idx) {
    if (!detail) return;
    const m = movies[idx];
    const set = (sel, val) => { const el = detail.querySelector(sel); if (el) el.textContent = val; };
    detail.classList.add('cs-transitioning');
    setTimeout(() => {
      set('.cs-detail-eyebrow', `${label} #${idx+1}`);
      set('.cs-detail-title',   m.title||'');
      set('.cs-rating-val',     m.vote_average?.toFixed(1)||'--');
      set('.cs-year-val',       m.release_date?.slice(0,4)||'--');
      set('.cs-detail-desc',    m.overview||'');
      set('.cs-genre-val',      genreNames(m.genre_ids)[0]||'');
      const watchBtn = detail.querySelector('.cs-watch-btn');
      if (watchBtn) watchBtn.href = `movie-details.html?id=${m.id}`;
      const wlBtn = detail.querySelector('.cs-wl-btn');
      if (wlBtn) wlBtn.onclick = () => toggleWatchlist(m);
      detail.classList.remove('cs-transitioning');
    }, 200);
  }

  updateDetail(0);

  track.querySelectorAll('.cs-card').forEach((card, i) => {
    card.addEventListener('click', () => {
      track.querySelectorAll('.cs-card').forEach(c => c.classList.remove('cs-active'));
      card.classList.add('cs-active');
      activeIdx = i;
      updateDetail(i);
    });
  });

  /* Prev / Next */
  const stage   = track.closest('.cs-stage');
  const prevBtn = stage?.querySelector('.cs-btn-prev');
  const nextBtn = stage?.querySelector('.cs-btn-next');
  prevBtn?.addEventListener('click', () => track.scrollBy({ left: -210, behavior: 'smooth' }));
  nextBtn?.addEventListener('click', () => track.scrollBy({ left:  210, behavior: 'smooth' }));
  initCarouselDrag(track);
}

/* ============================================================
   RECENTLY ADDED
============================================================ */
function buildRecentlyAdded(movies) {
  const track = document.getElementById('recently-track');
  if (!track || !movies.length) return;

  track.innerHTML = movies.map(m => {
    const rating = m.vote_average?.toFixed(1)||'--';
    const year   = m.release_date?.slice(0,4)||'--';
    return `
      <div class="rc-card" role="listitem">
        <a href="movie-details.html?id=${m.id}" class="rc-card-link" aria-label="${escHtml(m.title||'')}">
          <div class="rc-poster">
            <img src="${getPoster(m.id, m.poster_path)}" alt="${escHtml(m.title||'')}" loading="lazy">
            <div class="rc-badge">
              <svg viewBox="0 0 24 24" fill="#f4c542" width="9" height="9"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              ${rating}
            </div>
            <div class="rc-hover">
              <svg viewBox="0 0 24 24" fill="currentColor" width="28" height="28"><path d="M8 5v14l11-7z"/></svg>
            </div>
          </div>
          <div class="rc-info">
            <div class="rc-title">${escHtml(m.title||'')}</div>
            <div class="rc-year">${year}</div>
          </div>
        </a>
      </div>`;
  }).join('');

  initCarouselDrag(track);
}

/* ============================================================
   QUICK VIEW MODAL
============================================================ */
function openQuickView(movie) {
  const modal   = document.getElementById('quickview-modal');
  const content = document.getElementById('quickview-content');
  if (!modal || !content) return;

  const rating = movie.vote_average?.toFixed(1)||'--';
  const year   = movie.release_date?.slice(0,4)||'--';
  const genres = genreNames(movie.genre_ids).join(', ');

  content.innerHTML = `
    <div style="display:flex;gap:24px;align-items:flex-start">
      <img src="${getPoster(movie.id, movie.poster_path)}" alt="${escHtml(movie.title||'')}"
           style="width:120px;height:180px;object-fit:cover;border-radius:12px;flex-shrink:0;border:1px solid var(--glass-border)">
      <div style="flex:1;min-width:0">
        <p style="font-size:var(--text-xs);font-weight:700;letter-spacing:var(--tracking-widest);text-transform:uppercase;color:var(--gold);margin-bottom:8px">${escHtml(genres||'Film')}</p>
        <h3 style="font-family:var(--font-display);font-size:var(--text-3xl);letter-spacing:var(--tracking-wide);color:var(--white);margin-bottom:12px;line-height:1">${escHtml(movie.title||'')}</h3>
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px;font-size:var(--text-sm);color:var(--white-60)">
          <span style="color:var(--rating-star);font-weight:700">★ ${rating}</span>
          <span>${year}</span>
        </div>
        <p style="font-size:var(--text-sm);color:var(--white-60);line-height:1.7;margin-bottom:20px;display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden">${escHtml(movie.overview||'No description available.')}</p>
        <div style="display:flex;gap:12px;flex-wrap:wrap">
          <a href="movie-details.html?id=${movie.id}" class="btn-primary" style="font-size:var(--text-sm);padding:10px 20px">
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M8 5v14l11-7z"/></svg>
            Watch Now
          </a>
          <button class="btn-ghost" onclick="toggleWatchlist(${JSON.stringify(movie).replace(/"/g,"'")})" style="font-size:var(--text-sm);padding:10px 20px">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
            Watchlist
          </button>
        </div>
      </div>
    </div>`;

  modal.classList.add('active');
}

/* ============================================================
   PARTICLES
============================================================ */
function spawnParticles() {
  const container = document.getElementById('header-particles');
  if (!container) return;
  for (let i = 0; i < 24; i++) {
    const span = document.createElement('span');
    span.className = 'particle';
    span.style.cssText = `left:${Math.random()*100}%;top:${Math.random()*100}%;--dur:${4+Math.random()*6}s;--delay:${Math.random()*5}s;`;
    container.appendChild(span);
  }
}

/* ============================================================
   CAROUSEL DRAG
============================================================ */
function initCarouselDrag(track) {
  if (!track) return;
  let isDown = false, startX = 0, scrollLeft = 0;
  track.addEventListener('mousedown', e => {
    isDown = true; startX = e.pageX - track.offsetLeft; scrollLeft = track.scrollLeft;
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

/* ============================================================
   SCROLL REVEAL
============================================================ */
function initReveal() {
  const revealEls = document.querySelectorAll('.reveal');
  if (!revealEls.length) return;
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); }
    });
  }, { threshold: 0.1 });
  revealEls.forEach(el => observer.observe(el));
}

/* ============================================================
   WATCHLIST / FAVOURITES (localStorage helpers)
   These work even without utils.js
============================================================ */
function isInWatchlist(id) {
  try {
    const wl = JSON.parse(localStorage.getItem('cineverse_watchlist') || '[]');
    return wl.some(m => m.id === id);
  } catch { return false; }
}
function toggleWatchlist(movie) {
  try {
    let wl = JSON.parse(localStorage.getItem('cineverse_watchlist') || '[]');
    const idx = wl.findIndex(m => m.id === movie.id);
    if (idx !== -1) { wl.splice(idx, 1); }
    else { wl.push(movie); }
    localStorage.setItem('cineverse_watchlist', JSON.stringify(wl));
    return idx === -1; // true = added
  } catch { return false; }
}
function toggleFavourite(movie) {
  try {
    let fav = JSON.parse(localStorage.getItem('cineverse_favourites') || '[]');
    const idx = fav.findIndex(m => m.id === movie.id);
    if (idx !== -1) { fav.splice(idx, 1); }
    else { fav.push(movie); }
    localStorage.setItem('cineverse_favourites', JSON.stringify(fav));
    return idx === -1;
  } catch { return false; }
}

/* ============================================================
   HELPER — escape HTML to prevent XSS
============================================================ */
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* ============================================================
   SEARCH OVERLAY (navbar search tags)
============================================================ */
document.querySelectorAll('.search-tag').forEach(tag => {
  tag.addEventListener('click', () => {
    const input = document.getElementById('search-overlay-input');
    if (input) { input.value = tag.textContent; input.dispatchEvent(new Event('input')); }
  });
});