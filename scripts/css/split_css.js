const fs = require('fs');
const file = 'c:/Users/studente/Deaktop/Projects/Resticbowebseite-1/src/index.css';
const content = fs.readFileSync(file, 'utf8');

const marker = '/* Custom design layer follows';
let customStart = content.indexOf(marker);

// If the marker is not found, maybe it was modified.
if (customStart === -1) {
  // Let's search for the actual start of the custom styles
  customStart = content.indexOf('/* ============================================================\n   RESTI CBO - Custom Design System Layer');
}

if (customStart !== -1) {
  const customCss = content.substring(customStart);
  fs.writeFileSync('c:/Users/studente/Deaktop/Projects/Resticbowebseite-1/src/custom.css', customCss);
  
  const newIndexCss = `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n@import "./custom.css";\n`;
  fs.writeFileSync(file, newIndexCss);
  console.log('Successfully split index.css and custom.css');
} else {
  console.error('Could not find custom design layer marker');
}
