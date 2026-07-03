
(function() {
  var token = localStorage.getItem('access_token');
  if (!token) {
    window.location.href = 'login.html';
  }
})();

async function loadDashboardStats() {
  try {
    var movies = await CV_Admin.getMovies(1, 100);
    var genres = await CV_Admin.getGenres();

    var movieCount = Array.isArray(movies) ? movies.length : 0;
    var genreCount = Array.isArray(genres) ? genres.length : 0;

    document.getElementById('stat-movies').textContent = movieCount;
    document.getElementById('stat-genres').textContent = genreCount;

  } catch (err) {
    console.error('[Dashboard] Failed to load stats:', err);
    document.getElementById('stat-movies').textContent = '—';
    document.getElementById('stat-genres').textContent = '—';
  }
}


document.addEventListener('DOMContentLoaded', function() {
  loadDashboardStats();
});