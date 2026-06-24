// includeHTML.js
// This script loads HTML fragments into elements with a `data-include` attribute.
// It fetches the corresponding file from the components directory and injects the content.

(() => {
  const includeElements = document.querySelectorAll('[data-include]');
  includeElements.forEach(async (el) => {
    const componentName = el.getAttribute('data-include');
    if (!componentName) return;
    const url = `components/${componentName}.html`;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Failed to load ${url}`);
      const html = await response.text();
      el.innerHTML = html;
      // After injecting HTML, initialize any component-specific scripts if needed.
      // For navbar, we import its script manually after injection.
      if (componentName === 'navbar') {
        const script = document.createElement('script');
        script.src = 'JS/components/navbar.js';
        script.type = 'module';
        document.body.appendChild(script);
      }
    } catch (err) {
      console.error(err);
    }
  });
})();
