// frontend/JS/components/toast.js
// Simple toast notification utility

function showToast(message, type = "info", duration = 3000) {
  // Create container if not exists
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.style.position = "fixed";
    container.style.top = "20px";
    container.style.right = "20px";
    container.style.zIndex = "10000";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "10px";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.textContent = message;
  toast.style.minWidth = "200px";
  toast.style.padding = "12px 16px";
  toast.style.borderRadius = "8px";
  toast.style.boxShadow = "0 2px 8px rgba(0,0,0,0.2)";
  toast.style.color = "#fff";
  toast.style.background = type === "error" ? "#e74c3c" : type === "success" ? "#27ae60" : "#34495e";
  toast.style.opacity = "0";
  toast.style.transition = "opacity 0.3s";
  container.appendChild(toast);
  requestAnimationFrame(() => (toast.style.opacity = "1"));

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.addEventListener("transitionend", () => toast.remove());
  }, duration);
}

export { showToast };
