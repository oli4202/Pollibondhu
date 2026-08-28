import http from 'http';

const loginData = JSON.stringify({ email: 'superadmin@pollibondhu.test', password: 'admin123' });

const req = http.request(
  {
    hostname: 'localhost',
    port: 4000,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': loginData.length },
  },
  (res) => {
    let data = '';
    res.on('data', (c) => (data += c));
    res.on('end', () => {
      const token = JSON.parse(data).data.accessToken;
      
      const endpoints = ['/api/admin/dashboard', '/api/admin/departments', '/api/admin/projects', '/api/admin/budgets'];
      
      endpoints.forEach(path => {
        http.get(
          { hostname: 'localhost', port: 4000, path, headers: { Authorization: `Bearer ${token}` } },
          (r) => {
            let d = '';
            r.on('data', c => d += c);
            r.on('end', () => {
              const parsed = JSON.parse(d);
              console.log(`\n=== ${path} ===`);
              console.log(`  success: ${parsed.success}`);
              if (parsed.data) {
                if (Array.isArray(parsed.data)) console.log(`  count: ${parsed.data.length}`);
                else console.log(`  keys: ${Object.keys(parsed.data).join(', ')}`);
              }
              if (!parsed.success) console.log(`  error: ${parsed.error}`);
            });
          }
        );
      });
    });
  }
);
req.write(loginData);
req.end();
