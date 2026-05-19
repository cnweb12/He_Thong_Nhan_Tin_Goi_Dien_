# Scripts Backend

Thu muc `backend/scripts` chua cac script ho tro cho backend.

## Cau truc

- `database/`
  Cac script lien quan toi seed, reset, va thao tac voi database
- `tests/`
  Cac script ho tro chay test va typecheck nhanh tren Windows

## Scripts trong `backend/scripts/tests`

- `test-users.bat`
  Chay toan bo test cua module `users` ben trong backend container
- `test-conversations.bat`
  Chay toan bo test cua module `conversations` ben trong backend container
- `test-devices.bat`
  Chay toan bo test cua module `devices` ben trong backend container
- `test-messages.bat`
  Chay toan bo test cua module `messages` ben trong backend container
- `test-calls.bat`
  Chay toan bo test cua module `calls` ben trong backend container
- `typecheck.bat`
  Chay `npm run typecheck` ben trong backend container

## Cach dung

Tu root project, co the chay:

```bat
backend\scripts\tests\test-users.bat
backend\scripts\tests\test-conversations.bat
backend\scripts\tests\test-devices.bat
backend\scripts\tests\test-messages.bat
backend\scripts\tests\test-calls.bat
backend\scripts\tests\typecheck.bat
```

## Luu y

- cac script nay phu thuoc vao Docker Desktop va dev stack
- backend container phai dang chay truoc khi su dung
- cac lenh duoc thuc thi trong container `backend` voi working directory `/app`
