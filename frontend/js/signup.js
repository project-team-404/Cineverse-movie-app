/* ============================================================
   CINEVERSE — signup.js
   ============================================================ */

<<<<<<< HEAD
const API_BASE = 'https://cineverse-movie-app.onrender.com';
=======
const API_BASE = ' https://cineverse-movie-app.onrender.com';
>>>>>>> 6b371d427aa225eefc5a4b89ec9a1b35bb8751f6

// ── DOM refs ──────────────────────────────────────────────────

const form          = document.getElementById('signup-form');
const nameInput     = document.getElementById('name');
const emailInput    = document.getElementById('email');
const passInput     = document.getElementById('password');
const confirmInput  = document.getElementById('confirm-password');
const signupBtn     = document.getElementById('signup-btn');
const togglePass    = document.getElementById('toggle-password');
const toggleConfirm = document.getElementById('toggle-confirm');
const toastCont     = document.getElementById('toast-container');

// ── Particle canvas ───────────────────────────────────────────

(function initParticles() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles;

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function buildParticles() {
    particles = Array.from({ length: 55 }, () => ({
      x:  Math.random() * W,
      y:  Math.random() * H,
      r:  Math.random() * 1.4 + 0.3,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.25,
      a:  Math.random() * 0.6 + 0.1,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(245,196,81,${p.a})`;
      ctx.fill();
      p.x += p.dx;
      p.y += p.dy;
      if (p.x < -10) p.x = W + 10;
      if (p.x > W + 10) p.x = -10;
      if (p.y < -10) p.y = H + 10;
      if (p.y > H + 10) p.y = -10;
    });
    requestAnimationFrame(draw);
  }

  resize();
  buildParticles();
  draw();
  window.addEventListener('resize', () => { resize(); buildParticles(); });
})();

// ── Token guard — redirect already-logged-in users ────────────

(async function checkExistingSession() {
  const token = localStorage.getItem('access_token');
  if (!token) return;

  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      window.location.href = 'home.html';
    } else {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_name');
      localStorage.removeItem('user_email');
    }
  } catch {
    // network error — stay on page
  }
})();

// ── Password visibility toggles ───────────────────────────────

function setupToggle(toggleBtn, inputEl) {
  toggleBtn.addEventListener('click', () => {
    const isHidden = inputEl.type === 'password';
    inputEl.type = isHidden ? 'text' : 'password';
    toggleBtn.querySelector('.eye-open').style.display  = isHidden ? 'none' : '';
    toggleBtn.querySelector('.eye-closed').style.display = isHidden ? ''    : 'none';
  });
}

setupToggle(togglePass,    passInput);
setupToggle(toggleConfirm, confirmInput);

// ── Password strength meter ───────────────────────────────────

passInput.addEventListener('input', () => {
  const val = passInput.value;
  const strengthEl = document.getElementById('password-strength');
  const fillEl     = document.getElementById('strength-fill');
  const labelEl    = document.getElementById('strength-label');

  if (!val) {
    strengthEl.style.display = 'none';
    return;
  }

  strengthEl.style.display = '';

  let score = 0;
  if (val.length >= 8)                    score++;
  if (/[A-Z]/.test(val))                 score++;
  if (/[0-9]/.test(val))                 score++;
  if (/[^A-Za-z0-9]/.test(val))          score++;

  const levels = [
    { label: 'Weak',   color: '#ff5e5e', pct: '25%' },
    { label: 'Fair',   color: '#f5a623', pct: '50%' },
    { label: 'Good',   color: '#f5c451', pct: '75%' },
    { label: 'Strong', color: '#4ade80', pct: '100%' },
  ];

  const level = levels[Math.max(0, score - 1)] || levels[0];
  fillEl.style.width      = level.pct;
  fillEl.style.background = level.color;
  labelEl.textContent     = level.label;
  labelEl.style.color     = level.color;
});

// ── Ripple effect ─────────────────────────────────────────────

signupBtn.addEventListener('click', function (e) {
  const r = this.getBoundingClientRect();
  const ripple = document.createElement('span');
  ripple.className = 'btn-ripple';
  const size = Math.max(r.width, r.height);
  Object.assign(ripple.style, {
    width:  size + 'px',
    height: size + 'px',
    left:   (e.clientX - r.left - size / 2) + 'px',
    top:    (e.clientY - r.top  - size / 2) + 'px',
  });
  this.appendChild(ripple);
  setTimeout(() => ripple.remove(), 560);
});

// ── Validation helpers ────────────────────────────────────────

function setError(fieldId, errorId, msg) {
  document.getElementById(fieldId).classList.add('has-error');
  document.getElementById(errorId).textContent = msg;
}

function clearError(fieldId, errorId) {
  document.getElementById(fieldId).classList.remove('has-error');
  document.getElementById(errorId).textContent = '';
}

function validateForm() {
  let valid = true;

  const name    = nameInput.value.trim();
  const email   = emailInput.value.trim();
  const pass    = passInput.value;
  const confirm = confirmInput.value;

  clearError('field-name',     'name-error');
  clearError('field-email',    'email-error');
  clearError('field-password', 'password-error');
  clearError('field-confirm',  'confirm-error');

  if (!name) {
    setError('field-name', 'name-error', 'Full name is required.');
    valid = false;
  }

  if (!email) {
    setError('field-email', 'email-error', 'Email is required.');
    valid = false;
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    setError('field-email', 'email-error', 'Please enter a valid email address.');
    valid = false;
  }

  if (!pass) {
    setError('field-password', 'password-error', 'Password is required.');
    valid = false;
  } else if (pass.length < 6) {
    setError('field-password', 'password-error', 'Password must be at least 6 characters.');
    valid = false;
  }

  if (!confirm) {
    setError('field-confirm', 'confirm-error', 'Please confirm your password.');
    valid = false;
  } else if (pass && confirm !== pass) {
    setError('field-confirm', 'confirm-error', 'Passwords do not match.');
    valid = false;
  }

  return valid;
}

// Clear errors on input
nameInput.addEventListener('input',    () => clearError('field-name',     'name-error'));
emailInput.addEventListener('input',   () => clearError('field-email',    'email-error'));
passInput.addEventListener('input',    () => clearError('field-password', 'password-error'));
confirmInput.addEventListener('input', () => clearError('field-confirm',  'confirm-error'));

// ── Toast system ──────────────────────────────────────────────

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `
    <span class="toast__icon">${type === 'success' ? '✓' : '!'}</span>
    <span class="toast__message">${message}</span>
  `;
  toastCont.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('toast--exit');
    setTimeout(() => toast.remove(), 350);
  }, 3800);
}

// ── Button loading state ──────────────────────────────────────

function setLoading(on) {
  signupBtn.disabled = on;
  signupBtn.classList.toggle('is-loading', on);
}

// ── Success overlay ───────────────────────────────────────────

function showSuccess() {
  const overlay = document.createElement('div');
  overlay.className = 'success-overlay';
  overlay.innerHTML = `
    <div class="success-check">✓</div>
    <p class="success-msg">Account Created!</p>
  `;
  document.body.appendChild(overlay);
}

// ── Signup flow ───────────────────────────────────────────────

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!validateForm()) return;

  const name     = nameInput.value.trim();
  const email    = emailInput.value.trim();
  const password = passInput.value;

  setLoading(true);

  try {
    // POST /auth/signup
    const signupRes = await fetch(`${API_BASE}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    if (!signupRes.ok) {
      const data = await signupRes.json().catch(() => ({}));

      if (signupRes.status === 422) {
        // Surface the first backend validation message if available
        const detail = data.detail;
        if (Array.isArray(detail) && detail.length > 0) {
          showToast(detail[0].msg || 'Please check your details and try again.', 'error');
        } else {
          showToast('Please check your details and try again.', 'error');
        }
      } else if (signupRes.status === 409 || (data.detail && data.detail.toLowerCase().includes('exist'))) {
        showToast('An account with this email already exists.', 'error');
      } else {
        showToast(data.detail || 'Signup failed. Please try again.', 'error');
      }

      setLoading(false);
      return;
    }

    // Success
    setLoading(false);
    showSuccess();
    showToast('Account created! Redirecting to sign in…', 'success');

    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1400);

  } catch (err) {
    console.error(err);
    showToast('Unable to connect. Please check your connection and try again.', 'error');
    setLoading(false);
  }
});