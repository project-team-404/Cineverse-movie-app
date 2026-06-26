/* ================================================================
   CINEVERSE — cv-details-patch.js  v2.0
   Use on: movie-details.html ONLY

   • Loads Favorites & Watchlist on page load
   • Sets correct initial active states for fav & WL buttons
   • Replaces existing button listeners with backend-correct ones
   • ONE request per click, locked while in-flight
   • Backend always re-fetched after toggle for source of truth
================================================================ */

'use strict';

(function cvDetailsPatch() {

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  async function boot() {
    /* Get movie ID from URL */
    const movieId = new URLSearchParams(window.location.search).get('id');
    if (!movieId) return;

    /* Load user's lists from backend */
    await cvInit();

    /* Apply initial icon states */
    applyFavState(movieId);
    applyWLState(movieId);

    /* Re-wire all buttons with correct backend handlers */
    wireFavButtons(movieId);
    wireWLButtons(movieId);
  }

  /* ================================================================
     FAVORITE BUTTONS
  ================================================================ */
  function wireFavButtons(movieId) {
    /* IDs used in movie-details.html */
    ['btn-fav-hero', 'float-fav'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      /* Remove existing listeners by cloning */
      const fresh = el.cloneNode(true);
      el.parentNode.replaceChild(fresh, el);
      fresh.addEventListener('click', () => handleFavToggle(movieId));
    });
  }

  async function handleFavToggle(movieId) {
    if (!cvLoggedIn()) { cvShowAuthPrompt(); return; }

    /* Lock all fav buttons while in flight */
    setFavLoading(true);

    const result = await cvToggleFavorite(movieId);

    setFavLoading(false);

    if (result === null) return; /* error already toasted, icon unchanged */

    applyFavState(movieId);
    cvToast(result ? '♥ Added to Favorites' : 'Removed from Favorites', result ? 'success' : '');
  }

  function applyFavState(movieId) {
    const active = cvIsFavorite(movieId);

    const heroIcon  = document.getElementById('fav-hero-icon');
    const heroBtn   = document.getElementById('btn-fav-hero');
    const floatIcon = document.getElementById('float-fav-icon');
    const floatBtn  = document.getElementById('float-fav');

    if (heroIcon)  heroIcon.style.fill  = active ? 'var(--rose, #f43f5e)' : 'none';
    if (heroBtn)   heroBtn.classList.toggle('active', active);
    if (floatIcon) floatIcon.style.fill = active ? 'var(--rose, #f43f5e)' : 'none';
    if (floatBtn)  floatBtn.classList.toggle('active', active);
  }

  function setFavLoading(loading) {
    ['btn-fav-hero', 'float-fav'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.style.opacity = loading ? '0.5' : '';
      el.style.pointerEvents = loading ? 'none' : '';
    });
  }

  /* ================================================================
     WATCHLIST BUTTONS
  ================================================================ */
  function wireWLButtons(movieId) {
    ['btn-watchlist', 'float-wl'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      const fresh = el.cloneNode(true);
      el.parentNode.replaceChild(fresh, el);
      fresh.addEventListener('click', () => handleWLToggle(movieId));
    });
  }

  async function handleWLToggle(movieId) {
    if (!cvLoggedIn()) { cvShowAuthPrompt(); return; }

    setWLLoading(true);

    const result = await cvToggleWatchlist(movieId);

    setWLLoading(false);

    if (result === null) return;

    applyWLState(movieId);
    cvToast(result ? '📌 Added to Watchlist' : 'Removed from Watchlist', result ? 'success' : '');
  }

  function applyWLState(movieId) {
    const active = cvIsWatchlisted(movieId);

    const label   = document.getElementById('watchlist-label');
    const btn     = document.getElementById('btn-watchlist');
    const floatBtn = document.getElementById('float-wl');

    if (label)    label.textContent = active ? 'In Watchlist' : 'Add to Watchlist';
    if (btn)      btn.classList.toggle('active', active);
    if (floatBtn) floatBtn.classList.toggle('active', active);
  }

  function setWLLoading(loading) {
    ['btn-watchlist', 'float-wl'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.style.opacity = loading ? '0.5' : '';
      el.style.pointerEvents = loading ? 'none' : '';
    });
  }

})();