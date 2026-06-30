// manage-movies.js — CineVerse Manage Movies

// ── Auth Guard ─────────────────────────────────
(function() {
  if (!localStorage.getItem('access_token')) {
    window.location.href = 'login.html';
  }
})();

// ── State ─────────────────────────────────────
var currentPage   = 1;
var pageLimit     = 10;
var totalMovies   = [];
var allGenres     = [];
var deleteMovieId = null;
var editMovieId   = null;

// ── Modal Helpers ─────────────────────────────
function openModal(id) {
  document.getElementById(id).classList.add('open');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('open');
}

// Close modal on overlay click
document.querySelectorAll('.modal-overlay').forEach(function(overlay) {
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) overlay.classList.remove('open');
  });
});

// ── Render Movies Table ───────────────────────
function renderMoviesTable(movies) {
  var container = document.getElementById('movies-table-body');
  var countLabel = document.getElementById('movies-count-label');

  if (!movies || movies.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🎬</div><h3>No movies found</h3><p>Add your first movie to get started.</p></div>';
    document.getElementById('pagination').style.display = 'none';
    countLabel.textContent = '0 movies';
    return;
  }

  countLabel.textContent = movies.length + ' movie' + (movies.length !== 1 ? 's' : '');

  var rows = movies.map(function(movie) {
    var poster = movie.poster_url
      ? '<img src="' + movie.poster_url + '" class="movie-poster-thumb" alt="' + movie.title + '" onerror="this.style.display=\'none\'">'
      : '<div class="movie-poster-placeholder">🎬</div>';

    var genre = movie.genre ? movie.genre.name : '—';
    var rating = movie.rating ? '⭐ ' + Number(movie.rating).toFixed(1) : '—';

    return '<tr>' +
    '<td><span class="badge">#' + movie.id + '</span></td>' +
      '<td>' + poster + '</td>' +
      '<td><strong>' + movie.title + '</strong></td>' +
      '<td><span class="badge">' + genre + '</span></td>' +
      '<td>' + (movie.release_year || '—') + '</td>' +
      '<td><span class="rating-badge">' + rating + '</span></td>' +
      '<td><div class="actions-cell">' +
        '<button class="btn btn-ghost btn-sm" onclick="openEditModal(' + movie.id + ')">✏️ Edit</button>' +
        '<button class="btn btn-danger btn-sm" onclick="openDeleteModal(' + movie.id + ', \'' + movie.title.replace(/'/g, "\\'") + '\')">🗑️ Delete</button>' +
        '<button class="btn btn-ghost btn-sm" onclick="openImagesModal(' + movie.id + ')">🖼️ Images</button>' +
      '</div></td>' +
    '</tr>';
  }).join('');

  container.innerHTML =
    '<table>' +
      '<thead><tr>' +
       '<th>ID</th>' +
        '<th>Poster</th>' +
        '<th>Title</th>' +
        '<th>Genre</th>' +
        '<th>Year</th>' +
        '<th>Rating</th>' +
        '<th>Actions</th>' +
      '</tr></thead>' +
      '<tbody>' + rows + '</tbody>' +
    '</table>';

  // Pagination
  var pagination = document.getElementById('pagination');
  pagination.style.display = 'flex';
  document.getElementById('pagination-info').textContent = 'Page ' + currentPage;
  document.getElementById('prev-btn').disabled = currentPage === 1;
  document.getElementById('next-btn').disabled = movies.length !== pageLimit;
}

// ── Load Movies ───────────────────────────────
async function loadMovies() {
  document.getElementById('movies-table-body').innerHTML =
    '<div class="loading-spinner"><div class="spinner"></div> Loading movies...</div>';

  try {
    var movies = await CV_Admin.getMovies(currentPage, pageLimit);
    totalMovies = Array.isArray(movies) ? movies : [];
    renderMoviesTable(totalMovies);
  } catch (err) {
    console.error('[Movies] Load error:', err);
    document.getElementById('movies-table-body').innerHTML =
      '<div class="empty-state"><div class="empty-state-icon">⚠️</div><h3>Failed to load movies</h3><p>Check your connection and try again.</p></div>';
  }
}

// ── Load Genres for Dropdowns ─────────────────
async function loadGenres() {

  try {

    allGenres = await CV_Admin.getGenres();

    console.log("Genres loaded:", allGenres);

    populateGenreDropdowns();

  }

  catch(err){

    console.error(err);

  }

}

function populateGenreDropdowns() {

  console.log("Populating:", allGenres);

  var options = allGenres.map(function(g){

    return `<option value="${g.id}">${g.name}</option>`;

  }).join('');


  document.getElementById('add-genre').innerHTML =

    '<option value="">Select genre</option>' + options;


  document.getElementById('edit-genre').innerHTML =

    '<option value="">Select genre</option>' + options;

}
// ── Pagination ────────────────────────────────
function changePage(dir) {
  currentPage += dir;
  if (currentPage < 1) currentPage = 1;
  loadMovies();
}

// ── Add Movie ─────────────────────────────────
function openAddModal() {
  document.getElementById('add-title').value       = '';
  document.getElementById('add-description').value = '';
  document.getElementById('add-year').value         = '';
  document.getElementById('add-duration').value     = '';
  document.getElementById('add-language').value     = '';
  document.getElementById('add-rating').value       = '';
  document.getElementById('add-poster').value       = '';
  document.getElementById('add-trailer').value      = '';
  document.getElementById('add-genre').value        = '';
  openModal('add-modal');
}

async function submitAddMovie() {

  var title = document.getElementById('add-title').value.trim();

  if (!title) {
    cvToast('Title is required', 'error');
    return;
  }

  // Genre validation
  const genre = document.getElementById('add-genre').value;

  if (!genre) {
    cvToast('Please select a genre', 'error');
    return;
  }

  var btn = document.getElementById('add-submit-btn');

  btn.disabled = true;
  btn.textContent = 'Adding...';

  var payload = {

    title: title,

    description:
      document.getElementById('add-description').value.trim() || null,

    release_year:
      parseInt(document.getElementById('add-year').value) || null,

    duration:
      parseInt(document.getElementById('add-duration').value) || null,

    language:
      document.getElementById('add-language').value.trim() || null,

    rating:
      parseFloat(document.getElementById('add-rating').value) || null,

    poster_url:
      document.getElementById('add-poster').value.trim() || null,

    trailer_url:
      document.getElementById('add-trailer').value.trim() || null,

    genre_id:
      parseInt(genre)

  };

  console.log("Payload:", payload);

  try {

    var res = await CV_Admin.createMovie(payload);

    var body = await res.json();

    console.log("Status:", res.status);
    console.log("Response:", body);

    if (res.ok) {

      cvToast(
        'Movie added successfully!',
        'success'
      );

      closeModal('add-modal');

      loadMovies();

    }
    else {

      cvToast(

        JSON.stringify(body.detail),

        'error'

      );

    }

  }

  catch (err) {

    console.error(err);

    cvToast(

      'Network error. Try again.',

      'error'

    );

  }

  finally {

    btn.disabled = false;

    btn.textContent = 'Add Movie';

  }

}

// ── Edit Movie ────────────────────────────────
function openEditModal(movieId) {
  var movie = totalMovies.find(function(m) { return m.id === movieId; });
  if (!movie) return;

  editMovieId = movieId;
  document.getElementById('edit-movie-id').value   = movieId;
  document.getElementById('edit-title').value       = movie.title        || '';
  document.getElementById('edit-description').value = movie.description  || '';
  document.getElementById('edit-year').value         = movie.release_year || '';
  document.getElementById('edit-duration').value     = movie.duration     || '';
  document.getElementById('edit-language').value     = movie.language     || '';
  document.getElementById('edit-rating').value       = movie.rating       || '';
  document.getElementById('edit-poster').value       = movie.poster_url   || '';
  document.getElementById('edit-trailer').value      = movie.trailer_url  || '';

  if (movie.genre) {
    document.getElementById('edit-genre').value = movie.genre.id;
  }

  openModal('edit-modal');
}

async function submitEditMovie() {

  var title = document.getElementById('edit-title').value.trim();

  if (!title) {
    cvToast('Title is required', 'error');
    return;
  }

  const genre = document.getElementById('edit-genre').value;

  if (!genre) {
    cvToast('Please select a genre', 'error');
    return;
  }

  var btn = document.getElementById('edit-submit-btn');

  btn.disabled = true;
  btn.textContent = 'Saving...';

  var payload = {

    title: title,

    description:
      document.getElementById('edit-description').value.trim() || null,

    release_year:
      parseInt(document.getElementById('edit-year').value) || null,

    duration:
      parseInt(document.getElementById('edit-duration').value) || null,

    language:
      document.getElementById('edit-language').value.trim() || null,

    rating:
      parseFloat(document.getElementById('edit-rating').value) || null,

    poster_url:
      document.getElementById('edit-poster').value.trim() || null,

    trailer_url:
      document.getElementById('edit-trailer').value.trim() || null,

    genre_id:
      parseInt(genre)

  };

  try {

    var res = await CV_Admin.updateMovie(
      editMovieId,
      payload
    );

    if (res.ok) {

      cvToast(
        'Movie updated successfully!',
        'success'
      );

      closeModal('edit-modal');

      loadMovies();

    }
    else {

      var err = await res.json();

      cvToast(

        err.detail || 'Failed to update movie',

        'error'

      );

    }

  }

  catch(err){

    cvToast(

      'Network error. Try again.',

      'error'

    );

  }

  finally{

    btn.disabled = false;

    btn.textContent = 'Save Changes';

  }

}

// ── Delete Movie ──────────────────────────────
function openDeleteModal(movieId, movieTitle) {
  deleteMovieId = movieId;
  document.getElementById('delete-movie-title').textContent = movieTitle;
  openModal('delete-modal');
}

async function submitDeleteMovie() {
  var btn = document.getElementById('delete-submit-btn');
  btn.disabled = true;
  btn.textContent = 'Deleting...';

  try {
    var res = await CV_Admin.deleteMovie(deleteMovieId);
    if (res.ok) {
      cvToast('Movie deleted successfully!', 'success');
      closeModal('delete-modal');
      loadMovies();
    } else {
      var err = await res.json();
      cvToast(err.detail || 'Failed to delete movie', 'error');
    }
  } catch (err) {
    cvToast('Network error. Try again.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Yes, Delete';
    deleteMovieId = null;
  }
}

// ── Movie Images ──────────────────────────────
function openImagesModal(movieId) {
  document.getElementById('images-movie-id').value = movieId;
  openModal('images-modal');

  var movie = totalMovies.find(function(m) { return m.id === movieId; });
  renderImages(movie ? movie.images : []);
}

function renderImages(images) {

  var grid = document.getElementById('images-grid');

  if (!images || images.length === 0) {

    grid.innerHTML =
      '<p style="color:var(--text-muted);font-size:14px;grid-column:1/-1;">No images yet. Upload one below.</p>';

    return;

  }

  grid.innerHTML = images.map(function(img) {

    return '<div class="image-item">' +

      '<img src="' + img.image_url + '" alt="Movie image">' +

      '<button class="image-item-delete" onclick="deleteImage(' + img.id + ')">×</button>' +

    '</div>';

  }).join('');

}

async function uploadImage(input) {
  var file = input.files[0];
  if (!file) return;

  var movieId = document.getElementById('images-movie-id').value;
  cvToast('Uploading image...', 'info');

  try {
    var res = await CV_Admin.uploadMovieImage(movieId, file);
   if (res.ok) {

  cvToast('Image uploaded!', 'success');

  await loadMovies();

  var movie = totalMovies.find(function(m) {
    return m.id == movieId;
  });

  if (movie) {
    renderImages(movie.images);
  }

} else {
      cvToast('Upload failed', 'error');
    }
  } catch (err) {
    cvToast('Network error', 'error');
  }

  input.value = '';
}

async function deleteImage(imageId) {
  if (!confirm('Delete this image?')) return;

  try {
    var res = await CV_Admin.deleteMovieImage(imageId);
    if (res.ok) {
      cvToast('Image deleted', 'success');
      loadMovies();
    } else {
      cvToast('Failed to delete image', 'error');
    }
  } catch (err) {
    cvToast('Network error', 'error');
  }
}

// ── Init ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  loadGenres();
  loadMovies();
});