// config/api.js — Shared API base URL for auth/profile pages

export const API_BASE =
  window.location.protocol !== 'file:' &&
  (window.location.port === '8000' || window.location.port === '')
    ? window.location.origin
    : 'http://127.0.0.1:8000';
