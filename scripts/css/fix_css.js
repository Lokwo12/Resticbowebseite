const fs = require('fs');
const file = 'c:/Users/studente/Deaktop/Projects/Resticbowebseite-1/src/index.css';
let content = fs.readFileSync(file, 'utf8');

const marker = '/* Custom design layer follows';
let customStart = content.indexOf(marker);

if (customStart === -1) {
  customStart = content.indexOf('/* ============================================================\n   RESTI CBO - Custom Design System Layer');
}

if (customStart !== -1) {
  const customCss = content.substring(customStart);
  const newIndexCss = `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n` + customCss;
  fs.writeFileSync(file, newIndexCss);
  console.log('Successfully updated index.css');
} else {
  console.error('Could not find custom design layer marker');
}
