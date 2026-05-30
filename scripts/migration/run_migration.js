const https = require('https');

const data = JSON.stringify({ secret: 'migrate123' });

const options = {
  hostname: 'mxffqgefsufcdgnhjjsw.supabase.co',
  port: 443,
  path: '/functions/v1/make-server-2a4be611/migrate-to-sql',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14ZmZxZ2Vmc3VmY2RnbmhqanN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NjY5MzMsImV4cCI6MjA5NDI0MjkzM30.3Q9VNn-LXVz1VF9ilEVVLFb2GBWVyD8nYyU2tbO0F2M'
  }
};

const req = https.request(options, (res) => {
  let responseData = '';
  res.on('data', (chunk) => { responseData += chunk; });
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response:', responseData);
  });
});

req.on('error', (error) => {
  console.error('Error:', error);
});

req.write(data);
req.end();
