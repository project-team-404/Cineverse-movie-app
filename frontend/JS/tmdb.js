/* ============================================================
   CINEVERSE -- TMDB API WRAPPER
============================================================ */

const TMDB_KEY  = '2dca580c2a14b55200e784d157207b4d';
const TMDB_BASE = 'https://api.themoviedb.org/3';
const IMG_BASE  = 'https://image.tmdb.org/t/p/';

const FALLBACK_POSTER    = 'assets/images/placeholder.jpg';
const FALLBACK_BACKDROPS = [
  'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1920&q=80',
  'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1920&q=80',
  'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=1920&q=80',
];

const TMDB = {
  GENRES: {
    28:'Action', 12:'Adventure', 16:'Animation', 35:'Comedy', 80:'Crime',
    99:'Documentary', 18:'Drama', 10751:'Family', 14:'Fantasy', 36:'History',
    27:'Horror', 10402:'Music', 9648:'Mystery', 10749:'Romance', 878:'Sci-Fi',
    10770:'TV Movie', 53:'Thriller', 10752:'War', 37:'Western'
  },

  async _get(path, params) {
    if (!params) params = {};
    try {
      var url = new URL(TMDB_BASE + path);
      url.searchParams.set('api_key', TMDB_KEY);
      url.searchParams.set('language', 'en-US');
      Object.keys(params).forEach(function(k) { url.searchParams.set(k, params[k]); });
      var res = await fetch(url.toString());
      return res.ok ? res.json() : null;
    } catch (e) {
      console.warn('TMDB fetch failed:', e.message);
      return null;
    }
  },

  posterURL: function(path, size) {
    var sizes = { poster_sm:'w185', poster_md:'w342', poster_lg:'w500', poster_xl:'w780' };
    var s = sizes[size] || size || 'w342';
    return path ? (IMG_BASE + s + path) : FALLBACK_POSTER;
  },
  backdropURL: function(path, size) {
    var sizes = { backdrop_sm:'w780', backdrop_md:'w1280', backdrop_lg:'original' };
    var s = sizes[size] || size || 'w1280';
    return path ? (IMG_BASE + s + path) : FALLBACK_BACKDROPS[0];
  },

  trending:    function(w)    { return TMDB._get('/trending/movie/' + (w||'week')); },
  getTrending: function(m, w) { return TMDB._get('/trending/' + (m||'movie') + '/' + (w||'week')); },
  popular:     function(p)    { return TMDB._get('/movie/popular',   { page: p||1 }); },
  topRated:    function(p)    { return TMDB._get('/movie/top_rated', { page: p||1 }); },
  getTopRated: function(p)    { return TMDB._get('/movie/top_rated', { page: p||1 }); },
  nowPlaying:  function(p)    { return TMDB._get('/movie/now_playing', { page: p||1 }); },
  upcoming:    function(p)    { return TMDB._get('/movie/upcoming',  { page: p||1 }); },
  search:      function(q, p) { return TMDB._get('/search/movie',   { query: q, page: p||1 }); },
  details:     function(id)   { return TMDB._get('/movie/' + id,    { append_to_response: 'videos,credits,recommendations' }); },
  discover:    function(par)  { return TMDB._get('/discover/movie', par||{}); },
};