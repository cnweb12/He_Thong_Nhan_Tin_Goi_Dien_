@echo off
echo Seeding super admin account...
docker compose -f docker-compose.yml -f docker-compose.dev.yml exec backend node scripts/database/seed-super-admin.js
echo.
echo Super admin seed completed.
pause
