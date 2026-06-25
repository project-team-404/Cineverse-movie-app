// profile.js — CineVerse Profile Page
import { getToken, clearToken } from "../session.js";
import { API_BASE } from "../config/api.js";

let skeleton;
let errorState;
let errorMessage;
let content;
let retryBtn;
let logoutBtn;
let avatarEl;
let nameEl;
let emailEl;
let joinedEl;
let statWatched;
let statWatchlist;
let statFavorites;

function cacheDomElements() {
  skeleton = document.getElementById("profile-skeleton");
  errorState = document.getElementById("profile-error");
  errorMessage = document.getElementById("profile-error-message");
  content = document.getElementById("profile-content");
  retryBtn = document.getElementById("profile-retry");
  logoutBtn = document.getElementById("logout-btn");
  avatarEl = document.getElementById("profile-avatar");
  nameEl = document.getElementById("profile-name");
  emailEl = document.getElementById("profile-email");
  joinedEl = document.getElementById("joined-date");
  statWatched = document.getElementById("stat-watched");
  statWatchlist = document.getElementById("stat-watchlist");
  statFavorites = document.getElementById("stat-favorites");
}

function requireAuth() {
  const token = getToken();
  if (!token) {
    window.location.href = "login.html";
    return null;
  }
  return token;
}

function redirectToLogin() {
  clearToken();
  window.location.href = "login.html";
}

/** GET /auth/me — returns { name, email } */
async function fetchProfile(token) {
  let res;

  try {
    res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    throw new Error(
      "Cannot connect to server. Start backend: uvicorn main:app --reload --port 8000"
    );
  }

  let data = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  if (res.status === 401 || res.status === 404) {
    redirectToLogin();
    return null;
  }

  if (!res.ok) {
    throw new Error(data.detail || `Profile fetch failed (${res.status})`);
  }

  return data;
}

/** POST /auth/logout */
async function logoutUser(token) {
  try {
    await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // Still clear local session if network fails
  }
  clearToken();
}

function populateProfile(user) {
  if (nameEl) nameEl.textContent = user.name ?? "Unknown User";
  if (emailEl) emailEl.textContent = user.email ?? "—";
  if (joinedEl) {
    joinedEl.textContent = user.created_at
      ? formatDate(user.created_at)
      : formatDate(new Date().toISOString());
  }

  if (avatarEl && user.avatar_url) {
    avatarEl.src = user.avatar_url;
    avatarEl.alt = `${user.name}'s profile picture`;
  }
}

function populateStats() {
  if (statWatched) statWatched.textContent = "0";
  if (statWatchlist) statWatchlist.textContent = "0";
  if (statFavorites) statFavorites.textContent = "0";
}

function showSkeleton() {
  if (skeleton) skeleton.hidden = false;
  if (errorState) errorState.hidden = true;
  if (content) content.hidden = true;
}

function showError(message) {
  if (skeleton) skeleton.hidden = true;
  if (errorState) errorState.hidden = false;
  if (content) content.hidden = true;
  if (errorMessage) {
    errorMessage.textContent = message || "Couldn't load your profile.";
  }
}

function showContent() {
  if (skeleton) skeleton.hidden = true;
  if (errorState) errorState.hidden = true;
  if (content) content.hidden = false;
}

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

async function handleLogout() {
  const token = getToken();
  if (logoutBtn) logoutBtn.disabled = true;

  if (token) {
    await logoutUser(token);
  } else {
    clearToken();
  }

  window.location.href = "login.html";
}

async function loadProfile() {
  const token = requireAuth();
  if (!token) return;

  showSkeleton();

  try {
    const user = await fetchProfile(token);
    if (!user) return;

    populateProfile(user);
    populateStats();
    showContent();
  } catch (err) {
    console.error("[Profile] Load failed:", err);

    if (window.location.protocol === "file:") {
      showError("Open http://127.0.0.1:8000/app/profile.html (do not open the HTML file directly).");
      return;
    }

    showError(err.message || "Couldn't load your profile.");
  }
}

function initProfilePage() {
  cacheDomElements();

  if (logoutBtn) {
    logoutBtn.addEventListener("click", handleLogout);
  }

  if (retryBtn) {
    retryBtn.addEventListener("click", loadProfile);
  }

  loadProfile();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initProfilePage);
} else {
  initProfilePage();
}
