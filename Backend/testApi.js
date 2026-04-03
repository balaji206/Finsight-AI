import https from 'https';

const data = JSON.stringify({
  contents: [{ parts: [{ text: "hello" }] }]
});

const req = https.request({
  hostname: 'generativelanguage.googleapis.com',
  path: '/v1beta/models/gemini-1.5-flash-latest:generateContent?key=AIzaSyDPUdKmF-89DVUedpz8f5GnkCagIjWA6Tw',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data)
  }
}, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('STATUS:', res.statusCode, 'BODY:', body));
});

req.on('error', console.error);
req.write(data);
req.end();
