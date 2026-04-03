import http from 'http';

const data = JSON.stringify({ month: "2026-04", userId: "demo-user" });

const req = http.request({
  hostname: 'localhost',
  port: 5000,
  path: '/api/budget/generate',
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

req.on('error', (e) => console.error(e));
req.write(data);
req.end();
