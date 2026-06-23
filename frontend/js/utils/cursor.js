// Custom Cursor Motion using GSAP Ticker

let posX = 0,
    posY = 0;

let mouseX = 0,
    mouseY = 0;

const initCursor = () => {
  const cursor = document.querySelector(".cursor-example");
  if (!cursor) return;

  let isInitialized = false;

  // Use GSAP ticker to run a high-performance frame-by-frame loop
  gsap.ticker.add(() => {
    // Lerping speed factor (smooth ease-out transition)
    posX += (mouseX - posX) / 8;
    posY += (mouseY - posY) / 8;

    gsap.set(cursor, {
      left: posX,
      top: posY
    });
  });

  // Track mouse coordinates globally
  document.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (!isInitialized) {
      posX = mouseX;
      posY = mouseY;
      cursor.style.opacity = "1"; // Reveal the cursor once mouse moves
      isInitialized = true;
    }
  });

  // Event delegation to handle cursor active state on hovering clickable/interactive components
  document.addEventListener("mouseover", (e) => {
    const target = e.target;
    if (!target) return;
    
    // Check if hover is on interactive elements
    const isInteractive = target.closest("a, button, input, select, textarea, [role='button'], .span, .inputForm, .checkbox-container");
    if (isInteractive) {
      cursor.classList.add("cursor-active");
    } else {
      cursor.classList.remove("cursor-active");
    }
  });
};

// Robust execution whether DOM is already loaded or still loading
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initCursor);
} else {
  initCursor();
}
