@echo off
setlocal

cd /d "%~dp0..\..\.."

docker version >nul 2>&1
if errorlevel 1 (
  echo [test-conversations] Docker daemon is not available.
  echo [test-conversations] Start Docker Desktop, wait until it is running, then retry.
  exit /b 1
)

docker compose version >nul 2>&1
if errorlevel 1 (
  echo [test-conversations] Docker Compose is not available.
  exit /b 1
)

echo [test-conversations] Running all conversations module tests inside backend container...
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec -w /app backend npm run test:conversations
