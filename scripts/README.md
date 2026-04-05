# Scripts Root

Thu muc `scripts/` chua cac script ho tro workflow dev o cap do toan project.

## Cac script hien co

- `dev-build-container.bat`
  Khoi dong stack dev va build image
- `dev-rebuild-container.bat`
  Dung stack dev, sau do build va khoi dong lai
- `dev-stop-container.bat`
  Dung stack dev

## Cach dung

Tu root project, co the chay:

```bat
scripts\dev-build-container.bat
scripts\dev-rebuild-container.bat
scripts\dev-stop-container.bat
```

## Khi nao dung tung script

- `dev-build-container.bat`
  Dung khi bat dau phien lam viec va muon khoi dong stack
- `dev-rebuild-container.bat`
  Dung khi thay doi `package.json`, `Dockerfile`, entrypoint, hoac can build lai sach
- `dev-stop-container.bat`
  Dung khi ket thuc phien lam viec hoac muon tat stack dev

## Luu y

- cac script nay yeu cau Docker Desktop dang chay
- can co file `.env` tai root project truoc khi build stack dev
