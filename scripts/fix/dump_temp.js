const fs = require('fs');
const css = fs.readFileSync('c:/Users/studente/Deaktop/Projects/Resticbowebseite-1/temp.css', 'utf16le');
const lines = css.split('\n');
for (let i = 0; i < 350; i++) {
  console.log(`${i+1}: ${lines[i]}`);
}
