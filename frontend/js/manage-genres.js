// manage-genres.js — CineVerse Manage Genres

// ── Auth Guard ─────────────────────────────────
(function() {
  if (!localStorage.getItem('access_token')) {
    window.location.href = 'login.html';
  }
})();

// ── State ─────────────────────────────────────
var deleteGenreId = null;

// ── Modal Helpers ─────────────────────────────
function openModal(id) {
  document.getElementById(id).classList.add('open');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

document.querySelectorAll('.modal-overlay').forEach(function(overlay) {
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});

// ── Render Genres Table ───────────────────────
function renderGenresTable(genres) {
  var container  = document.getElementById('genres-table-body');
  var countLabel = document.getElementById('genres-count-label');

  if (!genres || genres.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎭</div><h3>No genres found</h3><p>Add your first genre to get started.</p></div>';
    countLabel.textContent = '0 genres';
    return;
  }

  countLabel.textContent = genres.length + ' genre' + (genres.length !== 1 ? 's' : '');

  var rows = genres.map(function(genre) {
    return '<tr>' +
      '<td>' + genre.id + '</td>' +
      '<td><strong>' + genre.name + '</strong></td>' +
      '<td><div class="actions-cell">' +
        '<button class="btn btn-ghost btn-sm" onclick="openEditGenreModal(' + genre.id + ', \'' + genre.name.replace(/'/g, "\\'") + '\')">✏️ Edit</button>' +
        '<button class="btn btn-danger btn-sm" onclick="openDeleteGenreModal(' + genre.id + ', \'' + genre.name.replace(/'/g, "\\'") + '\')">🗑️ Delete</button>' +
      '</div></td>' +
    '</tr>';
  }).join('');

  container.innerHTML =
    '<table>' +
      '<thead><tr>' +
        '<th>#</th>' +
        '<th>Genre Name</th>' +
        '<th>Actions</th>' +
      '</tr></thead>' +
      '<tbody>' + rows + '</tbody>' +
    '</table>';
}

// ── Load Genres ───────────────────────────────
async function loadGenres() {
  document.getElementById('genres-table-body').innerHTML =
    '<div class="loading-spinner"><div class="spinner"></div> Loading genres...</div>';

  try {
    var genres = await CV_Admin.getGenres();
    renderGenresTable(Array.isArray(genres) ? genres : []);
  } catch (err) {
    console.error('[Genres] Load error:', err);
    document.getElementById('genres-table-body').innerHTML =
      '<div class="empty-state"><div class="empty-state-icon">⚠️</div><h3>Failed to load genres</h3></div>';
  }
}

// ── Add Genre ─────────────────────────────────
function openAddGenreModal() {
  document.getElementById('add-genre-name').value = '';
  openModal('add-genre-modal');
}

async function submitAddGenre() {

  var name = document.getElementById('add-genre-name').value.trim();

  if (!name) {
    cvToast('Genre name is required', 'error');
    return;
  }

  var btn = document.getElementById('add-genre-btn');

  btn.disabled = true;
  btn.textContent = 'Adding...';

  try {

    var res = await CV_Admin.createGenre(name);

    console.log("Status:", res.status);

    const body = await res.text();

    console.log("Response:", body);

    if (res.ok) {

      cvToast(
        'Genre added successfully!',
        'success'
      );

      closeModal('add-genre-modal');

      loadGenres();

    } else {

      cvToast(
        body,
        'error'
      );

    }

  } catch (err) {

    console.error(err);

    cvToast(
      'Network error. Try again.',
      'error'
    );

  } finally {

    btn.disabled = false;

    btn.textContent = 'Add Genre';

  }

}
/*async function submitAddGenre() {
  var name = document.getElementById('add-genre-name').value.trim();
  if (!name) { cvToast('Genre name is required', 'error'); return; }

  var btn = document.getElementById('add-genre-btn');
  btn.disabled = true;
  btn.textContent = 'Adding...';

  try {
    var res = await CV_Admin.createGenre(name);
    if (res.ok) {
      cvToast('Genre added successfully!', 'success');
      closeModal('add-genre-modal');
      loadGenres();
    } else {
      var err = await res.json();
      cvToast(err.detail || 'Failed to add genre', 'error');
    }
  } catch (err) {
    cvToast('Network error. Try again.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Add Genre';
  }
}*/

// ── Edit Genre ────────────────────────────────
function openEditGenreModal(id, name) {
  document.getElementById('edit-genre-id').value   = id;
  document.getElementById('edit-genre-name').value = name;
  openModal('edit-genre-modal');
}

async function submitEditGenre() {
  var id   = document.getElementById('edit-genre-id').value;
  var name = document.getElementById('edit-genre-name').value.trim();
  if (!name) { cvToast('Genre name is required', 'error'); return; }

  var btn = document.getElementById('edit-genre-btn');
  btn.disabled = true;
  btn.textContent = 'Saving...';

  try {
    var res = await CV_Admin.updateGenre(id, name);
    if (res.ok) {
      cvToast('Genre updated successfully!', 'success');
      closeModal('edit-genre-modal');
      loadGenres();
    } else {
      var err = await res.json();
      cvToast(err.detail || 'Failed to update genre', 'error');
    }
  } catch (err) {
    cvToast('Network error. Try again.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save Changes';
  }
}

// ── Delete Genre ──────────────────────────────
function openDeleteGenreModal(id, name) {
  deleteGenreId = id;
  document.getElementById('delete-genre-name-label').textContent = name;
  openModal('delete-genre-modal');
}

async function submitDeleteGenre() {
  var btn = document.getElementById('delete-genre-btn');
  btn.disabled = true;
  btn.textContent = 'Deleting...';

  try {
    var res = await CV_Admin.deleteGenre(deleteGenreId);
    if (res.ok) {
      cvToast('Genre deleted successfully!', 'success');
      closeModal('delete-genre-modal');
      loadGenres();
    } else {
      var err = await res.json();
      cvToast(err.detail || 'Failed to delete genre', 'error');
    }
  } catch (err) {
    cvToast('Network error. Try again.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Yes, Delete';
    deleteGenreId = null;
  }
}

// ── Init ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  loadGenres();
});