# App Config

Use this directory for runtime configuration used by the HTTP app.

## Current contents

- `env.js`: environment loading and normalized config values

## Rule

If configuration is needed by multiple layers, keep it centralized here instead of scattering env parsing across files.
