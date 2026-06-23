// navbar.js – Handles navbar interactivity: dropdown menu, hamburger toggle, and logout actions.
// This script is loaded dynamically by includeHTML.js after the <nav> markup is injected.

(() => {
  // Utility to safely get element by ID
  const getById = (id) => document.getElementById(id);

  // ---------- Dropdown (user avatar) ----------
  const avatarBtn = getById('avatar-btn');
  const userDropdown = getById('user-dropdown');
  if (avatarBtn && userDropdown) {
    // Toggle dropdown visibility
    avatarBtn.addEventListener('click', (e) => {
      const expanded = avatarBtn.getAttribute('aria-expanded') === 'true';
      avatarBtn.setAttribute('aria-expanded', !expanded);
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

  // ---------- Hamburger (mobile) ----------
  const hamburgerBtn = getById('hamburger-btn');
  const navbarLinks = getById('navbar-links');
  if (hamburgerBtn && navbarLinks) {
    // Show/hide the nav links on small screens
    hamburgerBtn.addEventListener('click', () => {
      const isHidden = navbarLinks.hasAttribute('hidden');
      if (isHidden) {
        navbarLinks.removeAttribute('hidden');
        hamburgerBtn.setAttribute('aria-label', 'Close menu');
      } else {
        navbarLinks.setAttribute('hidden', '');
        hamburgerBtn.setAttribute('aria-label', 'Open menu');
      }
    });
  }

  // ---------- Logout handling ----------
  const performLogout = () => {
    // Clear any stored authentication token / user data
    try {
      localStorage.removeItem('jwt');
      localStorage.removeItem('user');
    } catch (_) {}
    // Redirect to the login page
    window.location.href = 'login.html';
  };

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
