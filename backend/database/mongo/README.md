# Mongo Infrastructure

This directory owns MongoDB infrastructure for the backend.

## Contents

- `init`: Mongo container bootstrap scripts
- `connection.js`: connect, disconnect, retry, singleton access
- `health.js`: healthcheck helpers for `/health`
- `register-models.js`: one-time model registration at app boot
- `sync-indexes.js`: manual index synchronization entrypoint
- `mongo-error.mapper.js`: database error to app error mapping
- `normalize.js`: Mongo-facing normalization helpers
- `types.js`: shared Mongo type helpers
- `constants.js`: Mongo-related constants

## Rule

Keep database infrastructure here. Do not duplicate the same responsibility under `src/`.
