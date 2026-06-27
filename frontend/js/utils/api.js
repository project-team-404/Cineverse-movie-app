// config/api.js — Single source of truth for API base URL

const isLocal =
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1';

export const API_BASE = isLocal
  ? 'http://127.0.0.1:8000'
  : ' https://cineverse-movie-app.onrender.com';