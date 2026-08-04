// Lightweight manual smoke test for the serverless handlers' request-validation
// paths — the ones that don't require a live MongoDB connection. This is NOT
// a full test suite, just a sanity check that each handler responds sensibly
// to missing/invalid input and to missing auth, since the sandbox this was
// built in can't reach MongoDB Atlas to test the full flow.

process.env.JWT_SECRET = 'test-secret-for-manual-check-only';

function mockRes(label) {
  const res = {
    statusCode: 200,
    body: null,
    headers: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      console.log(`[${label}] ${this.statusCode} ->`, JSON.stringify(payload));
      return this;
    },
    setHeader(name, value) {
      this.headers[name] = value;
    },
  };
  return res;
}

async function run() {
  const register = (await import('../api/register.js')).default;
  const login = (await import('../api/login.js')).default;
  const forgotPassword = (await import('../api/forgot-password.js')).default;
  const resetPassword = (await import('../api/reset-password.js')).default;
  const me = (await import('../api/me.js')).default;
  const hardwareList = (await import('../api/hardware/index.js')).default;
  const hardwareMeta = (await import('../api/hardware/meta.js')).default;

  await register({ method: 'POST', body: {} }, mockRes('register:missing-fields'));
  await register(
    { method: 'POST', body: { fullName: 'A', email: 'a@b.com', username: 'a', password: 'short' } },
    mockRes('register:weak-password')
  );

  await login({ method: 'POST', body: {} }, mockRes('login:missing-fields'));

  await forgotPassword({ method: 'POST', body: {} }, mockRes('forgot-password:missing-email'));

  await resetPassword({ method: 'POST', body: {} }, mockRes('reset-password:missing-fields'));

  await me({ method: 'GET', headers: {} }, mockRes('me:no-session'));

  await hardwareList({ method: 'GET', headers: {}, query: {} }, mockRes('hardware-list:no-session'));

  await hardwareMeta({ method: 'GET', headers: {} }, mockRes('hardware-meta:no-session'));

  // Wrong HTTP method handling
  await register({ method: 'GET' }, mockRes('register:wrong-method'));
  await me({ method: 'POST', headers: {} }, mockRes('me:wrong-method'));

  console.log('\nAll handlers executed without throwing. Review the responses above.');
}

run().catch((err) => {
  console.error('Manual check crashed:', err);
  process.exit(1);
});
