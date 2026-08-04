// DEV-ONLY visual QA helper. This plugin is never used in production — it
// only activates when you run `MOCK_API=1 npm run dev`, and it never runs
// during `vite build` (Vite plugins' `configureServer` hook is a dev-server
// concept only). It fakes the /api responses with fixture data so the UI can
// be reviewed end-to-end without a real MongoDB connection.
export function mockApiPlugin() {
  let loggedIn = false;

  const fixtureFields = [
    { name: 'category', type: 'select', options: ['Hinges', 'Locksets', 'Door Closers', 'Exit Devices'] },
    { name: 'finish', type: 'select', options: ['US26D', 'US10B', 'US32D'] },
    { name: 'manufacturer', type: 'select', options: ['Allegion', 'Schlage', 'Von Duprin'] },
    { name: 'partNumber', type: 'text', options: null },
    { name: 'description', type: 'text', options: null },
  ];

  const fixtureItems = Array.from({ length: 12 }).map((_, i) => ({
    _id: String(i),
    partNumber: `AL-${1000 + i}`,
    description: `Heavy-duty commercial hardware unit ${i + 1}`,
    category: fixtureFields[0].options[i % fixtureFields[0].options.length],
    finish: fixtureFields[1].options[i % fixtureFields[1].options.length],
    manufacturer: fixtureFields[2].options[i % fixtureFields[2].options.length],
    price: (20 + i * 3.5).toFixed(2),
  }));

  function send(res, status, body) {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(body));
  }

  return {
    name: 'mock-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url.startsWith('/api/')) return next();

        // Parse JSON body for POST requests.
        let body = {};
        if (req.method === 'POST') {
          const chunks = [];
          for await (const chunk of req) chunks.push(chunk);
          try {
            body = JSON.parse(Buffer.concat(chunks).toString() || '{}');
          } catch {
            body = {};
          }
        }

        const url = new URL(req.url, 'http://localhost');

        if (url.pathname === '/api/me') {
          if (loggedIn) {
            return send(res, 200, {
              user: { id: '1', fullName: 'Jayesh Paliwal', email: 'arksimplif@gmail.com', username: 'jay' },
            });
          }
          return send(res, 401, { error: 'Not authenticated.' });
        }

        if (url.pathname === '/api/login' || url.pathname === '/api/register') {
          loggedIn = true;
          return send(res, 200, {
            user: { id: '1', fullName: body.fullName || 'Jayesh Paliwal', email: body.email || 'arksimplif@gmail.com', username: body.username || 'jay' },
          });
        }

        if (url.pathname === '/api/logout') {
          loggedIn = false;
          return send(res, 200, { ok: true });
        }

        if (url.pathname === '/api/forgot-password') {
          return send(res, 200, { message: 'If an account exists for this email, a reset code has been sent.' });
        }

        if (url.pathname === '/api/reset-password') {
          return send(res, 200, { message: 'Password updated. You can now log in with your new password.' });
        }

        if (url.pathname === '/api/hardware/meta') {
          return send(res, 200, { fields: fixtureFields, totalCount: 348 });
        }

        if (url.pathname === '/api/hardware') {
          return send(res, 200, { items: fixtureItems, total: fixtureItems.length, page: 1, limit: 25, totalPages: 1 });
        }

        return next();
      });
    },
  };
}
