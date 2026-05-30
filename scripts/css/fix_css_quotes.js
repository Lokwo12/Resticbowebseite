const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'src', 'index.css');
let content = fs.readFileSync(cssPath, 'utf8');

// Replace [type="something"] with [type=something]
content = content.replace(/\[type="([^"]+)"\]/g, '[type=$1]');

fs.writeFileSync(cssPath, content);
console.log('Fixed CSS quotes');
