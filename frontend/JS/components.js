/* ============================================================
   CINEVERSE — COMPONENT BUILDERS
   ============================================================ */

/* ── SVG ICONS ── */
const Icons = {
  play: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 5v14M5 12h14"/></svg>`,
  heart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
  heartFill: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`,
  star: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`,
  info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
  arrowRight: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>`,
  arrowLeft: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  x: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  bell: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
  bookmark: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`,
  bookmarkFill: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`,
  globe: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  chevronDown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>`,
};

/* ── SKELETON CARDS ── */
function skeletonCards(count = 6, variant = '') {
  return Array.from({ length: count }, () =>
    `<div class="movie-card-skeleton movie-card${variant ? '-' + variant : ''} skeleton-wrap">
       <div class="skeleton skeleton-poster"></div>
       <div class="skeleton skeleton-title"></div>
       <div class="skeleton skeleton-year"></div>
     </div>`
  ).join('');
}

/* ── MOVIE CARD ── */
function buildMovieCard(movie, variant = '') {
  const poster = TMDB.posterURL(movie.poster_path, 'poster_md') || FALLBACK_POSTER;
  const year   = fmtYear(movie.release_date);
  const rating = fmtRating(movie.vote_average);
  const inWL   = Watchlist.has(movie.id);
  const inFav  = Favorites.has(movie.id);
  const genres = genreNames(movie.genre_ids || (movie.genres?.map(g => g.id)));

  const extraClass = variant ? `movie-card-${variant}` : '';

  return `
  <article class="movie-card ${extraClass}" 
           data-id="${movie.id}" 
           role="article" 
           tabindex="0"
           aria-label="${movie.title}">
    <div class="movie-card-poster">
      <img class="lazy" 
           src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 2 3'%3E%3C/svg%3E"
           data-src="${poster}" 
           alt="${movie.title} poster"
           width="342" height="513"
           loading="lazy">
      
      <div class="movie-card-rating" aria-label="Rating ${rating}">
        ${Icons.star} ${rating}
      </div>
      ${movie.vote_average >= 8.0 ? '<div class="movie-card-quality">TOP</div>' : ''}
      
      <div class="movie-card-overlay" aria-hidden="true">
        <div class="movie-card-actions">
          <button class="card-action-btn wl-btn ${inWL ? 'active' : ''}" 
                  data-id="${movie.id}" 
                  aria-label="${inWL ? 'Remove from' : 'Add to'} Watchlist"
                  title="Watchlist">
            ${inWL ? Icons.bookmarkFill : Icons.bookmark}
          </button>
          <button class="card-action-btn fav-btn ${inFav ? 'active' : ''}" 
                  data-id="${movie.id}"
                  aria-label="${inFav ? 'Remove from' : 'Add to'} Favorites"
                  title="Favorite">
            ${inFav ? Icons.heartFill : Icons.heart}
          </button>
          <button class="card-action-btn card-play-btn" 
                  data-id="${movie.id}"
                  aria-label="Play ${movie.title}"
                  title="Play">
            ${Icons.play}
          </button>
        </div>
      </div>
    </div>
    <div class="movie-card-info">
      <h3 class="movie-card-title">${movie.title}</h3>
      <p class="movie-card-year">${year}${genres ? ' · ' + genres : ''}</p>
    </div>
  </article>`;
}

/* ── CONTINUE WATCHING CARD ── */
function buildCWCard(movie) {
  const backdrop = TMDB.backdropURL(movie.backdrop_path || movie.poster_path, 'backdrop_sm') || FALLBACK_POSTER;
  const pct = Math.round((movie.progress || 0.3) * 100);
  const minsLeft = Math.round((1 - (movie.progress || 0.3)) * (movie.runtime || 120));

  return `
  <article class="movie-card movie-card-cw" data-id="${movie.id}" tabindex="0" aria-label="${movie.title}">
    <div class="movie-card-poster">
      <img class="lazy"
           src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9'%3E%3C/svg%3E"
           data-src="${backdrop}"
           alt="${movie.title}"
           width="780" height="438"
           loading="lazy">
      <div class="movie-card-overlay">
        <div class="movie-card-actions">
          <button class="card-action-btn card-play-btn" data-id="${movie.id}" aria-label="Continue watching ${movie.title}">
            ${Icons.play}
          </button>
        </div>
      </div>
      <span class="cw-time-left">${minsLeft}m left</span>
      <div class="progress-bar-wrap">
        <div class="progress-bar" style="width: ${pct}%"></div>
      </div>
    </div>
    <div class="movie-card-info">
      <h3 class="movie-card-title">${movie.title}</h3>
      <p class="movie-card-year">${fmtYear(movie.release_date)}</p>
    </div>
  </article>`;
}

/* ── CAROUSEL SECTION ── */
function buildCarouselSection({ id, eyebrow, title, subtitle, link = '#', cards, variant = '' }) {
  return `
  <section class="section" id="${id}" aria-label="${title}">
    <div class="section-header reveal">
      <div class="section-title-group">
        <p class="section-eyebrow">${eyebrow}</p>
        <h2 class="section-title">${title}</h2>
        ${subtitle ? `<p class="section-subtitle">${subtitle}</p>` : ''}
      </div>
      <a href="${link}" class="section-see-all" aria-label="See all ${title}">
        See All ${Icons.arrowRight}
      </a>
    </div>
    <div class="carousel-wrap">
      <button class="carousel-btn carousel-btn-prev" aria-label="Previous">
        ${Icons.arrowLeft}
      </button>
      <div class="carousel-track">
        ${cards}
      </div>
      <button class="carousel-btn carousel-btn-next" aria-label="Next">
        ${Icons.arrowRight}
      </button>
    </div>
  </section>`;
}

/* ── FEATURED SIDEBAR CARD ── */
function buildFeaturedSidebarCard(movie, rank) {
  const poster = TMDB.posterURL(movie.poster_path, 'poster_sm') || FALLBACK_POSTER;
  return `
  <div class="featured-sidebar-card" data-id="${movie.id}" data-rank="${rank}" role="button" tabindex="0">
    <div class="featured-sidebar-poster">
      <img class="lazy"
           src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 2 3'%3E%3C/svg%3E"
           data-src="${poster}" alt="${movie.title}" loading="lazy">
    </div>
    <div class="featured-sidebar-info">
      <div class="featured-sidebar-rank">${String(rank).padStart(2, '0')}</div>
      <div class="featured-sidebar-title">${movie.title}</div>
      <div class="featured-sidebar-meta">${fmtYear(movie.release_date)} · ${fmtRating(movie.vote_average)} ★</div>
    </div>
  </div>`;
}

/* ── GENRE GRID CARD ── */
const GENRE_IMAGES = {
  28:    'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=600&q=70',
  12:    'https://images.unsplash.com/photo-1533240332313-0db49b459ad6?w=600&q=70',
  16:    'https://images.unsplash.com/photo-1535016120720-40c646be5580?w=600&q=70',
  35:    'https://images.unsplash.com/photo-1517702145080-e4b3f1e65bed?w=600&q=70',
  27:    'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?w=600&q=70',
  878:   'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=600&q=70',
  18:    'https://images.unsplash.com/photo-1553484771-8bbd4e00e4b6?w=600&q=70',
  53:    'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&q=70',
  10749: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&q=70',
  80:    'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=600&q=70',
};

const GENRE_COUNTS = { 28:'2,400+', 12:'1,800+', 16:'900+', 35:'3,100+', 27:'1,200+', 878:'1,500+', 18:'4,200+', 53:'2,100+', 10749:'2,800+', 80:'1,600+' };

function buildGenreCard(genreId) {
  const name  = TMDB.GENRES[genreId] || 'Other';
  const img   = GENRE_IMAGES[genreId] || GENRE_IMAGES[28];
  const count = GENRE_COUNTS[genreId] || '1,000+';
  const slug  = name.toLowerCase().replace(/\s+/g, '-');
  return `
  <a href="movies.html?genre=${genreId}" 
     class="genre-card" 
     data-genre="${slug}"
     aria-label="${name} movies">
    <img src="${img}" alt="${name}" loading="lazy">
    <div class="genre-card-overlay"></div>
    <div class="genre-card-content">
      <div class="genre-card-name">${name}</div>
      <div class="genre-card-count">${count} movies</div>
    </div>
  </a>`;
}

/* ── BIND CARD INTERACTIONS ── */
function bindCardEvents(container) {
  container.addEventListener('click', e => {
    // Watchlist
    const wlBtn = e.target.closest('.wl-btn');
    if (wlBtn) {
      e.stopPropagation();
      const id = parseInt(wlBtn.dataset.id);
      // Find movie data from DOM (simplified — real app would keep a data store)
      const card = wlBtn.closest('.movie-card');
      const title = card?.querySelector('.movie-card-title')?.textContent || 'Movie';
      Watchlist.add({ id, title, poster_path: null, vote_average: 0, release_date: '', genre_ids: [] });
      wlBtn.innerHTML = Watchlist.has(id) ? Icons.bookmarkFill : Icons.bookmark;
      wlBtn.classList.toggle('active', Watchlist.has(id));
      return;
    }

    // Favorites
    const favBtn = e.target.closest('.fav-btn');
    if (favBtn) {
      e.stopPropagation();
      const id = parseInt(favBtn.dataset.id);
      const card = favBtn.closest('.movie-card');
      const title = card?.querySelector('.movie-card-title')?.textContent || 'Movie';
      Favorites.toggle({ id, title, poster_path: null });
      favBtn.innerHTML = Favorites.has(id) ? Icons.heartFill : Icons.heart;
      favBtn.classList.toggle('active', Favorites.has(id));
      return;
    }

    // Navigate to details
    const card = e.target.closest('.movie-card');
    if (card?.dataset.id) {
      window.location.href = `movie-details.html?id=${card.dataset.id}`;
    }
  });

  // Keyboard nav
  container.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') {
      const card = e.target.closest('.movie-card');
      if (card?.dataset.id) {
        e.preventDefault();
        window.location.href = `movie-details.html?id=${card.dataset.id}`;
      }
    }
  });
}