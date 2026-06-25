// navbar.js – Handles navbar interactivity: dropdown menu, hamburger toggle, and logout actions.
// This script is loaded dynamically by includeHTML.js after the <nav> markup is injected.

(() => {
  const TOKEN_KEY = 'auth_token';

  // Utility to safely get element by ID
  const getById = (id) => document.getElementById(id);

  // ── Token helpers ──────────────────────────────
  const isLoggedIn = () => Boolean(localStorage.getItem(TOKEN_KEY));

  const performLogout = () => {
    // Clear the correct token key used by login.js
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (_) {}
    window.location.href = 'login.html';
  };

  // ── Navbar state: show guest or auth section ───
  // Runs once after navbar HTML is injected into the DOM
  const navbarGuest = getById('navbar-guest');
  const navbarUser  = getById('navbar-user');
  const navbarLinks = getById('navbar-links');

  if (navbarGuest && navbarUser) {
    if (isLoggedIn()) {
      // Logged in: show avatar/dropdown, hide login/signup buttons
      navbarGuest.hidden = true;
      navbarUser.hidden  = false;
      if (navbarLinks) navbarLinks.hidden = false;
    } else {
      // Logged out: show login/signup buttons, hide avatar/dropdown
      navbarGuest.hidden = false;
      navbarUser.hidden  = true;
      if (navbarLinks) navbarLinks.hidden = true;
    }
  }

  // ── Dropdown (user avatar) ─────────────────────
  const avatarBtn    = getById('avatar-btn');
  const userDropdown = getById('user-dropdown');
  if (avatarBtn && userDropdown) {
    avatarBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const expanded = avatarBtn.getAttribute('aria-expanded') === 'true';
      avatarBtn.setAttribute('aria-expanded', String(!expanded));
      userDropdown.hidden = expanded;
    });
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!avatarBtn.contains(e.target) && !userDropdown.contains(e.target)) {
        avatarBtn.setAttribute('aria-expanded', 'false');
        userDropdown.hidden = true;
      }
    });
  }

  // ── Hamburger (mobile) ─────────────────────────
  const hamburgerBtn  = getById('hamburger-btn');
  const navbarLinksMobile = getById('navbar-links');
  if (hamburgerBtn && navbarLinksMobile && isLoggedIn()) {
    hamburgerBtn.hidden = false;
    hamburgerBtn.addEventListener('click', () => {
      const isHidden = navbarLinksMobile.hasAttribute('hidden');
      if (isHidden) {
        navbarLinksMobile.removeAttribute('hidden');
        hamburgerBtn.setAttribute('aria-label', 'Close menu');
      } else {
        navbarLinksMobile.setAttribute('hidden', '');
        hamburgerBtn.setAttribute('aria-label', 'Open menu');
      }
    });
  }

  // ── Logout buttons ─────────────────────────────

  // Dropdown logout button (inside navbar)
  const dropdownLogout = getById('dropdown-logout');
  if (dropdownLogout) {
    dropdownLogout.addEventListener('click', (e) => {
      e.preventDefault();
      performLogout();
    });
  }

  // Profile page explicit logout button (id="logout-btn")
  const profileLogout = getById('logout-btn');
  if (profileLogout) {
    profileLogout.addEventListener('click', (e) => {
      e.preventDefault();
      performLogout();
    });
  }
})();
