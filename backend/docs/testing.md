# Testing Workflow

## Goal

Provide a clear process for validating backend changes during local development.

## 1. Prerequisite

The standard path is to run tests inside the development container after the dev stack is running:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Then use a second terminal to run test commands.

## 2. Available Commands

Defined in `backend/package.json`:

```bash
npm test
npm run test:users
npm run typecheck
```

### Meaning

- `npm test`: run all backend tests using Node's built-in test runner
- `npm run test:users`: run only the users module tests
- `npm run typecheck`: run static analysis through `tsc --noEmit`

## 3. Recommended Workflow While Coding

When working on one module:

1. Start the dev stack.
2. Make code changes.
3. Run focused tests for the module you changed.
4. Run typecheck.
5. Run the full test suite before considering the task done.

Example for the users module:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npm run test:users
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npm run typecheck
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npm test
```

## 4. Common Commands

### Run all tests

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npm test
```

### Run users module tests

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npm run test:users
```

### Run typecheck

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npm run typecheck
```

## 5. If The Change Needs Database State

Seed local data:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npm run db:seed
```

Reset local database if needed:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend npm run db:reset
```

Then rerun the tests that matter.

## 6. When To Run What

### During implementation

Prefer focused feedback:

```bash
npm run test:users
```

### Before finalizing a task

Run:

```bash
npm run typecheck
npm test
```

## 7. Troubleshooting

### Backend container is not running

Start the dev stack first:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

### Typecheck fails

Check:

- `backend/tsconfig.json`
- new files are covered by the `include` globs
- imports/exports match the current module style

### Tests pass but manual verification fails

Check:

- `/health`
- backend logs
- Mongo connectivity
- current `.env` values
