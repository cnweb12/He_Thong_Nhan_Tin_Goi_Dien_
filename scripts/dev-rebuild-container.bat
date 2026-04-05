@echo off
setlocal

cd /d "%~dp0.."

if not exist ".env" (
  echo [dev-rebuild] Missing .env at repo root.
  echo [dev-rebuild] Copy .env.development.example to .env first.
  exit /b 1
)

docker version >nul 2>&1
if errorlevel 1 (
  echo [dev-rebuild] Docker daemon is not available.
  echo [dev-rebuild] Start Docker Desktop, wait until it is running, then retry.
  exit /b 1
)

docker compose version >nul 2>&1
if errorlevel 1 (
  echo [dev-rebuild] Docker Compose is not available.
  echo [dev-rebuild] Make sure Docker Desktop is installed correctly and retry.
  exit /b 1
)

echo [dev-rebuild] Stopping development stack...
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
if errorlevel 1 (
  echo [dev-rebuild] Failed to stop the development stack.
  exit /b 1
)

echo [dev-rebuild] Rebuilding and starting development stack...
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
