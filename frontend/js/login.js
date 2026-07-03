/* ============================================================
   CINEVERSE — login.js
   ============================================================ */

const API_BASE = window.API_BASE||
    "https://cineverse-movie-app.onrender.com";;

// ── DOM refs ──────────────────────────────────────────────────

const form        = document.getElementById('login-form');
const emailInput  = document.getElementById('email');
const passInput   = document.getElementById('password');
const loginBtn    = document.getElementById('login-btn');
const togglePass  = document.getElementById('toggle-password');
const toastCont   = document.getElementById('toast-container');

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

// ── Password visibility toggle ────────────────────────────────

togglePass.addEventListener('click', () => {
  const isHidden = passInput.type === 'password';
  passInput.type = isHidden ? 'text' : 'password';
  togglePass.querySelector('.eye-open').style.display  = isHidden ? 'none'  : '';
  togglePass.querySelector('.eye-closed').style.display = isHidden ? ''     : 'none';
});

// ── Ripple effect ─────────────────────────────────────────────

loginBtn.addEventListener('click', function (e) {
  const r = this.getBoundingClientRect();
  const ripple = document.createElement('span');
  ripple.className = 'btn-ripple';
  const size = Math.max(r.width, r.height);
  Object.assign(ripple.style, {
    width: size + 'px',
    height: size + 'px',
    left: (e.clientX - r.left - size / 2) + 'px',
    top:  (e.clientY - r.top  - size / 2) + 'px',
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
  const email = emailInput.value.trim();
  const pass  = passInput.value;

  clearError('field-email',    'email-error');
  clearError('field-password', 'password-error');

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
  }

  return valid;
}

// Clear errors on input
emailInput.addEventListener('input', () => clearError('field-email',    'email-error'));
passInput.addEventListener('input',  () => clearError('field-password', 'password-error'));

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
  loginBtn.disabled = on;
  loginBtn.classList.toggle('is-loading', on);
}

// ── Success overlay ───────────────────────────────────────────

function showSuccess() {
  const overlay = document.createElement('div');
  overlay.className = 'success-overlay';
  overlay.innerHTML = `
    <div class="success-check">✓</div>
    <p class="success-msg">Welcome back!</p>
  `;
  document.body.appendChild(overlay);
}

// ── Login flow ────────────────────────────────────────────────

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!validateForm()) return;

  const email    = emailInput.value.trim();
  const password = passInput.value;

  setLoading(true);

  try {
    // 1. POST /auth/login
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!loginRes.ok) {
      const data = await loginRes.json().catch(() => ({}));

      if (loginRes.status === 401) {
        showToast('Invalid email or password. Please try again.', 'error');
      } else if (loginRes.status === 422) {
        showToast('Please check your details and try again.', 'error');
      } else {
        showToast(data.detail || 'Login failed. Please try again.', 'error');
      }
      setLoading(false);
      return;
    }

    const { access_token } = await loginRes.json();

    // 2. Store token
    localStorage.setItem('access_token', access_token);

    // 3. GET /auth/me
    const meRes = await fetch(`${API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });

    if (meRes.ok) {
      const user = await meRes.json();
      localStorage.setItem('user_name',  user.name);
      localStorage.setItem('user_email', user.email);
    }

    // 4. Success UX → redirect
    setLoading(false);
    showSuccess();
    showToast('Signed in successfully!', 'success');

    setTimeout(() => {
      window.location.href = 'home.html';
    }, 1200);

  } catch (err) {
    console.error(err);
    showToast('Unable to connect. Please check your connection and try again.', 'error');
    setLoading(false);
  }
});
const forgotLink = document.getElementById("forgot-password-link");
const modal = document.getElementById("reset-modal");

forgotLink.onclick = (e) => {

    e.preventDefault();

    modal.classList.remove("hidden");

};

document.getElementById("cancel-reset").onclick = () => {

    modal.classList.add("hidden");

};
document.getElementById("reset-password-btn")
.addEventListener("click", async () => {

    const requestId =
        document.getElementById("request-id").value.trim();

    const password =
        document.getElementById("new-password").value;

    const confirm =
        document.getElementById("confirm-new-password").value;

    if (!requestId) {

        showToast("Enter Request ID","error");
        return;

    }

    if (password !== confirm) {

        showToast("Passwords do not match","error");
        return;

    }

    try {

        const res = await fetch(
            `${API_BASE}/auth/reset-password`,
            {

                method:"POST",

                headers:{
                    "Content-Type":"application/json"
                },

                body:JSON.stringify({

                    request_id:requestId,

                    new_password:password

                })

            }
        );

        const data = await res.json();

        if(res.ok){

            showToast("Password updated successfully","success");

            modal.classList.add("hidden");

        }else{

            showToast(data.detail || data.message,"error");

        }

    }catch{

        showToast("Network Error","error");

    }

});