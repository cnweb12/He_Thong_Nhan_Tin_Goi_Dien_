# Module Calls

Module `calls` quan ly call log, lich su cuoc goi theo conversation, va trang thai tham gia cua tung participant.

## Thanh phan hien co

- `models/call.model.js`
- `services/call.service.js`
- `controllers/call.controller.js`
- `routes/calls.routes.js`
- `validators/call.validator.js`

## API dang duoc mount

Module nay da duoc mount vao router tong tai `src/routes/index.js` voi prefix `/calls`.

API hien co:

- `POST /calls`
  Tao call log moi
- `GET /calls/conversations/:conversationId`
  Lay lich su cuoc goi cua mot conversation
- `PATCH /calls/:callId/status`
  Cap nhat trang thai call (`completed`, `missed`, `cancelled`, `rejected`)
- `PATCH /calls/:callId/participants`
  Cap nhat `joinedAt` / `leftAt` cua participant trong call

## Muc dich

Module nay giai quyet phan persistence va authorization o tang HTTP cho tinh nang goi:

- luu call log theo `conversationId`
- kiem tra user dang goi API co phai member active cua conversation khong
- cap nhat trang thai call va duration
- cap nhat state tham gia cua participant

Module nay chua phu trach signaling realtime. No chi xu ly:

- luu du lieu
- expose API
- enforce rule membership

## Luu y bao mat

- `initiatedBy` chi duoc lay tu `req.user.userId`
- moi API deu di qua JWT middleware
- service kiem tra membership truoc khi doc/sua call
