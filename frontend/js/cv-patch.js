/* ================================================================
   CINEVERSE — cv-patch.js  v2.0
   Use on: home.html  AND  movie_page.html

   • Loads user Favorites & Watchlist from backend on page load
   • Renders correct active states on ALL movie cards
   • Wires fav / watchlist button clicks to correct API endpoints
   • ONE request per click, buttons locked while in-flight
   • Backend is always the source of truth
   • NO duplicate event listeners (uses event delegation per container)
================================================================ */

'use strict';

(function cvPatch() {

  /* ── Wait for DOM ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  async function boot() {
    /* Load both lists from backend first */
    await cvInit();

    /* Apply initial active states to any already-rendered cards */
    refreshAllButtons();

    /* Watch for new cards rendered dynamically (home.js / movie_page.js) */
    observeNewCards();

    /* Wire click delegation on the whole document (once) */
    wireDelegation();
  }

  /* ================================================================
     DELEGATION — single listener on document for all pages
  ================================================================ */
  let _delegationWired = false;

  function wireDelegation() {
    if (_delegationWired) return;
    _delegationWired = true;

    document.addEventListener('click', async (e) => {
      /* ── Favorite button ── */
      const favBtn = e.target.closest('.mgc-fav-btn, .cv-fav-btn');
      if (favBtn) {
        e.preventDefault();
        e.stopPropagation();
        await handleFavClick(favBtn);
        return;
      }

      /* ── Watchlist button ── */
      const wlBtn = e.target.closest('.mgc-wl-btn, .cv-wl-btn, .tdp-wl-btn, .cs-wl-btn');
      if (wlBtn) {
        e.preventDefault();
        e.stopPropagation();
        await handleWLClick(wlBtn);
        return;
      }
    }, true); /* capture phase — fires before any other handler */
  }

  /* ================================================================
     FAVORITE CLICK HANDLER
  ================================================================ */
  async function handleFavClick(btn) {
    if (btn.disabled || btn.dataset.cvLoading) return;

    const movieId = getMovieId(btn);
    if (!movieId) return;

    if (!cvLoggedIn()) { cvShowAuthPrompt(); return; }

    /* Lock button */
    btn.dataset.cvLoading = '1';
    btn.style.opacity = '0.5';
    btn.style.pointerEvents = 'none';

    const result = await cvToggleFavorite(movieId);

    /* Unlock */
    delete btn.dataset.cvLoading;
    btn.style.opacity = '';
    btn.style.pointerEvents = '';

    if (result === null) return; /* error — icon unchanged, toast already shown */

    /* Update ALL fav buttons for this movie across the page */
    updateFavButtons(movieId, result);
    cvToast(result ? '♥ Added to Favorites' : 'Removed from Favorites', result ? 'success' : '');
  }

  /* ================================================================
     WATCHLIST CLICK HANDLER
  ================================================================ */
  async function handleWLClick(btn) {
    if (btn.disabled || btn.dataset.cvLoading) return;

    const movieId = getMovieId(btn);
    if (!movieId) return;

    if (!cvLoggedIn()) { cvShowAuthPrompt(); return; }

    btn.dataset.cvLoading = '1';
    btn.style.opacity = '0.5';
    btn.style.pointerEvents = 'none';

    const result = await cvToggleWatchlist(movieId);

    delete btn.dataset.cvLoading;
    btn.style.opacity = '';
    btn.style.pointerEvents = '';

    if (result === null) return;

    updateWLButtons(movieId, result);
    cvToast(result ? '📌 Added to Watchlist' : 'Removed from Watchlist', result ? 'success' : '');
  }

  /* ================================================================
     READ MOVIE ID FROM BUTTON
     Supports: data-movie-id, data-id, or JSON in data-movie
  ================================================================ */
  function getMovieId(btn) {
    if (btn.dataset.movieId) return btn.dataset.movieId;
    if (btn.dataset.id) return btn.dataset.id;
    /* Try data-movie JSON (movie_page.js format) */
    if (btn.dataset.movie) {
      try {
        const obj = JSON.parse(btn.dataset.movie);
        return obj?.id ? String(obj.id) : null;
      } catch {}
    }
    /* Walk up to find a parent with data-movie-id */
    const parent = btn.closest('[data-movie-id]');
    if (parent) return parent.dataset.movieId;
    return null;
  }

  /* ================================================================
     UPDATE ALL BUTTONS FOR A GIVEN MOVIE ON THE PAGE
  ================================================================ */
  function updateFavButtons(movieId, active) {
    const id = String(movieId);
    document.querySelectorAll('.mgc-fav-btn, .cv-fav-btn').forEach(btn => {
      if (String(getMovieId(btn)) !== id) return;
      btn.classList.toggle('active', active);
      btn.innerHTML = heartSvg(active);
    });
  }

  function updateWLButtons(movieId, active) {
    const id = String(movieId);
    document.querySelectorAll('.mgc-wl-btn, .cv-wl-btn, .tdp-wl-btn, .cs-wl-btn').forEach(btn => {
      if (String(getMovieId(btn)) !== id) return;
      btn.classList.toggle('active', active);
      btn.innerHTML = bookmarkSvg(active);
    });
  }

  /* ================================================================
     REFRESH ALL BUTTONS — sets correct initial active state
     Called after cvInit() loads lists from backend
  ================================================================ */
  function refreshAllButtons() {
    document.querySelectorAll('.mgc-fav-btn, .cv-fav-btn').forEach(btn => {
      const id = getMovieId(btn);
      if (!id) return;
      const active = cvIsFavorite(id);
      btn.classList.toggle('active', active);
      btn.innerHTML = heartSvg(active);
    });

    document.querySelectorAll('.mgc-wl-btn, .cv-wl-btn, .tdp-wl-btn, .cs-wl-btn').forEach(btn => {
      const id = getMovieId(btn);
      if (!id) return;
      const active = cvIsWatchlisted(id);
      btn.classList.toggle('active', active);
      btn.innerHTML = bookmarkSvg(active);
    });
  }

  /* ================================================================
     MUTATION OBSERVER — re-apply states when new cards are injected
  ================================================================ */
  let _refreshTimer = null;

  function observeNewCards() {
    const mo = new MutationObserver(() => {
      /* Debounce — cards are injected in bulk */
      clearTimeout(_refreshTimer);
      _refreshTimer = setTimeout(refreshAllButtons, 80);
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  /* ================================================================
     SVG HELPERS
  ================================================================ */
  function heartSvg(active) {
    return `<svg viewBox="0 0 24 24" fill="${active ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" width="14" height="14" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
  }

  function bookmarkSvg(active) {
    return `<svg viewBox="0 0 24 24" fill="${active ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" width="14" height="14" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`;
  }

})();