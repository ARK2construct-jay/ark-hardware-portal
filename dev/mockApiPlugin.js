// DEV-ONLY visual QA helper. This plugin is never used in production — it
// only activates when you run `MOCK_API=1 npm run dev`, and it never runs
// during `vite build` (Vite plugins' `configureServer` hook is a dev-server
// concept only). It fakes the /api responses with fixture data (shaped like
// the real allegion_set schema) so the 3-step wizard UI can be reviewed
// end-to-end without a real MongoDB connection.
export function mockApiPlugin() {
  let loggedIn = false;

  const BRANDS = ['Allegion', 'Assa Abloy', 'Hager'];
  const TYPES_BY_BRAND = {
    Allegion: ['Allegion Economical Hardware', 'Allegion Residential Hardware', 'Allegion Standard Hardware'],
    'Assa Abloy': ['Assa Abloy Economical Hardware', 'Assa Abloy Residential Hardware', 'Assa Abloy Standard Hardware'],
    Hager: ['Hager Residential Hardware', 'Hager Standard Hardware'],
  };
  const LOCATIONS = ['Amenity (Exterior)', 'Building Entry (Exterior)', 'Unit Entry - ADA (Interior)'];
  const DESCRIPTIONS = ['Hinge', 'Closer', 'Entry lock', 'Kickplate', 'Threshold', 'Weatherstrip'];

  function fixtureResults(brand, hardwareType, location) {
    return DESCRIPTIONS.map((desc, i) => ({
      _id: `${brand}-${hardwareType}-${location}-${i}`,
      brand,
      hardwareType,
      location,
      'Hardware Description': desc,
      Manufacture: ['Schlage', 'Von Duprin', 'LCN', 'Ives'][i % 4],
      'Model Number': `MOD-${1000 + i}`,
      'Grade 1': i % 2 === 0 ? 'Yes' : 'No',
    }));
  }

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

        if (url.pathname === '/api/hardware/options') {
          const dimension = url.searchParams.get('dimension');
          const brand = url.searchParams.get('brand');
          const hardwareType = url.searchParams.get('hardwareType');

          if (dimension === 'brand') return send(res, 200, { dimension, options: BRANDS });
          if (dimension === 'hardwareType') {
            return send(res, 200, { dimension, options: TYPES_BY_BRAND[brand] || [] });
          }
          if (dimension === 'location') {
            return send(res, 200, { dimension, options: brand && hardwareType ? LOCATIONS : [] });
          }
          return send(res, 400, { error: 'invalid dimension' });
        }

        if (url.pathname === '/api/hardware/results') {
          const brand = url.searchParams.get('brand');
          const hardwareType = url.searchParams.get('hardwareType');
          const location = url.searchParams.get('location');
          const items = fixtureResults(brand, hardwareType, location);
          return send(res, 200, { items, total: items.length });
        }

        return next();
      });
    },
  };
}
