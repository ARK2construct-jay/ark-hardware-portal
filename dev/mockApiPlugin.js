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

  const FIXTURE_USERS = [
    { id: '1', fullName: 'Jayesh Paliwal', email: 'arksimplif@gmail.com', username: 'jay', isAdmin: true, disabled: false, createdAt: new Date(2026, 0, 1).toISOString() },
    { id: '2', fullName: 'Vishal Sharma', email: 'vishal@ark2construct.com', username: 'vishal', isAdmin: false, disabled: false, createdAt: new Date(2026, 0, 3).toISOString() },
    { id: '3', fullName: 'Test Employee', email: 'test@ark2construct.com', username: 'testemp', isAdmin: false, disabled: true, createdAt: new Date(2026, 0, 5).toISOString() },
  ];

  function fixtureResults(brand, hardwareType, location) {
    // Intentionally mimics the real Mongo data quirk: the same logical
    // column stored under two differently-cased/spaced raw keys (a
    // spreadsheet-import artifact). Only one of the two is populated per
    // row, the other is blank/undefined — this is what the Dashboard's
    // column-merging logic needs to collapse into a single column.
    return DESCRIPTIONS.map((desc, i) => ({
      _id: `${brand}-${hardwareType}-${location}-${i}`,
      brand,
      hardwareType,
      location,
      ...(i % 2 === 0
        ? { 'Hardware Description': desc }
        : { hardwareDescription: desc }),
      Manufacture: ['Schlage', 'Von Duprin', 'LCN', 'Ives'][i % 4],
      'Model Number': `MOD-${1000 + i}`,
      'Grade 1': i % 2 === 0 ? 'Yes' : 'No',
      'Grade 2': i % 2 === 0 ? 'HM - FB31P or WD - FB41P' : 'W12',
      'Economical grade': i % 3 === 0 ? 'Not applicable' : '25-M-L-NL',
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
        if (['POST', 'PATCH', 'DELETE', 'PUT'].includes(req.method)) {
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
            return send(res, 200, { user: FIXTURE_USERS[0] });
          }
          return send(res, 401, { error: 'Not authenticated.' });
        }

        if (url.pathname === '/api/login' || url.pathname === '/api/register') {
          loggedIn = true;
          return send(res, 200, {
            user: { ...FIXTURE_USERS[0], fullName: body.fullName || FIXTURE_USERS[0].fullName, email: body.email || FIXTURE_USERS[0].email, username: body.username || FIXTURE_USERS[0].username },
          });
        }

        if (url.pathname === '/api/admin/users') {
          if (req.method === 'GET') return send(res, 200, { users: FIXTURE_USERS });
          if (req.method === 'PATCH') {
            const target = FIXTURE_USERS.find((u) => u.id === body.userId);
            if (!target) return send(res, 404, { error: 'User not found.' });
            if (typeof body.disabled === 'boolean') target.disabled = body.disabled;
            if (typeof body.isAdmin === 'boolean') target.isAdmin = body.isAdmin;
            return send(res, 200, { user: target });
          }
          if (req.method === 'DELETE') {
            const idx = FIXTURE_USERS.findIndex((u) => u.id === body.userId);
            if (idx !== -1) FIXTURE_USERS.splice(idx, 1);
            return send(res, 200, { ok: true });
          }
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
