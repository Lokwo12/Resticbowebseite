const fs = require('fs');
const b64 = fs.readFileSync('public/logo.png').toString('base64');
const svg = [
  "<svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' viewBox='0 0 100 100'>",
  "<defs><clipPath id='c'><circle cx='50' cy='50' r='50'/></clipPath></defs>",
  "<image href='data:image/png;base64," + b64 + "' width='100' height='100' clip-path='url(#c)'/>",
  "</svg>"
].join('');
fs.writeFileSync('public/favicon.svg', svg);
console.log('favicon.svg created');
