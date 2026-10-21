# BrainSharp AI backend

Express and Sequelize backend for the BrainSharp AI gamified wellness MVP.

## Run locally

1. Copy `.env.example` to `.env` and set `DATABASE_URL` to a PostgreSQL connection string.
2. Install dependencies with `npm install`.
3. Start the API with `node server.js`.

The server syncs the gamification models and creates the starter quest templates when they are missing. Better Auth owns the existing PostgreSQL `"user"` table; this service stores only gamification data in `user_profiles` and references Better Auth user IDs.

## Gamification API

- `GET /api/quests` — list the available quest templates.
- `GET /api/quests/today/:userId` — assign and return today's quests and progress for a user.
- `POST /api/quests/complete` — complete a quest using `{ "userId": "better-auth-user-id", "questId": 1 }`; XP is awarded once per quest per day.
- `GET /api/profile/:userId` — return profile stats and progress toward the 30-day "Productive Enough" badge.

Levels are calculated as `floor(xp / 20) + 1`. The streak increases on the first completed quest each day, continues on consecutive days, and resets after a missed day.