// Login Page JavaScript Logic

const initLogin = () => {
  // Password Visibility Toggle
  const toggleBtn = document.querySelector(".password-toggle-btn");
  const passwordInput = document.getElementById("password");

  if (toggleBtn && passwordInput) {
    toggleBtn.addEventListener("click", () => {
      if (passwordInput.type === "password") {
        passwordInput.type = "text";
        toggleBtn.style.color = "var(--primary-color)"; // highlight blue
      } else {
        passwordInput.type = "password";
        toggleBtn.style.color = ""; // reset color
      }
    });
  }

  // Form Submit Skeleton (Pre-wired for future validation/backend auth)
  const form = document.getElementById("login-form");
  const emailInput = document.getElementById("email");
  const emailError = document.getElementById("email-error");
  const passwordError = document.getElementById("password-error");
  const formError = document.getElementById("form-error");

  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      // Clear previous error messages
      if (emailError) emailError.textContent = "";
      if (passwordError) passwordError.textContent = "";
      if (formError) formError.textContent = "";

      let hasError = false;

      // Basic client-side validation
      if (!emailInput.value.trim()) {
        if (emailError) emailError.textContent = "Email is required.";
        hasError = true;
      }

      if (!passwordInput.value.trim()) {
        if (passwordError) passwordError.textContent = "Password is required.";
        hasError = true;
      }

      if (hasError) return;

      console.log("Submitting login form with data:", {
        email: emailInput.value,
        password: "[PROTECTED]"
      });

      // Future Firebase or REST API auth connection goes here:
      // loginWithAPI(emailInput.value, passwordInput.value);
    });
  }
};

// Robust execution wrapper
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initLogin);
} else {
  initLogin();
}
