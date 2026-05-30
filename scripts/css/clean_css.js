const fs = require('fs');
const file = 'c:/Users/studente/Deaktop/Projects/Resticbowebseite-1/src/index.css';
const content = fs.readFileSync(file, 'utf8');

const lines = content.split('\n');
let customStart = -1;

// Find the second instance of the custom design layer
let count = 0;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('RESTI CBO - Custom Design System Layer')) {
    count++;
    if (count === 2) {
      customStart = i - 1; // include the /* ==== line
      break;
    }
  }
}

// If not found twice, just find the first instance AFTER line 300
if (customStart === -1) {
  for (let i = 300; i < lines.length; i++) {
    if (lines[i].includes('RESTI CBO - Custom Design System Layer')) {
      customStart = i - 1;
      break;
    }
  }
}

// If still not found, just use the first instance
if (customStart === -1) {
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('RESTI CBO - Custom Design System Layer')) {
      customStart = i - 1;
      break;
    }
  }
}

if (customStart !== -1) {
  const customCss = lines.slice(customStart).join('\n');
  const newIndexCss = `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n` + customCss;
  fs.writeFileSync(file, newIndexCss);
  console.log('Successfully cleaned and updated index.css');
} else {
  console.error('Could not find custom design layer marker');
}
