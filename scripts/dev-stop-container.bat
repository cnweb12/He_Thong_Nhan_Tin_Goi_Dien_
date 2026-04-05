@echo off
setlocal

cd /d "%~dp0.."

docker version >nul 2>&1
if errorlevel 1 (
  echo [dev-stop] Docker daemon is not available.
  echo [dev-stop] Start Docker Desktop if you need to manage the stack.
  exit /b 1
)

docker compose version >nul 2>&1
if errorlevel 1 (
  echo [dev-stop] Docker Compose is not available.
  exit /b 1
)

echo [dev-stop] Stopping development stack...
docker compose -f docker-compose.yml -f docker-compose.dev.yml down
