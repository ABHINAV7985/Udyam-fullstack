
# Backend (Express + Prisma + PostgreSQL)

## Setup
1. Create a Postgres DB (e.g., `udyam`).
2. Copy `.env.example` to `.env` and set `DATABASE_URL`.
3. Install deps:
   ```bash
   npm i
   npm run prisma:generate
   npm run prisma:migrate
   npm run start
   ```

### Endpoints
- `GET /api/schema` – serves the scraped schema
- `POST /api/validate` – validates payload against schema regex/required
- `POST /api/submit` – validates and stores submission
