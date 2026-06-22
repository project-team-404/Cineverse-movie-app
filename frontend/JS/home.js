/* ============================================================
   CINEVERSE — HOME PAGE CONTROLLER
   ============================================================ */

/* ── HERO DATA ── */
let heroMovies  = [];
let heroIndex   = 0;
let heroTimer   = null;

async function initHero() {
  try {
    const data = await TMDB.trending('week');
    if (!data?.results?.length) return;

    heroMovies = data.results.slice(0, 5);

    // Populate slides
    const backdrop = document.querySelector('.hero-backdrop');
    const thumbsWrap = document.querySelector('.hero-thumbs');
    const indicators = document.querySelector('.hero-indicators');

    heroMovies.forEach((movie, i) => {
      // Backdrop slide
      const slide = document.createElement('div');
      slide.className = `hero-slide${i === 0 ? ' active' : ''}`;
      const img = document.createElement('img');
      img.src = TMDB.backdropURL(movie.backdrop_path, 'backdrop_lg') || FALLBACK_BACKDROPS[i % 3];
      img.alt = movie.title;
      img.width = 1920; img.height = 1080;
      slide.appendChild(img);
      backdrop.appendChild(slide);

      // Thumbnail
      if (thumbsWrap) {
        const thumb = document.createElement('div');
        thumb.className = `hero-thumb${i === 0 ? ' active' : ''}`;
        thumb.dataset.index = i;
        thumb.setAttribute('aria-label', `View ${movie.title}`);
        thumb.setAttribute('role', 'button');
        thumb.setAttribute('tabindex', '0');
        const tImg = document.createElement('img');
        tImg.src = TMDB.posterURL(movie.poster_path, 'poster_sm') || FALLBACK_POSTER;
        tImg.alt = movie.title;
        thumb.appendChild(tImg);
        thumb.addEventListener('click', () => goToHeroSlide(i));
        thumb.addEventListener('keydown', e => { if (e.key === 'Enter') goToHeroSlide(i); });
        thumbsWrap.appendChild(thumb);
      }

      // Dot indicator
      if (indicators) {
        const dot = document.createElement('div');
        dot.className = `hero-dot${i === 0 ? ' active' : ''}`;
        dot.dataset.index = i;
        dot.setAttribute('aria-label', `Slide ${i + 1}`);
        dot.addEventListener('click', () => goToHeroSlide(i));
        indicators.appendChild(dot);
      }
    });

    // Fill first slide content
    renderHeroContent(heroMovies[0]);
    startHeroAutoplay();
  } catch (err) {
    console.warn('initHero failed (TMDB unavailable), using local slides:', err.message);
    // home-enhanced.js will handle local slides — nothing to do here
  }
}

function renderHeroContent(movie) {
  const genres = (movie.genre_ids || [])
    .slice(0, 3)
    .map(id => `<span class="hero-genre-tag">${TMDB.GENRES[id] || ''}</span>`)
    .filter(Boolean)
    .join('');

  const year    = fmtYear(movie.release_date);
  const rating  = fmtRating(movie.vote_average);
  const title   = movie.title || '';
  // Accent last word of title
  const words   = title.split(' ');
  const last    = words.pop();
  const accented = words.join(' ') + (words.length ? ' <span class="title-accent">' + last + '</span>' : '<span class="title-accent">' + last + '</span>');

  document.querySelector('.hero-title').innerHTML = accented;
  document.querySelector('.hero-desc').textContent = (movie.overview || '').slice(0, 180) + (movie.overview?.length > 180 ? '…' : '');
  document.querySelector('.hero-rating-score').textContent = rating;
  document.querySelector('.hero-year').textContent = year;
  document.querySelector('.hero-genres').innerHTML = genres;

  // CTA links
  const playBtn = document.querySelector('.hero-play-btn');
  const moreBtn = document.querySelector('.hero-more-btn');
  if (playBtn) playBtn.dataset.id = movie.id;
  if (moreBtn) moreBtn.href = `movie-details.html?id=${movie.id}`;
}

function goToHeroSlide(index) {
  const slides     = $$('.hero-slide');
  const thumbs     = $$('.hero-thumb');
  const dots       = $$('.hero-dot');
  if (!slides[index]) return;

  slides[heroIndex]?.classList.remove('active');
  thumbs[heroIndex]?.classList.remove('active');
  dots[heroIndex]?.classList.remove('active');

  heroIndex = index;
  slides[heroIndex]?.classList.add('active');
  thumbs[heroIndex]?.classList.add('active');
  dots[heroIndex]?.classList.add('active');

  renderHeroContent(heroMovies[heroIndex]);
  resetHeroAutoplay();
}

function startHeroAutoplay() {
  heroTimer = setInterval(() => {
    goToHeroSlide((heroIndex + 1) % heroMovies.length);
  }, 6000);
}

function resetHeroAutoplay() {
  clearInterval(heroTimer);
  startHeroAutoplay();
}

/* ── CAROUSELS ── */
async function loadTrendingSection() {
  const target = document.getElementById('trending-track');
  if (!target) return;

  const data = await TMDB.trending('week');
  if (!data?.results) { target.innerHTML = '<p class="load-error">Could not load movies.</p>'; return; }

  target.innerHTML = data.results.slice(0, 16).map(m => buildMovieCard(m)).join('');
  bindCardEvents(target);
  initCarouselArrows(target.closest('.carousel-wrap'));
}

async function loadTopRatedSection() {
  const target = document.getElementById('toprated-track');
  if (!target) return;
  const data = await TMDB.topRated();
  if (!data?.results) return;
  target.innerHTML = data.results.slice(0, 16).map(m => buildMovieCard(m, 'featured')).join('');
  bindCardEvents(target);
  initCarouselArrows(target.closest('.carousel-wrap'));
}

async function loadNowPlayingSection() {
  const target = document.getElementById('nowplaying-track');
  if (!target) return;
  const data = await TMDB.nowPlaying();
  if (!data?.results) return;
  target.innerHTML = data.results.slice(0, 14).map(m => buildMovieCard(m)).join('');
  bindCardEvents(target);
  initCarouselArrows(target.closest('.carousel-wrap'));
}

async function loadUpcomingSection() {
  const target = document.getElementById('upcoming-track');
  if (!target) return;
  const data = await TMDB.upcoming();
  if (!data?.results) return;
  target.innerHTML = data.results.slice(0, 14).map(m => buildMovieCard(m, 'wide')).join('');
  bindCardEvents(target);
  initCarouselArrows(target.closest('.carousel-wrap'));
}

async function loadFeaturedSection() {
  const mainArea    = document.querySelector('.featured-main');
  const sidebarArea = document.querySelector('.featured-sidebar');
  if (!mainArea || !sidebarArea) return;

  const data = await TMDB.popular();
  if (!data?.results?.length) return;

  const movies = data.results.slice(0, 5);

  // Build sidebar
  sidebarArea.innerHTML = movies.map((m, i) => buildFeaturedSidebarCard(m, i + 1)).join('');

  // Show first
  showFeaturedMain(movies[0]);

  // Mark first active
  sidebarArea.querySelector('.featured-sidebar-card')?.classList.add('active');

  // Sidebar click
  sidebarArea.addEventListener('click', e => {
    const card = e.target.closest('.featured-sidebar-card');
    if (!card) return;
    $$('.featured-sidebar-card', sidebarArea).forEach(c => c.classList.remove('active'));
    card.classList.add('active');
    const rank = parseInt(card.dataset.rank) - 1;
    showFeaturedMain(movies[rank]);
  });

  // Lazy images
  lazyLoadImages();
}

function showFeaturedMain(movie) {
  const mainArea = document.querySelector('.featured-main');
  const backdrop = TMDB.backdropURL(movie.backdrop_path, 'backdrop_md') || FALLBACK_BACKDROPS[0];
  mainArea.innerHTML = `
    <img src="${backdrop}" alt="${movie.title}" loading="eager">
    <div class="featured-main-overlay"></div>
    <div class="featured-main-content">
      <span class="featured-main-tag">⭐ Featured</span>
      <h2 class="featured-main-title">${movie.title}</h2>
      <p class="featured-main-desc">${(movie.overview || '').slice(0, 140)}…</p>
      <div style="display:flex;gap:12px;margin-top:16px">
        <a href="movie-details.html?id=${movie.id}" class="btn-primary" style="font-size:0.875rem;padding:10px 24px">
          ${Icons.play} Watch Now
        </a>
        <button class="btn-ghost" style="font-size:0.875rem;padding:10px 24px" onclick="Watchlist.add(${JSON.stringify({id:movie.id,title:movie.title,poster_path:movie.poster_path,vote_average:movie.vote_average,release_date:movie.release_date,genre_ids:movie.genre_ids||[]}).replace(/"/g,'&quot;')})">
          ${Icons.plus} Watchlist
        </button>
      </div>
    </div>
    <div class="featured-play-btn">${Icons.play}</div>`;
  mainArea.href = `movie-details.html?id=${movie.id}`;
  initMagnetic();
}

async function loadContinueWatching() {
  const track = document.getElementById('cw-track');
  if (!track) return;

  let history = WatchHistory.get();

  // If no history, seed with popular movies
  if (history.length < 4) {
    const data = await TMDB.popular();
    if (data?.results) {
      data.results.slice(0, 6).forEach(m => WatchHistory.add(m));
      history = WatchHistory.get();
    }
  }

  if (!history.length) {
    document.getElementById('section-cw')?.remove();
    return;
  }

  track.innerHTML = history.slice(0, 10).map(m => buildCWCard(m)).join('');
  bindCardEvents(track);
  initCarouselArrows(track.closest('.carousel-wrap'));
}

async function loadRecommended() {
  const track = document.getElementById('recommended-track');
  if (!track) return;

  // Simulate personalized — use top rated for now
  const data = await TMDB.topRated();
  if (!data?.results) return;

  // Add rec score to cards (overlaid via CSS)
  track.innerHTML = data.results.slice(5, 20).map(m => {
    const score = Math.floor(Math.random() * 20 + 78);
    const card  = buildMovieCard(m);
    return card.replace('</div>\n  </article>',
      `<span class="rec-score" style="margin:4px 4px 0;font-size:10px">▶ ${score}% Match</span>
      </div>\n  </article>`);
  }).join('');
  bindCardEvents(track);
  initCarouselArrows(track.closest('.carousel-wrap'));
}

function loadGenreGrid() {
  const grid = document.getElementById('genre-grid');
  if (!grid) return;
  const genreIds = [28, 35, 27, 878, 18, 53, 10749, 80, 12, 16];
  grid.innerHTML = genreIds.map(id => buildGenreCard(id)).join('');
}

/* ── SEARCH ── */
function initSearch() {
  const input = document.getElementById('search-overlay-input');
  if (!input) return;

  let searchTimer;
  const resultsEl = document.getElementById('search-live-results');

  input.addEventListener('input', () => {
    clearTimeout(searchTimer);
    const q = input.value.trim();
    if (!q) { if (resultsEl) resultsEl.innerHTML = ''; return; }
    searchTimer = setTimeout(async () => {
      const data = await TMDB.search(q);
      if (!data?.results || !resultsEl) return;
      resultsEl.innerHTML = data.results.slice(0, 6).map(m => `
        <a href="movie-details.html?id=${m.id}" class="search-result-item" style="
          display:flex;align-items:center;gap:12px;padding:10px 12px;
          border-radius:10px;cursor:pointer;transition:background 0.2s;
        " onmouseover="this.style.background='rgba(255,255,255,0.05)'" onmouseout="this.style.background=''"
        >
          <img src="${TMDB.posterURL(m.poster_path, 'poster_sm') || FALLBACK_POSTER}"
               alt="${m.title}" width="32" height="48"
               style="width:32px;height:48px;object-fit:cover;border-radius:4px;flex-shrink:0">
          <div>
            <div style="font-size:0.9rem;font-weight:600;color:#fff">${m.title}</div>
            <div style="font-size:0.75rem;color:rgba(255,255,255,0.4)">${fmtYear(m.release_date)} · ${fmtRating(m.vote_average)} ★</div>
          </div>
        </a>`
      ).join('');
    }, 400);
  });
}

/* ── STATS BANNER (cinematic numbers) ── */
function initStatsBanner() {
  const banner = document.getElementById('stats-banner');
  if (!banner) return;

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      $$('.count-up', banner).forEach(el => {
        countUp(el, parseInt(el.dataset.target));
      });
      io.unobserve(entry.target);
    });
  }, { threshold: 0.5 });
  io.observe(banner);
}

/* ── INIT ── */
async function init() {
  // ── Hide loading screen FIRST — before any async work ──
  hideLoadingScreen();

  // Core setup (synchronous — safe to run immediately)
  initNavbar();
  initHeroParallax();
  initReveal();
  lazyLoadImages();
  initSearch();

  // Load hero + featured in parallel (non-blocking for rest of page)
  Promise.all([
    initHero(),
    loadFeaturedSection(),
  ]).catch(err => console.warn('Hero/Featured load error:', err));

  // Lower-priority sections — fire and forget, errors don't block anything
  loadTrendingSection();
  loadTopRatedSection();
  loadNowPlayingSection();
  loadUpcomingSection();
  loadContinueWatching();
  loadRecommended();
  loadGenreGrid();
  initStatsBanner();
  initMagnetic();
}

document.addEventListener('DOMContentLoaded', init);