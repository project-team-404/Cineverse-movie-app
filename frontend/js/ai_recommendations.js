

(() => {
  'use strict';

 
  const API_BASE = window.API_BASE || 'https://cineverse-movie-app.onrender.com';
  const LOADING_MESSAGES = [
    'Analyzing your preferences...',
    'Understanding your request...',
    'Searching movie database...',
    'Finding the perfect matches...',
    'Preparing recommendations...'
  ];
  const SKELETON_COUNT = 10;

 
  const dom = {
    form: document.getElementById('air-form'),
    textarea: document.getElementById('air-textarea'),
    charCounter: document.getElementById('air-char-counter'),
    validation: document.getElementById('air-validation'),
    askBtn: document.getElementById('air-ask-btn'),
    promptChips: document.querySelectorAll('.air-chip'),

    loadingSection: document.getElementById('air-loading'),
    loadingMessage: document.getElementById('air-loading-message'),
    skeletonGrid: document.getElementById('air-skeleton-grid'),

    resultsSection: document.getElementById('air-results'),
    resultsGrid: document.getElementById('air-results-grid'),
    explanationText: document.getElementById('air-explanation-text'),

    emptySection: document.getElementById('air-empty'),
    tryAgainBtn: document.getElementById('air-try-again-btn'),

    loginModal: document.getElementById('air-login-modal'),
    modalLogin: document.getElementById('air-modal-login'),

    toastContainer: document.getElementById('toast-container')
  };

  /* ---------------------------------------------------------------------
     State
     --------------------------------------------------------------------- */
  const state = {
    loadingMessageTimer: null,
    favoriteIds: new Set(),
    watchlistIds: new Set(),
    isSubmitting: false
  };

  /* ---------------------------------------------------------------------
     Auth helpers
     --------------------------------------------------------------------- */
  function getToken() {
    return localStorage.getItem('access_token');
  }
  function isLoggedIn() {
    return Boolean(getToken());
  }
  function authHeaders() {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
  function goToLogin() {
    window.location.href = 'login.html';
  }

  /* ---------------------------------------------------------------------
     API helper
     --------------------------------------------------------------------- */
  class ApiError extends Error {
    constructor(kind, message) {
      super(message);
      this.kind = kind;
    }
  }

  function extractErrorMessage(data) {
    if (!data) return null;
    if (typeof data.detail === 'string') return data.detail;
    if (Array.isArray(data.detail) && data.detail.length) {
      return data.detail.map((d) => d.msg).filter(Boolean).join(' ');
    }
    if (typeof data.message === 'string') return data.message;
    return null;
  }

  async function apiRequest(path, options = {}) {
    let response;
    try {
      response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders(),
          ...(options.headers || {})
        }
      });
    } catch (_) {
      throw new ApiError('network', 'Unable to contact AI.');
    }

    if (response.status === 401) {
      throw new ApiError('unauthorized', 'Your session has expired. Please login again.');
    }
    if (!response.ok) {
      let message = 'Something went wrong. Please try again.';
      try {
        message = extractErrorMessage(await response.json()) || message;
      } catch (_) { /* not JSON */ }
      throw new ApiError('backend', message);
    }
    if (response.status === 204) return null;
    return response.json();
  }

  /* ---------------------------------------------------------------------
     Toasts (injected into the shared #toast-container)
     --------------------------------------------------------------------- */
  const TOAST_ICONS = {
    error: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 8v5M12 16h.01M10.29 3.86l-8.18 14.18A1 1 0 003 19.5h18a1 1 0 00.87-1.46L13.71 3.86a1 1 0 00-1.73 0z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    success: '<svg viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none"><path d="M12 16v-4m0-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  function showToast(message, type = 'info', duration = 4200) {
    if (!dom.toastContainer) return;
    const el = document.createElement('div');
    el.className = `air-toast air-toast--${type}`;
    el.setAttribute('role', 'status');
    el.innerHTML = `${TOAST_ICONS[type] || TOAST_ICONS.info}<span>${escapeHtml(message)}</span>`;
    dom.toastContainer.appendChild(el);
    setTimeout(() => {
      el.classList.add('leaving');
      el.addEventListener('animationend', () => el.remove(), { once: true });
    }, duration);
  }

  /* ---------------------------------------------------------------------
     Login modal
     --------------------------------------------------------------------- */
  function openLoginModal() { dom.loginModal?.classList.add('active'); }
  dom.modalLogin?.addEventListener('click', goToLogin);

  /* ---------------------------------------------------------------------
     Character counter + validation
     --------------------------------------------------------------------- */
  dom.textarea?.addEventListener('input', () => {
    const len = dom.textarea.value.length;
    dom.charCounter.textContent = `${len} / 500`;
    dom.charCounter.classList.toggle('warn', len > 440);
    if (dom.textarea.value.trim().length > 0) hideValidation();
  });

  function showValidation() { dom.validation?.classList.add('show'); }
  function hideValidation() { dom.validation?.classList.remove('show'); }

  dom.promptChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      dom.textarea.value = chip.dataset.prompt || '';
      dom.textarea.dispatchEvent(new Event('input'));
      dom.textarea.focus();
    });
  });

  /* ---------------------------------------------------------------------
     Loading state
     --------------------------------------------------------------------- */
  function startLoading() {
    dom.resultsSection.classList.remove('active');
    dom.emptySection.classList.remove('active');
    dom.loadingSection.classList.add('active');
    renderSkeletons();

    dom.textarea.disabled = true;
    dom.askBtn.disabled = true;
    dom.askBtn.classList.add('loading');

    let i = 0;
    dom.loadingMessage.textContent = LOADING_MESSAGES[0];
    state.loadingMessageTimer = setInterval(() => {
      i = (i + 1) % LOADING_MESSAGES.length;
      dom.loadingMessage.style.opacity = 0;
      setTimeout(() => {
        dom.loadingMessage.textContent = LOADING_MESSAGES[i];
        dom.loadingMessage.style.opacity = 1;
      }, 200);
    }, 1700);
  }

  function stopLoading() {
    dom.loadingSection.classList.remove('active');
    clearInterval(state.loadingMessageTimer);
    dom.textarea.disabled = false;
    dom.askBtn.disabled = false;
    dom.askBtn.classList.remove('loading');
  }

  function renderSkeletons() {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < SKELETON_COUNT; i++) {
      const card = document.createElement('div');
      card.className = 'skeleton-card';
      card.innerHTML = `
        <div class="skeleton skeleton-poster"></div>
        <div class="skeleton skeleton-title"></div>
        <div class="skeleton skeleton-meta"></div>`;
      fragment.appendChild(card);
    }
    dom.skeletonGrid.innerHTML = '';
    dom.skeletonGrid.appendChild(fragment);
  }

  /* ---------------------------------------------------------------------
     Favorites & Watchlist (talks to the real backend endpoints)
     --------------------------------------------------------------------- */
  async function loadUserCollections() {
    if (!isLoggedIn()) return;
    try {
      const [favorites, watchlist] = await Promise.all([
        apiRequest('/favorites/'),
        apiRequest('/watchlist/')
      ]);
      state.favoriteIds = new Set((favorites || []).map((f) => f.movie_id));
      state.watchlistIds = new Set((watchlist || []).map((w) => w.movie_id));
    } catch (_) {
      /* buttons default to unpressed if this fails */
    }
  }

  async function toggleFavorite(movieId, btn) {
    if (!isLoggedIn()) { openLoginModal(); return; }
    const isActive = state.favoriteIds.has(movieId);
    try {
      if (isActive) {
        await apiRequest(`/favorites/${movieId}`, { method: 'DELETE' });
        state.favoriteIds.delete(movieId);
      } else {
        await apiRequest(`/favorites/${movieId}`, { method: 'POST' });
        state.favoriteIds.add(movieId);
      }
      setActive(btn, !isActive);
    } catch (err) {
      handleApiError(err, 'Unable to update favorites.');
    }
  }

  async function toggleWatchlist(movieId, btn) {
    if (!isLoggedIn()) { openLoginModal(); return; }
    const isActive = state.watchlistIds.has(movieId);
    try {
      if (isActive) {
        await apiRequest(`/watchlist/${movieId}`, { method: 'DELETE' });
        state.watchlistIds.delete(movieId);
      } else {
        await apiRequest(`/watchlist/add/${movieId}`, { method: 'POST' });
        state.watchlistIds.add(movieId);
      }
      setActive(btn, !isActive);
    } catch (err) {
      handleApiError(err, 'Unable to update watchlist.');
    }
  }

  function setActive(btn, active) {
    btn.classList.toggle('active', active);
    btn.setAttribute('aria-pressed', String(active));
  }

  /* ---------------------------------------------------------------------
     MGC movie card (same visual system used by the rest of CineVerse)
     --------------------------------------------------------------------- */
  function formatDuration(minutes) {
    if (minutes === null || minutes === undefined) return '';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  function buildMovieCard(movie, index) {
    const card = document.createElement('article');
    card.className = 'mgc';
    card.style.animationDelay = `${Math.min(index * 0.05, 0.5)}s`;
    card.setAttribute('role', 'listitem');

    const isFav = state.favoriteIds.has(movie.id);
    const isWatch = state.watchlistIds.has(movie.id);
    const genreName = movie.genre && movie.genre.name ? movie.genre.name : '';

    card.innerHTML = `
      <div class="mgc-poster">
        <img src="${escapeAttr(movie.poster_url || '')}" alt="${escapeAttr(movie.title || 'Movie poster')}" loading="lazy">
        <div class="mgc-rating" aria-label="Rating ${movie.rating ?? 'N/A'}">
          <svg viewBox="0 0 24 24" fill="currentColor" width="11" height="11"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          <span>${movie.rating ?? '—'}</span>
        </div>
        <div class="mgc-gradient"></div>
        <div class="mgc-actions">
          <a class="mgc-play-btn" href="movie-details.html?id=${encodeURIComponent(movie.id)}" aria-label="View details">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M8 5v14l11-7z"/></svg>
          </a>
          <div class="mgc-action-row">
            <button type="button" class="mgc-action-btn mgc-fav-btn ${isFav ? 'active' : ''}" aria-pressed="${isFav}" aria-label="Toggle favorite">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.8"><path d="M12 21s-7.5-4.6-10-9.1C.6 8.3 2.3 5 5.6 5c1.9 0 3.5 1 4.4 2.5C10.9 6 12.5 5 14.4 5c3.3 0 5 3.3 3.6 6.9C19.5 16.4 12 21 12 21z" stroke-linejoin="round"/></svg>
            </button>
            <button type="button" class="mgc-action-btn mgc-watch-btn ${isWatch ? 'active' : ''}" aria-pressed="${isWatch}" aria-label="Toggle watchlist">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="${isWatch ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" stroke-linejoin="round"/></svg>
            </button>
          </div>
        </div>
      </div>
      <div class="mgc-info">
        <a href="movie-details.html?id=${encodeURIComponent(movie.id)}" class="mgc-title">${escapeHtml(movie.title || 'Untitled')}</a>
        <div class="mgc-meta-row">
          <span>${movie.release_year ?? ''}</span>
          <span>${escapeHtml(formatDuration(movie.duration))}</span>
          <span>${escapeHtml(movie.language || '')}</span>
          ${genreName ? `<span class="mgc-genre-tag">${escapeHtml(genreName)}</span>` : ''}
        </div>
      </div>
    `;

    card.querySelector('.mgc-fav-btn').addEventListener('click', (e) => {
      e.preventDefault();
      toggleFavorite(movie.id, e.currentTarget);
    });
    card.querySelector('.mgc-watch-btn').addEventListener('click', (e) => {
      e.preventDefault();
      toggleWatchlist(movie.id, e.currentTarget);
    });

    return card;
  }

  function renderResults(movies, explanation) {
    dom.explanationText.textContent = explanation || '';
    dom.resultsGrid.innerHTML = '';
    const fragment = document.createDocumentFragment();
    movies.forEach((movie, idx) => fragment.appendChild(buildMovieCard(movie, idx)));
    dom.resultsGrid.appendChild(fragment);

    dom.emptySection.classList.remove('active');
    dom.resultsSection.classList.add('active');
  }

  function renderEmptyState() {
    dom.resultsSection.classList.remove('active');
    dom.emptySection.classList.add('active');
  }

  /* ---------------------------------------------------------------------
     Core flow
     --------------------------------------------------------------------- */
  async function fetchMovieById(id) {
    return apiRequest(`/movies/${id}`);
  }

  async function handleAskAI(message) {
    startLoading();
    try {
      const aiResponse = await apiRequest('/ai_recommendation/', {
        method: 'POST',
        body: JSON.stringify({ message })
      });

      const movieIds = Array.isArray(aiResponse?.movie_ids) ? aiResponse.movie_ids : [];
      const explanation = aiResponse?.explanation || '';

      if (movieIds.length === 0) {
        stopLoading();
        renderEmptyState();
        return;
      }

      const uniqueIds = [...new Set(movieIds)];
      const movies = await Promise.all(uniqueIds.map((id) => fetchMovieById(id)));

      stopLoading();
      renderResults(movies, explanation);
    } catch (err) {
      stopLoading();
      handleApiError(err, 'Unable to contact AI.');
    }
  }

  function handleApiError(err, fallbackMessage) {
    if (err instanceof ApiError) {
      if (err.kind === 'unauthorized') {
        showToast('Your session has expired. Please login again.', 'error');
        setTimeout(goToLogin, 1200);
        return;
      }
      if (err.kind === 'network') {
        showToast('Unable to contact AI.', 'error');
        return;
      }
      showToast(err.message || fallbackMessage, 'error');
      return;
    }
    showToast(fallbackMessage, 'error');
  }

  /* ---------------------------------------------------------------------
     Form submission
     --------------------------------------------------------------------- */
  dom.form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (state.isSubmitting) return;

    const message = dom.textarea.value.trim();
    if (!message) {
      showValidation();
      dom.textarea.focus();
      return;
    }
    hideValidation();

    if (!isLoggedIn()) {
      openLoginModal();
      return;
    }

    state.isSubmitting = true;
    await handleAskAI(message);
    state.isSubmitting = false;
  });

  dom.tryAgainBtn?.addEventListener('click', () => {
    dom.emptySection.classList.remove('active');
    dom.textarea.focus();
  });

  /* ---------------------------------------------------------------------
     Utils
     --------------------------------------------------------------------- */
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  function escapeAttr(str) {
    return escapeHtml(str);
  }

  /* ---------------------------------------------------------------------
     Init
     --------------------------------------------------------------------- */
  (async function init() {
    if (dom.charCounter) dom.charCounter.textContent = `${dom.textarea.value.length} / 500`;
    await loadUserCollections();
  })();
})();