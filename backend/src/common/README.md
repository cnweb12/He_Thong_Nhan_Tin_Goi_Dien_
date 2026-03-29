# Common Layer

Use this directory for shared app-level code that does not belong to a single module.

## Intended subfolders

- `constants`: shared constants and enums used across modules
- `errors`: reusable application errors and error helpers
- `response`: shared HTTP response builders and serializers
- `utils`: generic helpers that are not database-specific and not module-specific

## Rule

If logic is specific to one module, keep it inside that module instead of moving it here.
