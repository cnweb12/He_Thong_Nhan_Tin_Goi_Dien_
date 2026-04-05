# Production Setup

## Goal

Run a stable containerized backend with production dependencies only and no source bind mounts.

## Suggested env source

Copy `.env.production.example` to `.env` and replace all credentials.

## Start production stack

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
```

## Production characteristics

- backend image uses the `production` Docker target
- only runtime dependencies are installed
- `MONGO_AUTO_INDEX=false`
- indexes should be synchronized manually during controlled operations

## Common commands

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec backend npm run db:sync-indexes
```

## Healthchecks

- Mongo healthcheck is executed inside the Mongo container
- backend healthcheck calls `http://127.0.0.1:3000/health`

## Notes

- Do not expose Mongo host ports unless operations require it.
- Change all default credentials before any real deployment.
