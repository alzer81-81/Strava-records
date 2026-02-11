# Strava Records

Strava Records is a responsive Next.js app that connects to Strava and surfaces performance dashboards, personal records, and private group leaderboards.

## Stack
- Next.js (App Router) + TypeScript
- Tailwind CSS
- Prisma ORM + PostgreSQL
- Zod validation
- Signed cookie session (HMAC)

## Local setup
1. Install dependencies
   - `npm install`
2. Create a Postgres database and set `DATABASE_URL` in `.env`.
3. Create a Strava app and set the redirect URI.
4. Run migrations
   - `npm run prisma:migrate`
5. Generate Prisma client
   - `npm run prisma:generate`
6. Start the dev server
   - `npm run dev`

## Environment variables
```
DATABASE_URL=postgresql://...
STRAVA_CLIENT_ID=...
STRAVA_CLIENT_SECRET=...
STRAVA_REDIRECT_URI=http://localhost:3000/api/auth/strava/callback
SESSION_SECRET=use-a-32+char-secret
BASE_URL=http://localhost:3000
```

## Strava app setup
- Go to Strava API settings and create an application.
- Set the Authorization Callback Domain to your dev host.
- Set the redirect URI to match `STRAVA_REDIRECT_URI`.
- Required scopes: `read,activity:read_all`.

## How groups and leaderboards work
- Users only appear on leaderboards after they authorize Strava with this app.
- A group is created by a member and shared via `inviteCode`.
- Leaderboards compare only members in the same group.

## Prisma migrations
- Create migration: `npm run prisma:migrate`
- Open studio: `npm run prisma:studio`

## TODOs
- Streams-based rolling best efforts for accurate distance records (Tier 2).
- Stripe subscriptions, webhooks, and plan upgrades.
- Strava webhook subscription creation and verification.
- Timezone correctness using athlete timezone across all windows.

## Notes
- Tokens are auto-refreshed when expired.
- Activities are fetched with after/before UNIX timestamps and pagination.
- No secrets are logged.
