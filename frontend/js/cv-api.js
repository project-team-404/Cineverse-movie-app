/* ================================================================
   CINEVERSE — cv-api.js  v2.0
   Correct backend integration for Favorites & Watchlist.

   FAVORITES  → POST /favorites/add/{id}
               DELETE /favorites/delete/{id}
               GET    /favorites/   → [{id, user_id, movie_id}]
               Active check: item.movie_id

   WATCHLIST  → POST /watchlist/add/{id}
               DELETE /watchlist/{id}
               GET    /watchlist/   → [{id, movie:{id,...}}]
               Active check: item.movie.id

   Load this file BEFORE cv-patch.js on every page.
================================================================ */

'use strict';

const CV_BASE = 'https://cineverse-movie-app.onrender.com';

/* ── Token helpers ─────────────────────────────────────────── */
function cvToken()    { return localStorage.getItem('access_token') || ''; }
function cvLoggedIn() { return !!cvToken(); }

function cvAuthHeaders() {
  return {
    'Accept': 'application/json',
    'Authorization': `Bearer ${cvToken()}`
  };
}

/* ── Redirect on 401 ─────────────────────────────────────── */
function cvHandle401() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('user_name');
  localStorage.removeItem('user_email');
  window.location.href = 'login.html';
}

/* ================================================================
   ADMIN API — CV_Admin namespace for backend operations
================================================================ */
var CV_Admin = {
  /* Movies */
  getMovies: async function(page, limit) {
    const res = await fetch(`${CV_BASE}/movies/?page=${page}&limit=${limit}`, { headers: cvAuthHeaders() });
    if (res.status === 401) { cvHandle401(); return []; }
    if (!res.ok) throw new Error(`GET /movies/ → ${res.status}`);
    return await res.json();
  },

createMovie: async function(payload) {
    return await fetch(`${CV_BASE}/admin/movies`, {
        method: 'POST',
        headers: {
            ...cvAuthHeaders(),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
},

 updateMovie: async function(movieId, payload) {
    return await fetch(`${CV_BASE}/admin/movies/${movieId}`, {
        method: 'PATCH',
        headers: {
            ...cvAuthHeaders(),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
},

  deleteMovie: async function(movieId) {
    return await fetch(`${CV_BASE}/admin/movies/${movieId}`, {
        method: 'DELETE',
        headers: cvAuthHeaders()
    });
},

  uploadMovieImage: async function(movieId, file) {
    const formData = new FormData();
    formData.append('image', file);

    return await fetch(`${CV_BASE}/admin/movies/${movieId}/images`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${cvToken()}`
        },
        body: formData
    });
},

 deleteMovieImage: async function(imageId) {
    return await fetch(`${CV_BASE}/admin/movie-images/${imageId}`, {
        method: 'DELETE',
        headers: cvAuthHeaders()
    });
},

  /* Genres */
  getGenres: async function() {
    const res = await fetch(`${CV_BASE}/genres/`, { headers: cvAuthHeaders() });
    if (res.status === 401) { cvHandle401(); return []; }
    if (!res.ok) throw new Error(`GET /genres/ → ${res.status}`);
    return await res.json();
  },

 createGenre: async function(name) {
    return await fetch(`${CV_BASE}/admin/genres`, {
        method: 'POST',
        headers: {
            ...cvAuthHeaders(),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name })
    });
},

 updateGenre: async function(genreId, name) {
    return await fetch(`${CV_BASE}/admin/genres/${genreId}`, {
        method: 'PATCH',
        headers: {
            ...cvAuthHeaders(),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name })
    });
},

 deleteGenre: async function(genreId) {
    return await fetch(`${CV_BASE}/admin/genres/${genreId}`, {
        method: 'DELETE',
        headers: cvAuthHeaders()
    });
},

  /* Reviews */
  getReviews: async function(movieId) {
    const res = await fetch(`${CV_BASE}/reviews/${movieId}`, { headers: cvAuthHeaders() });
    if (res.status === 401) { cvHandle401(); return []; }
    if (!res.ok) throw new Error(`GET /reviews/${movieId} → ${res.status}`);
    return await res.json();
  },

  getReviewSummary: async function(movieId) {
    const res = await fetch(`${CV_BASE}/reviews/ai_summary_review/${movieId}`, { headers: cvAuthHeaders() });
    if (res.status === 401) { cvHandle401(); return {}; }
    if (!res.ok) throw new Error(`GET /reviews/ai_summary_review/${movieId} → ${res.status}`);
    return await res.json();
  },

  deleteReview: async function(reviewId) {
    return await fetch(`${CV_BASE}/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: cvAuthHeaders()
    });
  }
};

/* ================================================================
   STATE — single source of truth, never persisted to localStorage
================================================================ */
const CV_State = {
  /* Set<string> of movie_id values the user has favorited */
  favoriteIds:  new Set(),
  /* Set<string> of movie.id values in the user's watchlist */
  watchlistIds: new Set(),
  /* prevent parallel fetches */
  _fetchingFav: false,
  _fetchingWL:  false,
  /* per-movie request lock: movieId → true while request in flight */
  _favLocks: {},
  _wlLocks:  {},
};

/* ================================================================
   FAVORITES
================================================================ */

/**
 * Load favorites from backend.
 * Response: [{id, user_id, movie_id}]
 * We store movie_id as string for safe comparison.
 */
async function cvLoadFavorites() {
  if (!cvLoggedIn()) { CV_State.favoriteIds = new Set(); return; }
  if (CV_State._fetchingFav) return;
  CV_State._fetchingFav = true;
  try {
    const res = await fetch(`${CV_BASE}/favorites/`, { headers: cvAuthHeaders() });
    if (res.status === 401) { cvHandle401(); return; }
    if (!res.ok) throw new Error(`GET /favorites/ → ${res.status}`);
    const list = await res.json();
    /* list = [{id, user_id, movie_id}] */
    CV_State.favoriteIds = new Set(
      (Array.isArray(list) ? list : []).map(item => String(item.movie_id))
    );
  } catch (e) {
    console.warn('[CV] loadFavorites failed:', e.message);
  } finally {
    CV_State._fetchingFav = false;
  }
}

function cvIsFavorite(movieId) {
  return CV_State.favoriteIds.has(String(movieId));
}

/**
 * Toggle favorite. Sends only ONE request. Updates state from
 * backend response. Never assumes local state.
 * Returns: true = now favorited, false = removed, null = error
 */
async function cvToggleFavorite(movieId) {
  if (!cvLoggedIn()) { cvShowAuthPrompt(); return null; }
  const id = String(movieId);
  if (CV_State._favLocks[id]) return null; /* request already in flight */
  CV_State._favLocks[id] = true;

  const wasFav = CV_State.favoriteIds.has(id);

  try {
    let res;
    if (wasFav) {
      res = await fetch(`${CV_BASE}/favorites/delete/${id}`, {
        method: 'DELETE',
        headers: cvAuthHeaders()
      });
    } else {
      res = await fetch(`${CV_BASE}/favorites/add/${id}`, {
        method: 'POST',
        headers: cvAuthHeaders()
      });
    }

    if (res.status === 401) { cvHandle401(); return null; }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      cvToast(body?.detail || 'Something went wrong. Please try again.', 'error');
      return null; /* do NOT change icon */
    }

    /* Refresh from backend — always source of truth */
    await cvLoadFavorites();
    return CV_State.favoriteIds.has(id); /* actual new state */

  } catch (e) {
    console.warn('[CV] toggleFavorite failed:', e.message);
    cvToast('Network error. Please check your connection.', 'error');
    return null;
  } finally {
    delete CV_State._favLocks[id];
  }
}

/* ================================================================
   WATCHLIST
================================================================ */

/**
 * Load watchlist from backend.
 * Response: [{id, movie:{id, title, ...}}]
 * We store movie.id as string.
 */
async function cvLoadWatchlist() {
  if (!cvLoggedIn()) { CV_State.watchlistIds = new Set(); return; }
  if (CV_State._fetchingWL) return;
  CV_State._fetchingWL = true;
  try {
    const res = await fetch(`${CV_BASE}/watchlist/`, { headers: cvAuthHeaders() });
    if (res.status === 401) { cvHandle401(); return; }
    if (!res.ok) throw new Error(`GET /watchlist/ → ${res.status}`);
    const list = await res.json();
    /* list = [{id, movie:{id,...}}] — NOT movie_id, use movie.id */
    CV_State.watchlistIds = new Set(
      (Array.isArray(list) ? list : [])
        .filter(item => item.movie && item.movie.id != null)
        .map(item => String(item.movie.id))
    );
  } catch (e) {
    console.warn('[CV] loadWatchlist failed:', e.message);
  } finally {
    CV_State._fetchingWL = false;
  }
}

function cvIsWatchlisted(movieId) {
  return CV_State.watchlistIds.has(String(movieId));
}

/**
 * Toggle watchlist. One request only. Backend is source of truth.
 */
async function cvToggleWatchlist(movieId) {
  if (!cvLoggedIn()) { cvShowAuthPrompt(); return null; }
  const id = String(movieId);
  if (CV_State._wlLocks[id]) return null;
  CV_State._wlLocks[id] = true;

  const wasWL = CV_State.watchlistIds.has(id);

  try {
    let res;
    if (wasWL) {
      res = await fetch(`${CV_BASE}/watchlist/${id}`, {
        method: 'DELETE',
        headers: cvAuthHeaders()
      });
    } else {
      res = await fetch(`${CV_BASE}/watchlist/add/${id}`, {
        method: 'POST',
        headers: cvAuthHeaders()
      });
    }

    if (res.status === 401) { cvHandle401(); return null; }
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      cvToast(body?.detail || 'Something went wrong. Please try again.', 'error');
      return null;
    }

    /* Refresh from backend */
    await cvLoadWatchlist();
    return CV_State.watchlistIds.has(id);

  } catch (e) {
    console.warn('[CV] toggleWatchlist failed:', e.message);
    cvToast('Network error. Please check your connection.', 'error');
    return null;
  } finally {
    delete CV_State._wlLocks[id];
  }
}

/* ================================================================
   INIT — call on every page after DOM ready
================================================================ */
async function cvInit() {
  if (!cvLoggedIn()) return;
  await Promise.all([cvLoadFavorites(), cvLoadWatchlist()]);
}

/* ================================================================
   AUTH PROMPT
================================================================ */
function cvShowAuthPrompt() {
  /* Remove existing if any */
  document.getElementById('cv-auth-modal')?.remove();

  const modal = document.createElement('div');
  modal.id = 'cv-auth-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.style.cssText = `
    position:fixed;inset:0;z-index:99999;
    display:flex;align-items:center;justify-content:center;
    background:rgba(0,0,0,0.7);backdrop-filter:blur(6px);
    animation:cvFadeIn 0.2s ease;
  `;
  modal.innerHTML = `
    <style>
      @keyframes cvFadeIn{from{opacity:0}to{opacity:1}}
      @keyframes cvSlideUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:none}}
    </style>
    <div style="
      background:linear-gradient(145deg,rgba(20,12,8,0.98),rgba(10,6,18,0.98));
      border:1px solid rgba(232,168,56,0.3);
      border-radius:20px;padding:40px 36px;
      max-width:380px;width:90%;text-align:center;
      box-shadow:0 24px 64px rgba(0,0,0,0.6),0 0 0 1px rgba(232,168,56,0.1);
      animation:cvSlideUp 0.25s cubic-bezier(0.16,1,0.3,1);
    ">
      <div style="
        width:60px;height:60px;margin:0 auto 20px;
        background:rgba(232,168,56,0.1);border:1.5px solid rgba(232,168,56,0.3);
        border-radius:50%;display:flex;align-items:center;justify-content:center;
      ">
        <svg viewBox="0 0 24 24" fill="none" stroke="#e8a838" stroke-width="1.5" width="28" height="28">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </div>
      <h2 style="font-family:'Bebas Neue',sans-serif;font-size:1.8rem;letter-spacing:0.06em;color:#fff;margin-bottom:10px;">Sign In Required</h2>
      <p style="font-size:0.875rem;color:rgba(255,255,255,0.5);line-height:1.6;margin-bottom:28px;">
        Please sign in to add movies to your Favorites &amp; Watchlist.
      </p>
      <div style="display:flex;gap:10px;">
        <a href="login.html" style="
          flex:1;padding:12px;text-align:center;
          background:linear-gradient(135deg,#e8a838,#f5c451);
          color:#0a0a0f;font-weight:700;font-size:0.875rem;
          letter-spacing:0.05em;text-decoration:none;border-radius:10px;
          transition:filter 0.2s;
        " onmouseover="this.style.filter='brightness(1.1)'" onmouseout="this.style.filter=''">
          Sign In
        </a>
        <button onclick="document.getElementById('cv-auth-modal').remove()" style="
          flex:1;padding:12px;
          background:rgba(255,255,255,0.07);
          border:1px solid rgba(255,255,255,0.12);
          color:rgba(255,255,255,0.6);font-size:0.875rem;
          border-radius:10px;cursor:pointer;
          transition:background 0.2s;
        " onmouseover="this.style.background='rgba(255,255,255,0.12)'" onmouseout="this.style.background='rgba(255,255,255,0.07)'">
          Dismiss
        </button>
      </div>
    </div>
  `;

  /* Close on backdrop click */
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  document.body.appendChild(modal);
}

/* ================================================================
   TOAST
================================================================ */
function cvToast(message, type = 'success') {
  /* Use existing toast container if present */
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:99998;display:flex;flex-direction:column;gap:8px;pointer-events:none;';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;

  /* Inline fallback styles if project CSS not loaded */
  if (!document.querySelector('.toast')) {
    toast.style.cssText = `
      display:flex;align-items:center;gap:10px;
      padding:12px 18px;border-radius:12px;
      background:rgba(14,10,24,0.95);backdrop-filter:blur(12px);
      border:1px solid ${type === 'success' ? 'rgba(34,211,160,0.3)' : 'rgba(239,68,68,0.3)'};
      color:#fff;font-size:0.875rem;font-weight:500;
      box-shadow:0 8px 24px rgba(0,0,0,0.4);
      pointer-events:all;
      animation:cvToastIn 0.3s cubic-bezier(0.16,1,0.3,1);
    `;
  }

  toast.innerHTML = `
    <style>@keyframes cvToastIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}</style>
    <span class="toast__icon">${type === 'success' ? '✓' : '!'}</span>
    <span class="toast__message">${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'opacity 0.3s, transform 0.3s';
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(4px)';
    setTimeout(() => toast.remove(), 320);
  }, 3000);
}