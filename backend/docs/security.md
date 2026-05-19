# Ra Soat Bao Mat Backend

Tai lieu nay ghi lai mot vong ra soat bao mat o muc pragmatic cho backend hien tai, tap trung vao:

- `users`
- `conversations`
- `messages`
- `devices`
- `calls`

Muc tieu la doi chieu voi cac nguyen tac OWASP co ban:

- authentication
- authorization
- input validation
- least privilege
- khong lo du lieu nhay cam khong can thiet

## 1. Control da co

### Authentication

Tat ca cac route business chinh deu di qua JWT middleware:

- `/api/users/*`
- `/api/conversations/*`
- `/api/messages/*`
- `/api/devices/*`
- `/api/calls/*`

He qua:

- backend khong tin body/query cua client de xac dinh user
- identity duoc lay tu `req.user.userId`

### Authorization

Voi `messages`, `conversations`, `calls`, service deu kiem tra membership truoc khi thao tac du lieu conversation:

- `messages`: chi member active moi gui/doc message
- `conversations`: chi member active moi mark-as-read
- `calls`: chi member active moi tao/doc/sua call log

Voi `devices`:

- API chi thao tac tren device cua chinh user dang dang nhap
- khong co endpoint nao doc/sua device cua user khac

### Input validation

Tat ca route moi deu co validator rieng:

- `conversations`
- `devices`
- `calls`

Validator chot som cac loi:

- thieu ID bat buoc
- pagination sai
- enum sai
- date string khong hop le
- boolean/integer sai kieu

### Giam lo du lieu nhay cam

Da ap dung cac rule sau:

- `devices` khong tra `pushToken` ra response
- `conversations` khong tra `directKey` ra response
- `calls` khong cho client tu set `initiatedBy`
- `users` khong tra `phone` trong luong public (`search`, `get by id`)
- `users` chi tra `phone` cho chinh user qua cac luong self-service (`/api/users/me`, update profile/settings)

## 2. Cac thay doi bao mat da ap dung trong dot nay

### Conversations

- them sanitize de an `directKey`
- them membership check cho `markAsRead`
- khong nhan identity tu request body

### Devices

- them service/controller/route rieng cho device ownership
- an `pushToken` khoi response
- khong expose device cua user khac

### Calls

- `initiatedBy` chi lay tu `req.user.userId`
- cap nhat README de phan anh dung route da duoc mount

### Users

- phone number khong con bi lo qua `GET /api/users/:userId` va `GET /api/users/search`

## 3. Nhung diem on dinh tot hien tai

- khong co route business nao tin `userId` client tu gui len
- validator va service duoc tach ro
- membership duoc enforce o service thay vi chi o controller
- test da cover cac luong auth/middleware dispatch va mot so privacy control quan trong

## 4. Rủi ro / viec nen lam tiep

Nhung muc duoi day chua thay duoc hoan thien trong pham vi dot nay:

- rate limiting cho login/search/send message
- audit log cho cac hanh dong nhay cam
- hardening chi tiet cho refresh token rotation / replay detection
- policy ro rang cho field nao la public profile field, field nao la private self-only field
- scanning tu dong (SAST/dependency audit)

Neu muon dua backend len muc san sang cao hon, day la nhung muc nen lam tiep truoc.

## 5. Ket luan

Voi pham vi backend hien tai, cac module business chinh da co:

- authentication gate
- authorization theo membership/ownership
- input validation co ban
- che giau mot so field nhay cam quan trong

Backend van can them hardening van hanh va monitoring de dat muc production stricter, nhung o muc code-level API thi da tot hon ro ret so voi trang thai ban dau.
