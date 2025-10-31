## Deployment quick guide for KU Sheet (backend first, then frontend)

This guide explains what to do first, what files/variables to change, and exact checks to run.

1) WHY start backend first
- Frontend needs a stable API URL (VITE_API_URL) to build with. If you deploy frontend before backend is reachable, the frontend may build with a wrong URL or fallback to localhost.
- Backend provides health/readiness endpoints you can verify before pointing the frontend to it.

2) Summary order (do these steps in sequence)
- Step A: Deploy backend (Railway) — create DB, set env, run prisma migrate, make sure /api/health returns 200.
- Step B: Deploy frontend (Vercel) — set `VITE_API_URL` to the deployed backend URL + `/api`, build and publish.

3) Files to edit or review (what and why)
- `backend/package.json` (edited): added `postinstall` to run `npx prisma generate` during install and `prisma:deploy` helper for production migrations.
  - Why: ensures Prisma Client is generated automatically during build/install on host (Railway) so server can start.

- `backend/.env.example` (added): template for required env vars.
  - Why: lists variables you must set on Railway (DATABASE_URL, JWT_SECRET, CORS_ORIGINS, SMTP_*, STRIPE_*, etc.).

- `server.js` (review): CORS uses `CORS_ORIGINS` or `FRONTEND_URL`. Do NOT commit secrets to `backend/.env`. Instead add vars in Railway project settings.
  - What to set: `CORS_ORIGINS=https://<your-vercel-site>.vercel.app` (or both that and preview URLs separated by commas).

- `frontend/src/services/api.js` (review): uses `import.meta.env.VITE_API_URL`. No code changes needed if you set Vercel env var `VITE_API_URL` correctly.
  - What to set on Vercel: `VITE_API_URL=https://<your-railway-service>.railway.app/api`

4) Backend deploy detailed checklist (Railway)
- Create a Railway project and choose "Deploy from GitHub" → point to repo `KUSheet` and set service root to `backend`.
- Add MySQL plugin in Railway and copy the `DATABASE_URL` value.
- In Railway Project Settings -> Environment Variables, set at least:
  - `DATABASE_URL` = (Railway MySQL connection string)
  - `JWT_SECRET` = (long random string)
  - `NODE_ENV` = production
  - `CORS_ORIGINS` = https://<your-vercel-site>.vercel.app
  - Optional: SMTP_* and STRIPE_* if used in production
- Set Build command: `npm ci && npx prisma generate` (or rely on `postinstall` added)
- Set Start command: `npm start`
- After the DB is provisioned, open Railway Console and run:
  - `npx prisma migrate deploy` (applies migrations in production safely)
- Verify logs show "KU SHEET API Server running" and call `https://<railway-url>/api/health` => expect JSON with status 'ok'. Also call `/api/ready` to confirm DB.

5) Frontend deploy detailed checklist (Vercel)
- Create a Vercel project, import from GitHub, set Root Directory to `frontend`.
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment variables (Production):
  - `VITE_API_URL` = https://<your-railway-url>.railway.app/api
- Deploy and verify the site loads and that API requests go to `VITE_API_URL` (use browser DevTools Network tab).

6) What to change in code if you need persistent uploads
- Current: server serves `/uploads` from local disk (`backend/uploads`). This is ephemeral on Railway.
- Action: add S3-compatible storage and update multer storage to upload to S3, or use a managed file storage plugin. This requires code changes in `middleware/upload.js` and any controller that writes to `/uploads`.

7) Useful commands (run in `backend` locally for testing)
```powershell
cd backend
npm ci
npx prisma generate
# to apply migrations to a production DB (when DATABASE_URL points to production):
npx prisma migrate deploy
npm start
```

8) Final checks after both deployed
- Backend: `/api/health` -> 200. `/api/ready` -> ready.
- Frontend: site loads, network calls use VITE_API_URL and there are no CORS errors.

If you want, I can now:
- Walk through the Railway UI with you and produce exact values to paste into Railway and Vercel.
- Add S3 upload support (code changes) if you need file persistence.

-- End of guide
