# BrainSharp AI backend

Express and Sequelize backend for the BrainSharp AI gamified wellness MVP.

## Run locally

1. Copy `.env.example` to `.env` and set `DATABASE_URL` to a PostgreSQL connection string.
2. Install dependencies with `npm install`.
3. Start the API with `node server.js`.

The server syncs the gamification models and creates the starter quest templates when they are missing. The quest API also ensures templates exist when listing, assigning, or completing quests, so an empty quest table is repaired automatically. Better Auth owns the existing PostgreSQL `"user"` table; this service stores gamification data in `user_profiles` and `user_quest_progress` and references Better Auth user IDs.

## Gamification API

- `GET /api/quests` — list the available quest templates.
- `GET /api/quests/today/:userId` — assign and return today's quests and progress for a user.
- `POST /api/quests/complete` — log a quest session using `{ "userId": "better-auth-user-id", "questId": 1, "durationSpentMinutes": 12 }` (`durationSpentMinutes` defaults to 10); the quest's base XP is increased by 2 XP for every minute over 10.
- `GET /api/profile/:userId` — return profile stats and progress toward the 30-day "Productive Enough" badge.
- `GET /api/leaderboard` — return the top 10 users by total XP, or filter session XP and duration with `?category=mental`, `?category=physical`, or `?category=puzzle`.

Levels are calculated as `floor(xp / 20) + 1`. Each completed quest session increments the user's streak count.