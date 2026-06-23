// Signup Page JavaScript Logic

const initSignup = () => {
  // Password Visibility Toggle for all password fields in the form
  const inputForms = document.querySelectorAll(".inputForm");
  inputForms.forEach(container => {
    const input = container.querySelector('input');
    const toggleBtn = container.querySelector(".password-toggle-btn");

    if (input && toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        if (input.type === "password") {
          input.type = "text";
          toggleBtn.style.color = "var(--primary-color)"; // highlight
        } else {
          input.type = "password";
          toggleBtn.style.color = ""; // reset
        }
      });
    }
  });

  // Form Submit Skeleton (Pre-wired for validation / Firebase signup)
  const form = document.getElementById("signup-form");
  const nameInput = document.getElementById("full-name");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const confirmInput = document.getElementById("confirm-password");

  const nameError = document.getElementById("full-name-error");
  const emailError = document.getElementById("email-error");
  const passwordError = document.getElementById("password-error");
  const confirmError = document.getElementById("confirm-password-error");
  const formError = document.getElementById("form-error");

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      // Clear previous error messages
      if (nameError) nameError.textContent = "";
      if (emailError) emailError.textContent = "";
      if (passwordError) passwordError.textContent = "";
      if (confirmError) confirmError.textContent = "";
      if (formError) formError.textContent = "";

      let hasError = false;

      // Full Name Validation
      if (!nameInput.value.trim()) {
        if (nameError) nameError.textContent = "Full name is required.";
        hasError = true;
      }

      // Email Validation
      if (!emailInput.value.trim()) {
        if (emailError) emailError.textContent = "Email is required.";
        hasError = true;
      }

      // Password Validation
      if (!passwordInput.value.trim()) {
        if (passwordError) passwordError.textContent = "Password is required.";
        hasError = true;
      } else if (passwordInput.value.length < 8) {
        if (passwordError) passwordError.textContent = "Password must be at least 8 characters.";
        hasError = true;
      }

      // Confirm Password Validation
      if (!confirmInput.value.trim()) {
        if (confirmError) confirmError.textContent = "Please confirm your password.";
        hasError = true;
      } else if (passwordInput.value !== confirmInput.value) {
        if (confirmError) confirmError.textContent = "Passwords do not match.";
        hasError = true;
      }

      if (hasError) return;

      console.log("Submitting signup form with data:", {
        name: nameInput.value,
        email: emailInput.value,
        password: "[PROTECTED]"
      });

      // Future Firebase or REST API sign-up connection goes here:
      // signupWithAPI(nameInput.value, emailInput.value, passwordInput.value);
    });
  }
};

// Robust execution wrapper
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSignup);
} else {
  initSignup();
}
