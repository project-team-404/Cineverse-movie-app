// manage-reviews.js — CineVerse Manage Reviews

// ── Auth Guard ─────────────────────────────────
(function() {
  if (!localStorage.getItem('access_token')) {
    window.location.href = 'login.html';
  }
})();

// ── State ─────────────────────────────────────
var movies = [];
var reviews = [];
var currentMovie = null;
var deleteReviewId = null;

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

// ── Load Movies ───────────────────────────────
async function loadMovies() {
  try {
    var result = await CV_Admin.getMovies(1, 100);
    movies = Array.isArray(result) ? result : [];
    populateMovieDropdown();
  } catch (err) {
    console.error('[Reviews] Load movies error:', err);
  }
}

// ── Populate Movie Dropdown ────────────────────
function populateMovieDropdown() {
  var dropdown = document.getElementById('movie-filter');
  var options = movies.map(function(movie) {
    return '<option value="' + movie.id + '">' + movie.title + '</option>';
  }).join('');

  dropdown.innerHTML = '<option value="">Select Movie</option>' + options;

  // Attach change event listener
  dropdown.removeEventListener('change', onMovieFilterChange);
  dropdown.addEventListener('change', onMovieFilterChange);
}

// ── Movie Filter Change Event ──────────────────
function onMovieFilterChange() {
  var movieId = document.getElementById('movie-filter').value;

  if (!movieId) {
    currentMovie = null;
    reviews = [];
    document.getElementById('reviews-table-body').innerHTML =
      '<div class="empty-state"><div class="empty-state-icon">💬</div><h3>Select a movie</h3><p>Choose a movie from the filter above to view its reviews.</p></div>';
    renderStats();
    return;
  }

  currentMovie = parseInt(movieId);
  loadReviews(currentMovie);
  loadSummary(currentMovie);
}

// ── Load Reviews ───────────────────────────────
async function loadReviews(movieId) {
  var tableBody = document.getElementById('reviews-table-body');
  tableBody.innerHTML = '<div class="loading-spinner"><div class="spinner"></div> Loading reviews...</div>';

  try {
    var result = await CV_Admin.getReviews(movieId);
    reviews = Array.isArray(result) ? result : [];
    renderReviews();
    renderStats();
  } catch (err) {
    console.error('[Reviews] Load error:', err);
    tableBody.innerHTML =
      '<div class="empty-state"><div class="empty-state-icon">⚠️</div><h3>Failed to load reviews</h3></div>';
  }
}

// ── Load AI Summary ────────────────────────────
async function loadSummary(movieId) {
  try {
    var result = await CV_Admin.getReviewSummary(movieId);
    var summary = result.summary_message || 'No summary available';
    document.getElementById('summary-text').textContent = summary;

    // Simple sentiment detection based on keywords
    var sentiment = 'Neutral';
    var lowerSummary = summary.toLowerCase();
    if (lowerSummary.includes('amazing') || lowerSummary.includes('love') || lowerSummary.includes('excellent') || lowerSummary.includes('great')) {
      sentiment = 'Positive';
    } else if (lowerSummary.includes('bad') || lowerSummary.includes('hate') || lowerSummary.includes('terrible') || lowerSummary.includes('poor')) {
      sentiment = 'Negative';
    }

    var badge = document.getElementById('sentiment-badge');
    badge.textContent = sentiment;
    badge.className = 'sentiment-badge sentiment-' + sentiment.toLowerCase();

  } catch (err) {
    console.error('[Reviews] Load summary error:', err);
    document.getElementById('summary-text').textContent = 'Unable to load summary';
  }
}

// ── Render Statistics ──────────────────────────
function renderStats() {
  var totalReviews = reviews.length;
  var avgRating = '—';
  var fiveStarCount = 0;

  if (totalReviews > 0) {
    var sum = reviews.reduce(function(acc, review) {
      return acc + (review.rating || 0);
    }, 0);
    avgRating = (sum / totalReviews).toFixed(1);
    fiveStarCount = reviews.filter(function(r) { return r.rating === 5; }).length;
  }

  document.getElementById('stat-total-reviews').textContent = totalReviews;
  document.getElementById('stat-avg-rating').textContent = avgRating;
  document.getElementById('stat-five-star').textContent = fiveStarCount;
}

// ── Render Star Rating ─────────────────────────
function renderStars(rating) {
  var stars = '';
  for (var i = 0; i < 5; i++) {
    stars += i < rating ? '⭐' : '☆';
  }
  return stars;
}

// ── Render Reviews Table ──────────────────────
function renderReviews() {
  var tableBody = document.getElementById('reviews-table-body');

  if (!reviews || reviews.length === 0) {
    tableBody.innerHTML = '<div class="empty-state"><div class="empty-state-icon">💬</div><h3>No reviews found</h3><p>This movie has no reviews yet.</p></div>';
    return;
  }

  var rows = reviews.map(function(review) {
    var stars = renderStars(review.rating || 0);
    var content = review.content ? review.content.substring(0, 100) : '';
    if (content.length === 100) content += '...';

    return '<tr>' +
      '<td>' + review.id + '</td>' +
      '<td>' + (review.user_id || '—') + '</td>' +
      '<td><span class="rating-badge">' + stars + '</span></td>' +
      '<td><span class="review-text">' + content + '</span></td>' +
      '<td><div class="actions-cell">' +
        '<button class="btn btn-danger btn-sm" onclick="openDeleteModal(' + review.id + ')">🗑️ Delete</button>' +
      '</div></td>' +
    '</tr>';
  }).join('');

  tableBody.innerHTML =
    '<table>' +
      '<thead><tr>' +
        '<th>ID</th>' +
        '<th>User ID</th>' +
        '<th>Rating</th>' +
        '<th>Review</th>' +
        '<th>Action</th>' +
      '</tr></thead>' +
      '<tbody>' + rows + '</tbody>' +
    '</table>';
}

// ── Delete Review ──────────────────────────────
function openDeleteModal(reviewId) {
  deleteReviewId = reviewId;
  openModal('delete-review-modal');
}

async function submitDeleteReview() {
  var btn = document.getElementById('delete-review-btn');
  btn.disabled = true;
  btn.textContent = 'Deleting...';

  try {
    var res = await CV_Admin.deleteReview(deleteReviewId);
    if (res.ok) {
      cvToast('Review deleted successfully!', 'success');
      closeModal('delete-review-modal');
      if (currentMovie) {
        loadReviews(currentMovie);
        loadSummary(currentMovie);
      }
    } else {
      var err = await res.json();
      cvToast(err.detail || 'Failed to delete review', 'error');
    }
  } catch (err) {
    cvToast('Network error. Try again.', 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Yes, Delete';
    deleteReviewId = null;
  }
}

// ── Init ──────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  loadMovies();
});