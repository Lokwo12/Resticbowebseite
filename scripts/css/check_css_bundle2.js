const http = require('http');

http.get('http://localhost:3001/src/index.css', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Contains from-emerald-800?', data.includes('from-emerald-800'));
    console.log('Contains p-12?', data.includes('p-12'));
  });
}).on('error', err => console.log('Error:', err.message));
