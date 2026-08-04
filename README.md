# ARK Hardware Portal

A fresh, single-platform rebuild of the internal hardware selection portal —
React frontend + Vercel serverless API, connected to the existing MongoDB
Atlas cluster (`hardware-selection` / `hardware_selection`). No separate
frontend/backend hosting, no CORS, free to run.

## What's included

- **Register / Login** against the existing `userdetail` collection. Legacy
  plaintext passwords are supported transparently and upgraded to bcrypt on
  first successful login — no disruption for existing users.
- **OTP-based password reset**: request a code by email → 6-digit code is
  emailed via your Google Workspace address → enter the code + new password.
  Codes are hashed at rest, expire in 10 minutes, and are rate-limited.
- **Basic brute-force protection**: 5 failed login attempts locks the account
  for 15 minutes.
- **Hardware dashboard** reading from `allegion_set`, with free-text search
  across all fields and dropdown filters that are discovered automatically
  from the real data (no hardcoded schema).

## Project layout

```
api/                 Vercel serverless functions (the backend)
  _lib/               shared helpers: db connection, models, auth, mailer
  register.js, login.js, logout.js, me.js
  forgot-password.js, reset-password.js
  hardware/           hardware list + filter-metadata endpoints
src/                 React frontend (Vite)
dev/mockApiPlugin.js  DEV-ONLY UI preview helper (see below) — not used in production
vercel.json           SPA routing rewrite (keeps /api/* working)
.env.example          required environment variables
```

## Environment variables (set these in Vercel → Project Settings → Environment Variables)

| Variable | Value |
|---|---|
| `MONGODB_URI` | Your Atlas connection string (already whitelisted for 0.0.0.0/0) |
| `JWT_SECRET` | A long random string — generate with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` |
| `GMAIL_USER` | `arksimplif@gmail.com` |
| `GMAIL_APP_PASSWORD` | A Google App Password (not your normal password) — create one at https://myaccount.google.com/apppasswords after turning on 2-Step Verification |

Copy `.env.example` to `.env` for local reference — never commit the real `.env`.

## Deploying (first time)

1. Push this project to a GitHub repo.
2. Go to https://vercel.com → New Project → import that repo. Vercel
   auto-detects it as a Vite project.
3. Add the four environment variables above before the first deploy (or right
   after, then redeploy).
4. Deploy. Vercel gives you a `https://<something>.vercel.app` URL — that's
   the whole app (frontend + API), one origin, no CORS, no separate services.
5. Optional: add a custom domain in Vercel's Domains settings if you want
   something nicer than the default URL.

Every future `git push` to the main branch redeploys automatically.

## Local development

- `npm run dev` — frontend only, hot reload. `/api/*` calls will fail unless
  you also run a backend (see below), since Vite's dev server doesn't run
  serverless functions itself.
- `vercel dev` (after `npm i -g vercel` and `vercel link`) — runs the frontend
  *and* the real `/api` functions together, reading `.env` for the variables
  above. This is the closest thing to production locally.
- `MOCK_API=1 npm run dev` — frontend only, with a fake in-memory `/api` that
  returns fixture data. Useful for quickly reviewing UI/UX changes without
  touching the real database at all. This mock is never included in
  production builds.

## Security notes

- Session tokens are stored in an httpOnly, SameSite=Lax cookie (not
  accessible to JavaScript, so it isn't a good target for XSS-based theft).
- Passwords are hashed with bcrypt (legacy plaintext rows are upgraded on
  login as described above).
- Password reset codes are single-use, expire in 10 minutes, are hashed at
  rest, and are capped at 5 guess attempts.
- The MongoDB password shared during setup was fairly simple
  (`Jayesh12345`) — consider rotating it in Atlas once everything is live,
  since it was also shared in plain text over chat.
