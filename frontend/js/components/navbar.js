

(() => {
  const TOKEN_KEY = 'auth_token';

  
  const getById = (id) => document.getElementById(id);

  
  const isLoggedIn = () => Boolean(localStorage.getItem(TOKEN_KEY));

  const performLogout = () => {
    
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (_) {}
    window.location.href = 'login.html';
  };

  
  const navbarGuest = getById('navbar-guest');
  const navbarUser  = getById('navbar-user');
  const navbarLinks = getById('navbar-links');

  if (navbarGuest && navbarUser) {
    if (isLoggedIn()) {
      
      navbarGuest.hidden = true;
      navbarUser.hidden  = false;
      if (navbarLinks) navbarLinks.hidden = false;
    } else {
      
      navbarGuest.hidden = false;
      navbarUser.hidden  = true;
      if (navbarLinks) navbarLinks.hidden = true;
    }
  }

  
  const avatarBtn    = getById('avatar-btn');
  const userDropdown = getById('user-dropdown');
  if (avatarBtn && userDropdown) {
    avatarBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const expanded = avatarBtn.getAttribute('aria-expanded') === 'true';
      avatarBtn.setAttribute('aria-expanded', String(!expanded));
      userDropdown.hidden = expanded;
    });
    
    document.addEventListener('click', (e) => {
      if (!avatarBtn.contains(e.target) && !userDropdown.contains(e.target)) {
        avatarBtn.setAttribute('aria-expanded', 'false');
        userDropdown.hidden = true;
      }
    });
  }

  
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

 

  const dropdownLogout = getById('dropdown-logout');
  if (dropdownLogout) {
    dropdownLogout.addEventListener('click', (e) => {
      e.preventDefault();
      performLogout();
    });
  }

  
  const profileLogout = getById('logout-btn');
  if (profileLogout) {
    profileLogout.addEventListener('click', (e) => {
      e.preventDefault();
      performLogout();
    });
  }
})();
