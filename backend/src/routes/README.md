# HTTP Routes

Thu muc nay dung de ghep cac router Express o cap ung dung.

## Vai tro

Day la noi tra loi cau hoi:

- backend hien expose route nao ra ngoai
- module nao da duoc mount vao app
- tien to URL cua tung router la gi

## Noi dung hien tai

- `index.js`
  Router tong, mount cac module router
- `health.routes.js`
  Endpoint healthcheck

## Trang thai hien tai

Router tong hien dang mount:

- `/health`
- `/auth`
- `/users`
- `/conversations`
- `/messages`
- `/devices`
- `/calls`

## Quy uoc

- route file chi nen lam nhiem vu dinh tuyen va gan middleware
- business logic phai nam trong `services`
- controller chi nen dieu phoi request/response, khong nhet logic nghiep vu nang vao day
