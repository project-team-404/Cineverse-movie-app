// frontend/JS/utils/api.js
// Simple wrapper around fetch for the Movie API backend

const BASE_URL = "http://127.0.0.1:8000"; // Adjust if backend runs elsewhere

const TOKEN_KEY = "auth_token";

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  }
}

function clearToken() {
  localStorage.removeAll ? localStorage.removeAll() : localStorage.removeItem(TOKEN_KEY);
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, method = "GET", body = null, includeAuth = true) {
  const headers = {
    "Content-Type": "application/json",
    ... (includeAuth ? authHeaders() : {})
  };
  const opts = {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  };
  const response = await fetch(`${BASE_URL}${path}`, opts);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "API request failed");
  }
  return data;
}

// Auth endpoints
export async function signup(data) {
  const result = await request("/auth/signup", "POST", data, false);
  if (result.access_token) setToken(result.access_token);
  return result;
}

export async function login(data) {
  const result = await request("/auth/login", "POST", data, false);
  if (result.access_token) setToken(result.access_token);
  return result;
}

export async function logout() {
  const result = await request("/auth/logout", "POST", null, true);
  clearToken();
  return result;
}

export async function getCurrentUser() {
  return await request("/auth/me", "GET", null, true);
}

// Movie endpoints (example)
export async function fetchMovies(params = "") {
  return await request(`/movies${params}`, "GET", null, true);
}

export async function fetchMovieDetail(id) {
  return await request(`/movies/${id}`, "GET", null, true);
}

// Helper exports
export { getToken, setToken, clearToken };
