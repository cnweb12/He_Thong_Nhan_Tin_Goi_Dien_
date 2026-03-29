# Backend

Mongo infrastructure now lives in `backend/database/mongo`.

## Scripts

- `npm start`
- `npm run dev`
- `npm run db:sync-indexes`
- `npm run db:seed`
- `npm run db:reset`

## Docker

- `docker compose up --build`
- Backend runs on `http://localhost:3000`
- Healthcheck endpoint: `http://localhost:3000/health`
- Sync indexes manually: `docker compose exec backend npm run db:sync-indexes`
- Seed dev data manually: `docker compose exec backend npm run db:seed`

## Structure

- `database/mongo`: Mongo infrastructure and init scripts
- `src/config`: application runtime configuration used by the HTTP app
- `src/modules`: domain models and services
- `src/routes`: HTTP routes
- `src/middleware`: Express middleware layer placeholder
- `src/realtime`: realtime transport layer placeholder for chat/call signaling
- `src/common`: shared app-level constants, errors, response helpers, utilities
- `scripts/database`: local database utilities
- `tests/config/database`: test database configuration

## Architecture Notes

- Keep `database/mongo` outside `src` because it is infrastructure, not a feature module.
- Keep `src/modules` for business/domain code grouped by bounded context.
- Keep empty placeholder folders when they represent a real future layer in the target architecture.
- Do not duplicate the same responsibility in both `src/*` and root-level folders.
