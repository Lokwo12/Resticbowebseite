const fs = require('fs');

// temp.css is UTF-16LE because of PowerShell redirection
let originalCss = fs.readFileSync('c:/Users/studente/Deaktop/Projects/Resticbowebseite-1/temp.css', 'utf16le');

// Sometimes PowerShell > adds BOM or is weird, let's try standard read if utf16le fails to look right
if (!originalCss.includes(':root')) {
  originalCss = fs.readFileSync('c:/Users/studente/Deaktop/Projects/Resticbowebseite-1/temp.css', 'utf8');
}

// Let's use regex to extract the :root and .dark blocks
const rootMatch = originalCss.match(/:root\s*{[^}]*}/);
const darkMatch = originalCss.match(/\.dark\s*{[^}]*}/);

let baseLayer = '\n@layer base {\n';
if (rootMatch) baseLayer += rootMatch[0] + '\n';
if (darkMatch) baseLayer += darkMatch[0] + '\n';
baseLayer += '}\n\n';

// We also need border-border base styles and typography that shadcn adds
const baseElements = originalCss.match(/\*\s*,\s*::before\s*,\s*::after\s*{[^}]*}/);
if (baseElements) baseLayer += '@layer base {\n  * {\n    border-color: hsl(var(--border));\n  }\n  body {\n    background-color: hsl(var(--background));\n    color: hsl(var(--foreground));\n  }\n}\n';

const indexCssPath = 'c:/Users/studente/Deaktop/Projects/Resticbowebseite-1/src/index.css';
const currentCss = fs.readFileSync(indexCssPath, 'utf8');

// Prepend the base layer right after @tailwind directives
const newCss = currentCss.replace('@tailwind utilities;', '@tailwind utilities;\n' + baseLayer);

fs.writeFileSync(indexCssPath, newCss);
console.log('Recovered CSS variables: ', !!rootMatch, !!darkMatch);
