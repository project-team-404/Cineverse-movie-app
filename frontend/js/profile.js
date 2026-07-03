// profile.js — CineVerse Profile Page
// Vanilla JS, no modules, follows cv-api.js conventions
const API_BASE = window.API_BASE||
    "https://cineverse-movie-app.onrender.com";;
// ── Auth Guard ────────────────────────────────
(function () {
  if (!localStorage.getItem('access_token')) {
    window.location.href = 'login.html';
  }
})();

// ── State ─────────────────────────────────────
var selectedFile  = null;
var profileExists = false;

// ── Init ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', function () {
  loadUserInfo();
  setupPhotoControls();
  setupDragDrop();

  // Fetch all data in parallel
  Promise.all([
    loadProfile(),
    loadFavoritesCount(),
    loadWatchlist()
  ]);
});

// ── User info from localStorage ───────────────
function loadUserInfo() {
  var name  = localStorage.getItem('user_name')  || 'CineVerse User';
  var email = localStorage.getItem('user_email') || '';
  document.getElementById('pf-name').textContent  = name;
  document.getElementById('pf-email').textContent = email;
}

// ── Load Profile ──────────────────────────────
async function loadProfile() {
  try {
    var res = await CV_Profile.getProfile();

    if (res.status === 401) {
      localStorage.removeItem('access_token');
      window.location.href = 'login.html';
      return;
    }

    if (res.status === 404 || !res.ok) {
      showCreate();
      return;
    }

    var data = await res.json();
    fillProfileFields(data);
    showEdit();
    profileExists = true;

  } catch (err) {
    console.error('[Profile] loadProfile error:', err);
    cvToast('Network Error. Could not load profile.', 'error');
    showCreate();
  }
}

// ── Fill edit form with API data ──────────────
function fillProfileFields(data) {
  if (data.favorite_movie) {
    document.getElementById('edit-movie').value = data.favorite_movie;
  }
  if (data.preferred_language) {
    document.getElementById('edit-lang').value = data.preferred_language;
  }
  if (data.profile_picture) {
var base =
    API_BASE ||
    'https://cineverse-movie-app.onrender.com';
    var src  = data.profile_picture.startsWith('http')
      ? data.profile_picture
      : base + '/' + data.profile_picture;
    updateAvatarSrc(src);
  }
}

// ── Section toggles ───────────────────────────
function showCreate() {
  document.getElementById('pf-create').hidden = false;
  document.getElementById('pf-edit').hidden   = true;
}

function showEdit() {
  document.getElementById('pf-create').hidden = true;
  document.getElementById('pf-edit').hidden   = false;
}

// ── Favorites count ───────────────────────────
async function loadFavoritesCount() {
  try {
    var list  = await CV_Favorites.getFavorites();
    var count = Array.isArray(list) ? list.length : 0;
    var el    = document.getElementById('stat-favorites');
    if (el) el.textContent = count + ' Movie' + (count !== 1 ? 's' : '');
  } catch (err) {
    console.warn('[Profile] favorites count error:', err);
  }
}

// ── Watchlist ─────────────────────────────────
async function loadWatchlist() {
  try {
    var list  = await CV_Watchlist.getWatchlist();
    var items = Array.isArray(list) ? list : [];

    // Count
    var el = document.getElementById('stat-watchlist');
    if (el) el.textContent = items.length + ' Movie' + (items.length !== 1 ? 's' : '');

    // Render latest 4
    renderWatchlistGrid(items.slice(0, 4));

  } catch (err) {
    console.warn('[Profile] watchlist error:', err);
  }
}

function renderWatchlistGrid(items) {
  var grid = document.getElementById('watchlist-grid');
  if (!grid) return;

  if (!items || items.length === 0) {
    grid.innerHTML =
      '<div class="pf-watchlist-empty">' +
        '<span aria-hidden="true">🎞️</span>' +
        '<p>No movies in watchlist</p>' +
      '</div>';
    return;
  }

  grid.innerHTML = items.map(function (item) {
    var movie  = item.movie || {};
    var title  = movie.title      || 'Unknown';
    var poster = movie.poster_url || '';
    var href   = 'movie-details.html?id=' + (movie.id || '');

    var imgHtml = poster
      ? '<img src="' + poster + '" alt="' + title + '" loading="lazy" onerror="this.parentElement.style.background=\'rgba(255,255,255,0.05)\'">'
      : '';

    return '<a class="pf-watchlist-movie" href="' + href + '">' +
      '<div class="pf-watchlist-poster">' + imgHtml + '</div>' +
      '<p class="pf-watchlist-title">' + title + '</p>' +
    '</a>';
  }).join('');
}

// ── Photo controls ────────────────────────────
function setupPhotoControls() {
  var input = document.getElementById('photo-input');

  input.addEventListener('change', function () {
    if (this.files && this.files[0]) handleFileSelect(this.files[0]);
  });

  // Avatar wrap click triggers input
  document.getElementById('avatar-wrap').addEventListener('click', function () {
    input.click();
  });

  // Upload zone clicks
  ['create-upload-zone', 'edit-upload-zone'].forEach(function (id) {
    var zone = document.getElementById(id);
    if (zone) {
      zone.addEventListener('click', function () { input.click(); });
      zone.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') input.click();
      });
    }
  });
}

function setupDragDrop() {
  ['create-upload-zone', 'edit-upload-zone'].forEach(function (id) {
    var zone = document.getElementById(id);
    if (!zone) return;

    zone.addEventListener('dragover', function (e) {
      e.preventDefault();
      zone.classList.add('drag-over');
    });
    zone.addEventListener('dragleave', function () {
      zone.classList.remove('drag-over');
    });
    zone.addEventListener('drop', function (e) {
      e.preventDefault();
      zone.classList.remove('drag-over');
      var file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) handleFileSelect(file);
    });
  });
}

function handleFileSelect(file) {
  selectedFile = file;
  var reader = new FileReader();
  reader.onload = function (e) { updateAvatarSrc(e.target.result); };
  reader.readAsDataURL(file);
}

function updateAvatarSrc(src) {
  document.getElementById('pf-avatar').src = src;
}

// ── Build FormData ────────────────────────────
function buildFormData(movieId, langId) {
  var formData = new FormData();
  if (selectedFile)  formData.append('photo', selectedFile);
  var movie = document.getElementById(movieId).value.trim();
  var lang  = document.getElementById(langId).value.trim();
  if (movie) formData.append('favorite_movie',    movie);
  if (lang)  formData.append('preferred_language', lang);
  return formData;
}

// ── Create ────────────────────────────────────
async function handleCreate() {
  if (!selectedFile) {
    cvToast('Please upload a profile photo first.', 'error');
    return;
  }

  var btn     = document.getElementById('create-btn');
  var btnText = document.getElementById('create-btn-text');
  btn.disabled        = true;
  btnText.textContent = 'Creating...';

  try {
    var fd  = buildFormData('create-movie', 'create-lang');
    var res = await CV_Profile.createProfile(fd);

    if (res.ok) {
      var data = await res.json();
      cvToast('Profile Created Successfully! 🎬', 'success');
      fillProfileFields(data);
      showEdit();
      profileExists = true;
      selectedFile  = null;
      loadFavoritesCount();
      loadWatchlist();
    } else {
      var err = await res.json().catch(function () { return {}; });
      cvToast(err.detail || 'Failed to create profile.', 'error');
    }
  } catch (err) {
    console.error('[Profile] create error:', err);
    cvToast('Network Error. Please try again.', 'error');
  } finally {
    btn.disabled        = false;
    btnText.textContent = 'Create Profile';
  }
}

// ── Update ────────────────────────────────────
async function handleUpdate() {
  var btn     = document.getElementById('save-btn');
  var btnText = document.getElementById('save-btn-text');
  btn.disabled        = true;
  btnText.textContent = 'Saving...';

  try {
    var fd  = buildFormData('edit-movie', 'edit-lang');
    var res = await CV_Profile.updateProfile(fd);

    if (res.ok) {
      var data = await res.json();
      cvToast('Profile Updated Successfully! ✨', 'success');
      fillProfileFields(data);
      selectedFile = null;
    } else {
      var err = await res.json().catch(function () { return {}; });
      cvToast(err.detail || 'Failed to update profile.', 'error');
    }
  } catch (err) {
    console.error('[Profile] update error:', err);
    cvToast('Network Error. Please try again.', 'error');
  } finally {
    btn.disabled        = false;
    btnText.textContent = 'Save Changes';
  }
}

// ── Delete ────────────────────────────────────
function openDeleteModal() {
  document.getElementById('delete-modal').classList.add('open');
}

function closeDeleteModal() {
  document.getElementById('delete-modal').classList.remove('open');
}

async function handleDelete() {
  var btn     = document.getElementById('confirm-delete-btn');
  var btnText = document.getElementById('confirm-delete-text');
  btn.disabled        = true;
  btnText.textContent = 'Deleting...';

  try {
    var res = await CV_Profile.deleteProfile();

    if (res.ok) {
      cvToast('Profile Deleted Successfully.', 'success');
      setTimeout(function () { window.location.href = 'home.html'; }, 1200);
    } else {
      var err = await res.json().catch(function () { return {}; });
      cvToast(err.detail || 'Failed to delete profile.', 'error');
      btn.disabled        = false;
      btnText.textContent = 'Yes, Delete';
      closeDeleteModal();
    }
  } catch (err) {
    console.error('[Profile] delete error:', err);
    cvToast('Network Error. Please try again.', 'error');
    btn.disabled        = false;
    btnText.textContent = 'Yes, Delete';
  }
}

// Close modal on overlay click
document.getElementById('delete-modal').addEventListener('click', function (e) {
  if (e.target === this) closeDeleteModal();
});