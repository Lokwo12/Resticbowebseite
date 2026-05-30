const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'src', 'index.css');

const premiumCss = `
/* ═══════════════════════════════════════════════════════════════════
   PREMIUM UI UPGRADE LAYER
   ═══════════════════════════════════════════════════════════════════ */

/* Update heading fonts to Outfit */
h1, h2, h3, h4, h5, h6, .font-heading {
  font-family: 'Outfit', 'Inter', ui-sans-serif, system-ui, sans-serif !important;
}

/* Premium Design Utilities */
.glass-premium {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.05);
}

.text-gradient-premium {
  background: linear-gradient(135deg, #0A192F, #059669);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.shadow-premium-soft {
  box-shadow: 0 20px 40px -15px rgba(0, 0, 0, 0.05);
}

.section-spacing-lg {
  padding-top: 6rem;
  padding-bottom: 6rem;
}

@media (min-width: 1024px) {
  .section-spacing-lg {
    padding-top: 8rem;
    padding-bottom: 8rem;
  }
}
`;

fs.appendFileSync(cssPath, premiumCss);
console.log('Premium CSS appended successfully.');
