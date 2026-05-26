# Scripts Root

Thu muc `scripts/` chua cac script ho tro workflow dev o cap do toan project.

## Cac script hien co

- `dev-build-container.bat`
  Khoi dong stack dev va build image
- `dev-rebuild-container.bat`
  Dung stack dev, sau do build va khoi dong lai
- `dev-stop-container.bat`
  Dung stack dev
- `seed-super-admin.bat`
  Seed super admin account cho RBAC system

## Cach dung

Tu root project, co the chay:

```bat
scripts\dev-build-container.bat
scripts\dev-rebuild-container.bat
scripts\dev-stop-container.bat
scripts\seed-super-admin.bat
```

## Khi nao dung tung script

- `dev-build-container.bat`
  Dung khi bat dau phien lam viec va muon khoi dong stack
- `dev-rebuild-container.bat`
  Dung khi thay doi `package.json`, `Dockerfile`, entrypoint, hoac can build lai sach
- `dev-stop-container.bat`
  Dung khi ket thuc phien lam viec hoac muon tat stack dev
- `seed-super-admin.bat`
  Dung khi can tao super admin account cho RBAC system
  Truoc khi chay, can dat environment variables trong file `.env`:
  - SUPER_ADMIN_PHONE
  - SUPER_ADMIN_PASSWORD
  - SUPER_ADMIN_DISPLAY_NAME

## Luu y

- cac script nay yeu cau Docker Desktop dang chay
- can co file `.env` tai root project truoc khi build stack dev
