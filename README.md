# Destiny Diary Auth Module Template

Minimal Node.js + Express + TypeScript server focused on auth (register, login, refresh, logout) using JWT and Prisma (SQLite by default).

## Quick start

1. Install dependencies: `npm install`
2. Copy env: `cp .env.example .env` (or create manually on Windows). Fill `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.
3. Generate Prisma client and migrate: `npx prisma migrate dev --name init`
4. Run in dev mode: `npm run dev`
5. Health check: GET http://localhost:4000/health

## Auth endpoints

- POST /api/auth/register `{ email, password }`
- POST /api/auth/login `{ email, password }`
- POST /api/auth/refresh `{ refreshToken }`
- POST /api/auth/logout `{ userId }`

Responses include `{ user, tokens: { accessToken, refreshToken } }` except logout.

## Scripts

- `npm run dev` - start with ts-node-dev
- `npm run build` - compile TypeScript to `dist`
- `npm start` - run compiled build
- `npm run prisma:generate` - regenerate Prisma client
- `npm run prisma:migrate` - create dev migration

## Notes

- Refresh tokens are stored (hashed) with rotation; old tokens are revoked when refreshed.
- Database defaults to SQLite at `file:./dev.db`; change `DATABASE_URL` for other providers.
- Basic error handling is included; extend as needed for production use.
