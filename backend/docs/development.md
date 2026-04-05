# Development Workflow

## Goal

Run the backend and MongoDB locally with Docker, get hot reload for code changes, and use a repeatable development workflow for coding, checking health, and maintaining local data.

## 1. Requirements

Before starting, make sure the machine has:

- Docker Desktop running
- Docker Compose available through `docker compose`
- a local `.env` file at the repository root

Recommended checks:

```bash
docker version
docker compose version
```

If `docker version` cannot connect to the daemon, start Docker Desktop first and wait until the engine is running.

## 2. Environment Setup

All runtime variables are loaded from the root `.env` file.

### Create `.env`

Use the development template:

```bash
copy .env.development.example .env
```

Suggested contents:

```env
NODE_ENV=development
PORT=3000

MONGO_INITDB_ROOT_USERNAME=root
MONGO_INITDB_ROOT_PASSWORD=rootpassword

MONGO_APP_DB=chat_app_dev
MONGO_APP_USER=chat_app_user
MONGO_APP_PASSWORD=chat_app_password
```

### Important notes

- `.env` must be at the repository root
- the backend container connects to Mongo using the service name `mongo`
- Mongo is mapped to host port `27018` in development

## 3. Start The Development Stack

Run from the repository root:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

What happens during startup:

- MongoDB starts from the `mongo:8.0` image
- the backend image is built from the `development` stage in `backend/Dockerfile`
- `./backend` is bind-mounted into the container
- `/app/node_modules` uses a named volume
- `./docker/dev-entrypoint.sh` checks whether dependencies are installed
- the backend starts with `npm run dev`
- `tsx watch src/server.js` provides hot reload

## 4. Verify The Stack Is Ready

Wait for:

- Mongo log lines like `Waiting for connections`
- backend log lines like `[server] Listening on port 3000.`

Then verify the health endpoint:

```bash
curl http://localhost:3000/health
```

PowerShell alternative:

```powershell
Invoke-WebRequest http://localhost:3000/health
```

## 5. Dev Environment Characteristics

- backend source is bind-mounted into the container
- backend auto reloads on file changes
- `MONGO_AUTO_INDEX=true` in development
- Mongo data persists in the `mongo_data` Docker volume
- Mongo healthchecks run with `mongosh`

## 6. Daily Development Workflow

Recommended day-to-day process:

1. Open a terminal at the repository root.
2. Start the dev stack with Docker Compose.
3. Wait until Mongo is healthy and backend is listening.
4. Edit code under `backend/`.
5. Let `tsx watch` reload the server automatically.
6. Run checks or tests from another terminal.
7. Seed or reset the database if the task needs it.
8. Stop containers when the session ends.

## 7. Running Commands Inside The Backend Container

Use a second terminal for commands:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend <command>
```

Common examples:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npm run typecheck
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npm test
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npm run test:users
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npm run db:sync-indexes
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npm run db:seed
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npm run db:reset
```

## 8. Database Operations During Development

### Sync indexes

Use when schema indexes changed:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npm run db:sync-indexes
```

### Seed data

Use when you need baseline sample data:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npm run db:seed
```

### Reset local database

Use when local data is inconsistent and you want a clean restart:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npm run db:reset
```

This is intended for local development only.

## 9. Stop The Development Stack

If running in the foreground:

- press `Ctrl + C`

Then stop containers cleanly:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
```

If you want to remove volumes too:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml down -v
```

Be careful: removing volumes deletes local Mongo data.

## 10. Troubleshooting

### Docker daemon is unavailable

Symptoms:

- `open //./pipe/dockerDesktopLinuxEngine`
- `failed to connect to the docker API`

Actions:

1. Start Docker Desktop
2. Wait until the engine is running
3. Retry `docker version`
4. Retry `docker compose ... up --build`

### Mongo reports unclean shutdown

This usually means the previous container stop was abrupt. If recovery completes successfully, it is usually safe for local dev.

### Backend does not come up

Check:

- `.env` exists at the repository root
- Mongo container is healthy
- port `3000` is not already taken
- backend logs show no startup exception

### Health endpoint fails

Check:

- backend logs
- Mongo logs
- `docker compose -f docker-compose.yml -f docker-compose.dev.yml ps`

## 11. Team Conventions

- keep business logic in module services
- keep route files thin
- keep Mongo infrastructure under `backend/database/mongo`
- run typecheck before pushing code
- run targeted tests while coding and broader tests before merging
