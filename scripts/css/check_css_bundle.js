const http = require('http');

http.get('http://localhost:3001/src/index.css', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('CSS Bundle Size:', data.length);
    console.log('Contains bg-emerald-800?', data.includes('bg-emerald-800'));
    console.log('Contains bg-background?', data.includes('bg-background'));
    console.log('First 500 chars:', data.substring(0, 500));
  });
}).on('error', err => console.log('Error:', err.message));
