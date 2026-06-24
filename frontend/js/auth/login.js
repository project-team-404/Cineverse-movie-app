// login.js - Frontend authentication integration
import { login as apiLogin } from "../utils/api.js";
import { showToast } from "../components/toast.js";

/**
 * Initialize login page functionality.
 * Handles password visibility toggles, form validation, API call, and redirects.
 */
const initLogin = () => {
  // Password visibility toggle for all password fields
  const inputForms = document.querySelectorAll('.inputForm');
  inputForms.forEach(container => {
    const input = container.querySelector('input');
    const toggleBtn = container.querySelector('.password-toggle-btn');
    if (input && toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        if (input.type === 'password') {
          input.type = 'text';
          toggleBtn.style.color = 'var(--primary-color)';
        } else {
          input.type = 'password';
          toggleBtn.style.color = '';
        }
      });
    }
  });

  // Form submission – integrate with backend API
  const form = document.getElementById('login-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');

  const emailError = document.getElementById('email-error');
  const passwordError = document.getElementById('password-error');
  const formError = document.getElementById('form-error');

  if (form) {
    form.addEventListener('submit', async e => {
      e.preventDefault();

      // Clear previous error messages
      if (emailError) emailError.textContent = '';
      if (passwordError) passwordError.textContent = '';
      if (formError) formError.textContent = '';

      let hasError = false;

      if (!emailInput.value.trim()) {
        if (emailError) emailError.textContent = 'Email is required.';
        hasError = true;
      }
      if (!passwordInput.value.trim()) {
        if (passwordError) passwordError.textContent = 'Password is required.';
        hasError = true;
      }

      if (hasError) return;

      try {
        await apiLogin({ email: emailInput.value, password: passwordInput.value });
        showToast('Login successful!', 'success');
        setTimeout(() => {
          window.location.href = 'profile.html';
        }, 1200);
      } catch (err) {
        showToast(err.message || 'Login failed', 'error');
        if (formError) formError.textContent = err.message;
      }
    });
  }
};

// Execute when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLogin);
} else {
  initLogin();
}
