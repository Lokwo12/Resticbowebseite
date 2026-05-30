const http = require('http');

http.get('http://localhost:3001/src/index.css', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Contains bg-sidebar?', data.includes('bg-sidebar'));
    console.log('Contains border-sidebar-border?', data.includes('border-sidebar-border'));
    console.log('Contains text-sidebar-foreground?', data.includes('text-sidebar-foreground'));
  });
}).on('error', err => console.log('Error:', err.message));
