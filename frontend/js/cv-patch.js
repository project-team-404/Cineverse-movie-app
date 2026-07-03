

'use strict';

(function cvPatch() {

  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  async function boot() {
    
    await cvInit();

    
    refreshAllButtons();

    
    observeNewCards();

   
    wireDelegation();
  }

  
  let _delegationWired = false;

  function wireDelegation() {
    if (_delegationWired) return;
    _delegationWired = true;

    document.addEventListener('click', async (e) => {
    
      const favBtn = e.target.closest('.mgc-fav-btn, .cv-fav-btn');
      if (favBtn) {
        e.preventDefault();
        e.stopPropagation();
        await handleFavClick(favBtn);
        return;
      }

    
      const wlBtn = e.target.closest('.mgc-wl-btn, .cv-wl-btn, .tdp-wl-btn, .cs-wl-btn');
      if (wlBtn) {
        e.preventDefault();
        e.stopPropagation();
        await handleWLClick(wlBtn);
        return;
      }
    }, true); 
  }

  
  async function handleFavClick(btn) {
    if (btn.disabled || btn.dataset.cvLoading) return;

    const movieId = getMovieId(btn);
    if (!movieId) return;

    if (!cvLoggedIn()) { cvShowAuthPrompt(); return; }

    
    btn.dataset.cvLoading = '1';
    btn.style.opacity = '0.5';
    btn.style.pointerEvents = 'none';

    const result = await cvToggleFavorite(movieId);

   
    delete btn.dataset.cvLoading;
    btn.style.opacity = '';
    btn.style.pointerEvents = '';

    if (result === null) return; 

    
    updateFavButtons(movieId, result);
    cvToast(result ? '♥ Added to Favorites' : 'Removed from Favorites', result ? 'success' : '');
  }

  
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

 
  function getMovieId(btn) {
    if (btn.dataset.movieId) return btn.dataset.movieId;
    if (btn.dataset.id) return btn.dataset.id;
    
    if (btn.dataset.movie) {
      try {
        const obj = JSON.parse(btn.dataset.movie);
        return obj?.id ? String(obj.id) : null;
      } catch {}
    }
    
    const parent = btn.closest('[data-movie-id]');
    if (parent) return parent.dataset.movieId;
    return null;
  }

  
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


  let _refreshTimer = null;

  function observeNewCards() {
    const mo = new MutationObserver(() => {
      
      clearTimeout(_refreshTimer);
      _refreshTimer = setTimeout(refreshAllButtons, 80);
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  
  function heartSvg(active) {
    return `<svg viewBox="0 0 24 24" fill="${active ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" width="14" height="14" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>`;
  }

  function bookmarkSvg(active) {
    return `<svg viewBox="0 0 24 24" fill="${active ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" width="14" height="14" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>`;
  }

})();