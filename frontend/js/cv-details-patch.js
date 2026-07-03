
'use strict';

(function cvDetailsPatch() {

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  async function boot() {
    
    const movieId = new URLSearchParams(window.location.search).get('id');
    if (!movieId) return;

    
    await cvInit();

   
    applyFavState(movieId);
    applyWLState(movieId);

    
    wireFavButtons(movieId);
    wireWLButtons(movieId);
  }

  
  function wireFavButtons(movieId) {
   
    ['btn-fav-hero', 'float-fav'].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
     
      const fresh = el.cloneNode(true);
      el.parentNode.replaceChild(fresh, el);
      fresh.addEventListener('click', () => handleFavToggle(movieId));
    });
  }

  async function handleFavToggle(movieId) {
    if (!cvLoggedIn()) { cvShowAuthPrompt(); return; }

    setFavLoading(true);

    const result = await cvToggleFavorite(movieId);

    setFavLoading(false);

    if (result === null) return; 

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