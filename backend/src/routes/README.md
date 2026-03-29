# HTTP Routes

Use this directory for Express routers and route composition.

## Current contents

- `index.js`: root router aggregator
- `health.routes.js`: healthcheck endpoint

## Rule

Keep route handlers thin. Business logic should live in module services.
