# Test Database Config

Use this directory for database-specific test configuration.

## Current contents

- `mongo-test.config.js`: test Mongo connection defaults

## Rule

Keep test-only configuration under `tests/` so it does not leak into runtime code paths.
