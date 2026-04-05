@echo off
setlocal

cd /d "%~dp0..\..\.."

docker version >nul 2>&1
if errorlevel 1 (
  echo [test-users] Docker daemon is not available.
  echo [test-users] Start Docker Desktop, wait until it is running, then retry.
  exit /b 1
)

docker compose version >nul 2>&1
if errorlevel 1 (
  echo [test-users] Docker Compose is not available.
  exit /b 1
)

echo [test-users] Running all users module tests inside backend container...
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -w /app backend npm run test:users

