// profile.js - Load and display user profile from backend
import { getCurrentUser, logout } from "../../utils/api.js";

const BASE_URL = "http://127.0.0.1:8000";

/**
 * Initialize the profile page.
 * Requires an auth token in localStorage. Redirects to login if missing.
 */
const initProfile = async () => {
  const token = localStorage.getItem("auth_token");

  // Guard: redirect to login if not authenticated
  if (!token) {
    window.location.href = "../login.html";
    return;
  }

  const profileName    = document.getElementById("profile-name");
  const profileEmail   = document.getElementById("profile-email");
  const profileJoined  = document.getElementById("profile-joined");
  const profileAvatar  = document.getElementById("profile-avatar");
  const profileError   = document.getElementById("profile-error");
  const profileRetry   = document.getElementById("profile-retry");
  const logoutBtn      = document.getElementById("logout-btn");
  const goHomeBtn      = document.getElementById("go-home-btn");
  const statWatchlist  = document.getElementById("stat-watchlist");
  const statFavorites  = document.getElementById("stat-favorites");
  const statWatched    = document.getElementById("stat-watched");

  const loadProfile = async () => {
    try {
      if (profileError) profileError.hidden = true;

      const user = await getCurrentUser();

      // Populate profile info
      if (profileName)   profileName.textContent  = user.name || "—";
      if (profileEmail)  profileEmail.textContent = user.email || "—";
      if (profileJoined) {
        const joined = user.created_at
          ? new Date(user.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long" })
          : new Date().toLocaleDateString("en-US", { year: "numeric", month: "long" });
        profileJoined.textContent = `Member since ${joined}`;
      }

      // Avatar initials fallback
      if (profileAvatar) {
        const initials = (user.name || "U")
          .split(" ")
          .map(w => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);
        profileAvatar.onerror = () => {
          profileAvatar.style.display = "none";
          const avatarWrapper = profileAvatar.parentElement;
          if (avatarWrapper) {
            const initialsEl = document.createElement("div");
            initialsEl.className = "profile-avatar-initials";
            initialsEl.textContent = initials;
            avatarWrapper.appendChild(initialsEl);
          }
        };
      }

      // Placeholder stats (can be wired to real endpoints later)
      if (statWatchlist)  statWatchlist.textContent  = "0";
      if (statFavorites)  statFavorites.textContent  = "0";
      if (statWatched)    statWatched.textContent    = "0";

    } catch (err) {
      console.error("Profile load error:", err);
      // If unauthorized, send back to login
      if (err.message && (err.message.includes("401") || err.message.toLowerCase().includes("invalid token"))) {
        localStorage.removeItem("auth_token");
        window.location.href = "login.html";
        return;
      }
      if (profileError) profileError.hidden = false;
    }
  };

  // Load profile data
  await loadProfile();

  // Retry button
  if (profileRetry) {
    profileRetry.addEventListener("click", loadProfile);
  }

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        await logout();
      } catch (_) {
        // Even if backend fails, clear token locally
        localStorage.removeItem("auth_token");
      }
      window.location.href = "login.html";
    });
  }

  // Go to Home
  if (goHomeBtn) {
    goHomeBtn.addEventListener("click", () => {
      window.location.href = "home.html";
    });
  }
};

// Execute when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initProfile);
} else {
  initProfile();
}
