@echo off
setlocal

cd /d "%~dp0.."

if not exist ".env" (
  echo [dev] Missing .env at repo root.
  echo [dev] Copy .env.development.example to .env first.
  exit /b 1
)

docker version >nul 2>&1
if errorlevel 1 (
  echo [dev] Docker daemon is not available.
  echo [dev] Start Docker Desktop, wait until it is running, then retry.
  exit /b 1
)

docker compose version >nul 2>&1
if errorlevel 1 (
  echo [dev] Docker Compose is not available.
  echo [dev] Make sure Docker Desktop is installed correctly and retry.
  exit /b 1
)

echo [dev-build] Starting development stack with build...
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
