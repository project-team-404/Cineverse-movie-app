/* ============================================================
   CINEVERSE — HOME ENHANCED CONTROLLER
   Handles: Hero Ken Burns slider, Trending carousel + detail panel,
            Personalized section, Mood card interactions
   ============================================================ */

/* ── HERO ENHANCED (local images, Ken Burns, crossfade, counter) ── */
(function initHeroEnhanced() {
  const slides     = document.querySelectorAll('.hero-slide[data-local]');
  const counter    = document.querySelector('.hsc-current');
  const totalEl    = document.querySelector('.hsc-total');
  const indicators = document.querySelector('.hero-indicators');
  const thumbsWrap = document.querySelector('.hero-thumbs');

  if (!slides.length) return; // fall back to home.js if no local slides

  /* Static slide data — replaces TMDB data when local images are used */
  const slideData = [
    {
      title:       'Oppenheimer',
      desc:        'The story of J. Robert Oppenheimer\'s role in the development of the atomic bomb during World War II, and the haunting aftermath that followed.',
      genre:       ['Biography', 'Drama', 'History'],
      year:        '2023',
      rating:      '8.4',
      id:          null,
    },
    {
      title:       'Dune: Part Two',
      desc:        'Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family.',
      genre:       ['Sci-Fi', 'Adventure'],
      year:        '2024',
      rating:      '8.6',
      id:          null,
    },
    {
      title:       'Killers of the Flower Moon',
      desc:        'Members of the Osage Nation are murdered under mysterious circumstances in 1920s Oklahoma, sparking a major FBI investigation.',
      genre:       ['Crime', 'Drama', 'History'],
      year:        '2023',
      rating:      '7.7',
      id:          null,
    },
    {
      title:       'Poor Things',
      desc:        'The incredible tale of a young woman brought back to life by an unorthodox scientist who embarks on an adventure across continents.',
      genre:       ['Drama', 'Fantasy', 'Romance'],
      year:        '2023',
      rating:      '8.0',
      id:          null,
    },
    {
      title:       'Interstellar',
      desc:        'A team of explorers travel through a wormhole in space in an attempt to ensure humanity\'s survival as Earth faces catastrophic devastation.',
      genre:       ['Sci-Fi', 'Adventure', 'Drama'],
      year:        '2014',
      rating:      '8.7',
      id:          null,
    },
    {
      title:       'The Batman',
      desc:        'In his second year of fighting crime, Batman uncovers corruption in Gotham City that connects to his own family while pursuing a sadistic killer.',
      genre:       ['Action', 'Crime', 'Drama'],
      year:        '2022',
      rating:      '7.8',
      id:          null,
    },
    {
      title:       'Blade Runner 2049',
      desc:        'A young blade runner discovers a long-buried secret that has the potential to plunge what\'s left of society into chaos.',
      genre:       ['Sci-Fi', 'Thriller'],
      year:        '2017',
      rating:      '8.0',
      id:          null,
    },
    {
      title:       'The Grand Budapest Hotel',
      desc:        'The adventures of Gustave H, a legendary concierge at a famous European hotel between the wars, and Zero, the lobby boy who becomes his most trusted friend.',
      genre:       ['Adventure', 'Comedy', 'Crime'],
      year:        '2014',
      rating:      '8.1',
      id:          null,
    },
  ];

  let currentIndex = 0;
  let autoplayTimer = null;
  let isTransitioning = false;

  const total = slides.length;

  /* Update counter display */
  function updateCounter(idx) {
    if (counter) counter.textContent = String(idx + 1).padStart(2, '0');
    if (totalEl)  totalEl.textContent  = String(total).padStart(2, '0');
  }

  /* Build dot indicators */
  function buildDots() {
    if (!indicators) return;
    indicators.innerHTML = '';
    slides.forEach((_, i) => {
      const dot = document.createElement('div');
      dot.className = `hero-dot${i === 0 ? ' active' : ''}`;
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Slide ${i + 1}`);
      dot.setAttribute('tabindex', '0');
      dot.addEventListener('click', () => goTo(i));
      dot.addEventListener('keydown', e => { if (e.key === 'Enter') goTo(i); });
      indicators.appendChild(dot);
    });
  }

  /* Build thumbnail strip */
  function buildThumbs() {
    if (!thumbsWrap) return;
    thumbsWrap.innerHTML = '';
    slides.forEach((slide, i) => {
      const imgSrc = slide.querySelector('img')?.src || '';
      const thumb = document.createElement('div');
      thumb.className = `hero-thumb${i === 0 ? ' active' : ''}`;
      thumb.setAttribute('role', 'tab');
      thumb.setAttribute('tabindex', '0');
      thumb.setAttribute('aria-label', slideData[i]?.title || `Slide ${i + 1}`);

      const img = document.createElement('img');
      img.src = imgSrc;
      img.alt = slideData[i]?.title || '';
      img.loading = 'lazy';
      thumb.appendChild(img);

      thumb.addEventListener('click', () => goTo(i));
      thumb.addEventListener('keydown', e => { if (e.key === 'Enter') goTo(i); });
      thumbsWrap.appendChild(thumb);
    });
  }

  /* Animate hero content out → swap data → animate back in */
  function animateContent(data) {
    const title   = document.querySelector('.hero-title');
    const desc    = document.querySelector('.hero-desc');
    const meta    = document.querySelector('.hero-meta');
    const actions = document.querySelector('.hero-actions');
    const ratingEl = document.querySelector('.hero-rating-score');
    const yearEl   = document.querySelector('.hero-year');
    const genresEl = document.querySelector('.hero-genres');
    const playBtn  = document.querySelector('.hero-play-btn');
    const moreBtn  = document.querySelector('.hero-more-btn');

    const els = [title, meta, desc, actions].filter(Boolean);

    /* Fade out */
    els.forEach(el => {
      el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
      el.style.opacity = '0';
      el.style.transform = 'translateY(14px)';
    });

    setTimeout(() => {
      /* Update data */
      if (title && data) {
        const words = (data.title || '').split(' ');
        const last  = words.pop();
        title.innerHTML = (words.length ? words.join(' ') + ' ' : '') +
                          `<span class="title-accent">${last}</span>`;
      }
      if (desc)     desc.textContent    = data?.desc    || '';
      if (ratingEl) ratingEl.textContent = data?.rating  || '—';
      if (yearEl)   yearEl.textContent   = data?.year    || '—';
      if (genresEl) {
        genresEl.innerHTML = (data?.genre || [])
          .map(g => `<span class="hero-genre-tag">${g}</span>`)
          .join('');
      }
      if (playBtn && data?.id) playBtn.dataset.id = data.id;
      if (moreBtn && data?.id) moreBtn.href = `movie-details.html?id=${data.id}`;

      /* Stagger fade in */
      els.forEach((el, i) => {
        setTimeout(() => {
          el.style.transition = `opacity 0.55s cubic-bezier(0.16,1,0.3,1) ${i * 0.08}s,
                                  transform 0.55s cubic-bezier(0.16,1,0.3,1) ${i * 0.08}s`;
          el.style.opacity   = '1';
          el.style.transform = 'translateY(0)';
        }, i * 60);
      });
    }, 300);
  }

  /* Go to slide */
  function goTo(idx) {
    if (isTransitioning || idx === currentIndex) return;
    isTransitioning = true;

    const prev = currentIndex;
    currentIndex = (idx + total) % total;

    /* Image crossfade */
    slides[prev].classList.remove('active');
    slides[currentIndex].classList.add('active');

    /* Dots */
    document.querySelectorAll('.hero-dot').forEach((d, i) => {
      d.classList.toggle('active', i === currentIndex);
    });
    /* Thumbs */
    document.querySelectorAll('.hero-thumb').forEach((t, i) => {
      t.classList.toggle('active', i === currentIndex);
    });

    updateCounter(currentIndex);
    animateContent(slideData[currentIndex]);

    resetAutoplay();
    setTimeout(() => { isTransitioning = false; }, 800);
  }

  /* Autoplay */
  function startAutoplay() {
    autoplayTimer = setInterval(() => {
      goTo((currentIndex + 1) % total);
    }, 7000);
  }
  function resetAutoplay() {
    clearInterval(autoplayTimer);
    startAutoplay();
  }

  /* Keyboard navigation */
  document.addEventListener('keydown', e => {
    const hero = document.getElementById('hero');
    if (!hero) return;
    if (e.key === 'ArrowLeft')  goTo(currentIndex - 1);
    if (e.key === 'ArrowRight') goTo(currentIndex + 1);
  });

  /* Touch swipe */
  (function initSwipe() {
    const hero = document.getElementById('hero');
    if (!hero) return;
    let startX = 0;
    hero.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
    hero.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) goTo(dx < 0 ? currentIndex + 1 : currentIndex - 1);
    });
  })();

  /* Init */
  buildDots();
  buildThumbs();
  updateCounter(0);
  animateContent(slideData[0]);
  startAutoplay();

  /* Pause on hover */
  const hero = document.getElementById('hero');
  if (hero) {
    hero.addEventListener('mouseenter', () => clearInterval(autoplayTimer));
    hero.addEventListener('mouseleave', startAutoplay);
  }
})();


/* ── TRENDING CAROUSEL — premium centered version ── */
(function initTrendingEnhanced() {
  const track  = document.getElementById('trending-track');
  const detail = document.getElementById('trending-detail');
  const prevBtn = document.querySelector('.trending-btn-prev');
  const nextBtn = document.querySelector('.trending-btn-next');

  if (!track) return;

  /* Local placeholder data for trending cards */
  const trendingData = [
    
  { 
    title: 'Office Romance', 
    year: '2026', 
    rating: '7.2', 
    genre: 'Action', 
    desc: 'A high-octane action-thriller following a high-risk sting operations team operating deep within a glossy corporate environment.', 
    img: 'assets/images/trending/office.jpg', 
    id: 110243, 
    runtime: '115m' 
  },
  { 
    title: 'Maternal Instinct', 
    year: '2026', 
    rating: '6.9', 
    genre: 'Thriller', 
    desc: 'A tense psychological thriller exploring the dark, disturbing unraveling of a neighborhood family after a tragic event.', 
    img: 'assets/images/trending/maternal.jpg', 
    id: 110244, 
    runtime: '97m' 
  },
  { 
    title: 'Your Fault: London', 
    year: '2026', 
    rating: '6.5', 
    genre: 'Romance', 
    desc: 'An intense, soapy college romance drama following forbidden love and hidden secrets across London\'s elite youth.', 
    img: 'assets/images/trending/your_fault.jpg', 
    id: 220351, 
    runtime: '112m' 
  },
  { 
    title: 'KPop Demon Hunters', 
    year: '2025', 
    rating: '7.1', 
    genre: 'Animation', 
    desc: 'Three K-pop superstars balance their global musical fame with a dangerous double life hunting down supernatural demons.', 
    img: 'assets/images/trending/kpop.jpg', 
    id: 823412, 
    runtime: '96m' 
  },
  { 
    title: 'Tom Clancy\'s Jack Ryan: Ghost War', 
    year: '2026', 
    rating: '7.4', 
    genre: 'Action', 
    desc: 'Jack Ryan returns for a dangerous covert mission to stop an underground network threatening global infrastructure.', 
    img: 'assets/images/trending/tom.avif', 
    id: 304592, 
    runtime: '124m' 
  },
  { 
    title: 'Goat', 
    year: '2026', 
    rating: '6.8', 
    genre: 'Drama', 
    desc: 'A raw and gritty sports drama charting a young athlete\'s intense mental and physical sacrifices to reach the top tier.', 
    img: 'assets/images/trending/goat.webp', 
    id: 450123, 
    runtime: '100m' 
  },
  { 
    title: 'Project Hail Mary', 
    year: '2026', 
    rating: '8.1', 
    genre: 'Sci-Fi', 
    desc: 'An amnesiac teacher wakes up aboard an interstellar ship to solve a scientific crisis threatening to destroy Earth\'s sun.', 
    img: 'assets/images/trending/project_hail.jpg', 
    id: 742119, 
    runtime: '156m' 
  },
  { 
    title: 'Crime 101', 
    year: '2026', 
    rating: '7.6', 
    genre: 'Crime', 
    desc: 'A meticulous detective battles wits along the Pacific Coast Highway with a lone-wolf thief executing high-stakes jewel heists.', 
    img: 'assets/images/trending/crime101.jpeg', 
    id: 994231, 
    runtime: '118m' 
  },
  { 
    title: 'The Murder of Rachel Nickell', 
    year: '2026', 
    rating: '7.0', 
    genre: 'Mystery', 
    desc: 'A gripping true-crime mystery detailing the complex, high-pressure investigation surrounding a high-profile public case.', 
    img: 'assets/images/trending/murder.jpg', 
    id: 561244, 
    runtime: '96m' 
  },
  { 
    title: 'The Protégé', 
    year: '2021', 
    rating: '6.5', 
    genre: 'Action', 
    desc: 'An elite contract killer embarks on a deadly revenge mission after her legendary assassin mentor is brutally murdered.', 
    img: 'assets/images/trending/the_protege.jpg', 
    id: 645886, 
    runtime: '109m' 
  },

  ];

  let activeIdx = 0;
  let tmdbLoaded = false; // flag: if TMDB data loads, it takes over

  /* Build cards */
  function buildTrendingCards(data) {
    track.innerHTML = '';
    data.forEach((movie, i) => {
      const card = document.createElement('div');
      card.className = `trending-card${i === 0 ? ' active-card' : ''}`;
      card.setAttribute('role', 'listitem');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', movie.title);

      card.innerHTML = `
        <div class="trending-card-poster">
          <img src="${movie.img}"
               alt="${movie.title} poster"
               loading="${i < 4 ? 'eager' : 'lazy'}"
               onerror="this.src='https://via.placeholder.com/190x285/111122/444466?text=${encodeURIComponent(movie.title)}'">
          <div class="trending-card-rank">${String(i + 1).padStart(2, '0')}</div>
          <div class="trending-card-rating">
            <svg viewBox="0 0 24 24" fill="#f4c542" width="10" height="10"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            ${movie.rating}
          </div>
          <div class="trending-card-overlay">
            <button class="trending-card-play" aria-label="Watch ${movie.title}">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            </button>
          </div>
        </div>
        <div class="trending-card-info">
          <h3 class="trending-card-title">${movie.title}</h3>
          <p class="trending-card-meta">${movie.year} · ${movie.genre}</p>
        </div>`;

      card.addEventListener('click', () => selectTrending(i, data));
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter') selectTrending(i, data);
      });

      track.appendChild(card);
    });

    /* Set up drag-to-scroll */
    initTrendingDrag();
    /* Set up arrow buttons */
    initTrendingArrows(data);
    /* Update detail panel */
    updateDetailPanel(data[0], 0);
  }

  /* Select active card */
  function selectTrending(idx, data) {
    const cards = track.querySelectorAll('.trending-card');
    cards.forEach((c, i) => c.classList.toggle('active-card', i === idx));
    activeIdx = idx;
    updateDetailPanel(data[idx], idx);

    /* Scroll card into center view */
    const card = cards[idx];
    if (card) {
      const trackRect = track.getBoundingClientRect();
      const cardRect  = card.getBoundingClientRect();
      const offset    = cardRect.left - trackRect.left - (trackRect.width / 2) + (cardRect.width / 2);
      track.scrollBy({ left: offset, behavior: 'smooth' });
    }
  }

  /* Update detail panel with stagger animation */
  function updateDetailPanel(movie, rank) {
    if (!detail || !movie) return;

    const panel = detail;
    panel.classList.add('panel-transitioning');

    setTimeout(() => {
      panel.querySelector('.tdp-eyebrow').textContent   = `Trending #${rank + 1}`;
      panel.querySelector('.tdp-title').textContent     = movie.title;
      panel.querySelector('.tdp-rating-val').textContent = movie.rating;
      panel.querySelector('.tdp-year').textContent       = movie.year;

      const genreTag = panel.querySelector('.tdp-genre');
      if (genreTag) {
        genreTag.textContent = movie.genre;
        genreTag.className   = 'tdp-genre tdp-genre-tag';
      }

      const descEl = panel.querySelector('.tdp-desc');
      if (descEl) descEl.textContent = movie.desc;

      const watchBtn = panel.querySelector('.tdp-watch-btn');
      if (watchBtn) watchBtn.href = movie.id ? `movie-details.html?id=${movie.id}` : '#';

      const wlBtn = panel.querySelector('.tdp-wl-btn');
      if (wlBtn) {
        wlBtn.onclick = () => {
          if (typeof Watchlist !== 'undefined') {
            Watchlist.add({ id: movie.id || 0, title: movie.title, poster_path: null, vote_average: parseFloat(movie.rating) || 0, release_date: movie.year + '-01-01', genre_ids: [] });
          }
        };
      }

      panel.classList.remove('panel-transitioning');
    }, 200);
  }

  /* Arrow buttons */
  function initTrendingArrows(data) {
    if (!prevBtn || !nextBtn) return;

    function scrollCards(dir) {
      const newIdx = Math.max(0, Math.min(data.length - 1, activeIdx + dir));
      selectTrending(newIdx, data);
    }

    prevBtn.addEventListener('click', () => scrollCards(-1));
    nextBtn.addEventListener('click', () => scrollCards(1));

    /* Update disabled state */
    track.addEventListener('scroll', () => {
      prevBtn.disabled = track.scrollLeft <= 0;
      nextBtn.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 1;
    }, { passive: true });
  }

  /* Drag-to-scroll */
  function initTrendingDrag() {
    let isDown = false, startX = 0, scrollLeft = 0;
    track.addEventListener('mousedown', e => {
      isDown = true;
      startX = e.pageX - track.offsetLeft;
      scrollLeft = track.scrollLeft;
      track.style.cursor = 'grabbing';
    });
    document.addEventListener('mouseup', () => { isDown = false; track.style.cursor = 'grab'; });
    track.addEventListener('mousemove', e => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - track.offsetLeft;
      track.scrollLeft = scrollLeft - (x - startX) * 1.4;
    });
  }

  /* Try to use TMDB data if available, else use local */
  function tryLoadFromTMDB() {
    if (typeof TMDB === 'undefined') {
      buildTrendingCards(trendingData);
      return;
    }
    TMDB.trending('week').then(data => {
      if (data?.results?.length) {
        tmdbLoaded = true;
        const mapped = data.results.slice(0, 10).map((m, i) => ({
          title:   m.title,
          year:    m.release_date?.slice(0, 4) || '—',
          rating:  m.vote_average?.toFixed(1) || '—',
          genre:   (typeof genreNames === 'function') ? genreNames(m.genre_ids, 1) : 'Movie',
          desc:    m.overview || '',
          img:     TMDB.posterURL(m.poster_path, 'poster_md') || trendingData[i]?.img || '',
          id:      m.id,
          runtime: '—',
        }));
        buildTrendingCards(mapped);
      } else {
        buildTrendingCards(trendingData);
      }
    }).catch(() => buildTrendingCards(trendingData));
  }

  tryLoadFromTMDB();
})();


/* ── HERO SLIDE COUNTER — ensure counter is visible ── */
(function ensureHeroCounter() {
  /* The counter is in the HTML; just make sure it animates in */
  const counter = document.querySelector('.hero-slide-counter');
  if (!counter) return;
  counter.style.opacity = '0';
  counter.style.transform = 'translateY(10px)';
  setTimeout(() => {
    counter.style.transition = 'opacity 0.7s ease 1.4s, transform 0.7s ease 1.4s';
    counter.style.opacity = '1';
    counter.style.transform = 'translateY(0)';
  }, 100);
})();


/* ── MOOD CARDS — enhanced hover & click interactions ── */
(function initMoodCards() {
  const cards = document.querySelectorAll('.mood-card');
  if (!cards.length) return;

  cards.forEach(card => {
    /* Parallax tilt on mousemove */
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width  - 0.5;
      const y = (e.clientY - rect.top)  / rect.height - 0.5;
      card.style.transform = `translateY(-12px) scale(1.03) rotateX(${y * -6}deg) rotateY(${x * 6}deg)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transition = 'transform 0.6s cubic-bezier(0.16,1,0.3,1), border-color 0.35s, box-shadow 0.35s';
      card.style.transform = '';
      setTimeout(() => { card.style.transition = ''; }, 600);
    });

    card.addEventListener('mouseenter', () => {
      card.style.transition = 'transform 0.1s ease, border-color 0.35s, box-shadow 0.35s';
    });
  });
})();


/* ── RECOMMENDED SECTION — match scores ── */
(function initRecommendedSection() {
  /* Add data-match attribute to cards once they load */
  const track = document.getElementById('recommended-track');
  if (!track) return;

  const observer = new MutationObserver(() => {
    const posters = track.querySelectorAll('.movie-card-poster:not([data-match])');
    const scores = [97, 94, 92, 91, 90, 88, 87, 85, 84, 83, 81, 79, 78, 76, 74];
    posters.forEach((p, i) => {
      p.setAttribute('data-match', `${scores[i] || 70}% Match`);
    });
  });
  observer.observe(track, { childList: true, subtree: false });
})();


/* ── STATS BANNER — countup with intersection observer ── */
(function reinitStats() {
  const banner = document.getElementById('stats-banner');
  if (!banner) return;

  function countUp(el, target, duration) {
    const start = performance.now();
    const update = now => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * ease).toLocaleString();
      if (p < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      banner.querySelectorAll('.count-up').forEach(el => {
        countUp(el, parseInt(el.dataset.target, 10) || 0, 1600);
      });
      io.unobserve(entry.target);
    });
  }, { threshold: 0.4 });
  io.observe(banner);
})();


/* ── GENRE GRID — delayed stagger entrance ── */
(function initGenreGrid() {
  const grid = document.getElementById('genre-grid');
  if (!grid) return;

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const cards = grid.querySelectorAll('.genre-card');
      cards.forEach((card, i) => {
        card.style.opacity = '0';
        card.style.transform = 'scale(0.93) translateY(20px)';
        setTimeout(() => {
          card.style.transition = `opacity 0.55s cubic-bezier(0.16,1,0.3,1) ${i * 0.06}s,
                                    transform 0.55s cubic-bezier(0.16,1,0.3,1) ${i * 0.06}s`;
          card.style.opacity = '1';
          card.style.transform = 'scale(1) translateY(0)';
        }, 50);
      });
      io.unobserve(entry.target);
    });
  }, { threshold: 0.1 });
  io.observe(grid);
})();


/* ── EDITORIAL BAND — parallax on scroll ── */
(function initEditorialParallax() {
  const band = document.querySelector('.editorial-band');
  if (!band) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    requestAnimationFrame(() => {
      const rect  = band.getBoundingClientRect();
      const vh    = window.innerHeight;
      const ratio = 1 - (rect.top / vh);
      const offset = (ratio - 0.5) * 30;
      const pseudo = band.querySelector('.editorial-inner');
      if (pseudo) pseudo.style.transform = `translateY(${offset}px)`;
      ticking = false;
    });
    ticking = true;
  }, { passive: true });
})();


/* ── PROMO BANNER — magnetic tilt effect ── */
(function initPromoBanner() {
  const banner = document.querySelector('.promo-inner');
  if (!banner) return;

  banner.addEventListener('mousemove', e => {
    const rect = banner.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width  - 0.5;
    const y = (e.clientY - rect.top)  / rect.height - 0.5;
    banner.style.transform = `perspective(1000px) rotateX(${y * -3}deg) rotateY(${x * 3}deg)`;
  });
  banner.addEventListener('mouseleave', () => {
    banner.style.transition = 'transform 0.5s cubic-bezier(0.16,1,0.3,1)';
    banner.style.transform  = '';
    setTimeout(() => { banner.style.transition = ''; }, 500);
  });
})();


/* ── CURSOR GLOW on hero ── */
(function initHeroCursorGlow() {
  const hero  = document.getElementById('hero');
  const depth = document.querySelector('.hero-depth-layer');
  if (!hero || !depth) return;

  hero.addEventListener('mousemove', e => {
    const x = ((e.clientX / window.innerWidth)  * 100).toFixed(1);
    const y = ((e.clientY / window.innerHeight) * 100).toFixed(1);
    depth.style.setProperty('--mouse-x', `${x}%`);
    depth.style.setProperty('--mouse-y', `${y}%`);
  });
})();