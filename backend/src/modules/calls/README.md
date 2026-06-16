# Module Calls

Module `calls` quan ly lich su cuoc goi trong conversation va tich hop Twilio Voice cho tinh nang goi audio/video.

## Muc dich

Module nay phu trach hai nhom chinh:

- Persistence call log: luu lich su cuoc goi, trang thai, thoi gian, duration va participant state.
- Twilio Voice: cap access token cho client va nhan webhook TwiML de route cuoc goi den Twilio Client identity.

Module nay khong phu trach chat message hay membership CRUD cua conversation. Membership duoc doc tu module `conversations` de enforce authorization.

## Cau truc

- `models/call.model.js`: Mongoose schema cho collection `calls`.
- `services/call.service.js`: business logic cho call log va membership guard.
- `controllers/call.controller.js`: HTTP handlers cho `/api/calls`.
- `routes/calls.routes.js`: routes call log, tat ca deu can JWT.
- `validators/call.validator.js`: validate payload/query/params cho call log APIs.
- `services/twilio.service.js`: tao Twilio Voice access token.
- `controllers/twilio.controller.js`: HTTP handlers cho token va Twilio webhook.
- `routes/twilio.routes.js`: routes Twilio.

## Data model

Call document gom cac field chinh:

```js
{
  conversationId: ObjectId,
  initiatedBy: ObjectId,
  type: "audio" | "video",
  status: "missed" | "completed" | "cancelled" | "rejected",
  startedAt: Date,
  endedAt: Date,
  durationSec: Number,
  participants: [
    {
      userId: ObjectId,
      joinedAt: Date,
      leftAt: Date
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

Index hien co:

- `{ conversationId: 1, startedAt: -1 }`
- `{ initiatedBy: 1, createdAt: -1 }`

## Routes duoc mount

Trong `src/routes/index.js`:

- `/api/calls` -> `callRouter`
- `/api/twilio` -> `twilioRouter`

## Call log APIs

Tat ca route trong `/api/calls` deu can JWT. Response thanh cong co dang:

```json
{
  "ok": true,
  "data": {}
}
```

### `POST /api/calls`

Tao call log moi. `initiatedBy` luon lay tu `req.user.userId`, khong lay tu body.

Body:

```json
{
  "conversationId": "conversation_object_id",
  "type": "audio",
  "status": "completed",
  "startedAt": "2026-06-16T08:00:00.000Z",
  "endedAt": "2026-06-16T08:05:00.000Z",
  "durationSec": 300,
  "participants": [
    {
      "userId": "participant_user_id",
      "joinedAt": "2026-06-16T08:00:05.000Z",
      "leftAt": "2026-06-16T08:04:55.000Z"
    }
  ]
}
```

Validation chinh:

- `conversationId` bat buoc.
- `type` chi nhan `audio` hoac `video`.
- `status` chi nhan `missed`, `completed`, `cancelled`, `rejected`.
- `durationSec` neu co phai la so nguyen khong am.
- `endedAt` neu co phai lon hon hoac bang `startedAt`.

Service tu dong them caller (`initiatedBy`) vao `participants` neu chua co.

### `GET /api/calls/conversations/:conversationId`

Lay lich su cuoc goi cua mot conversation theo thu tu moi nhat truoc.

Query:

- `limit`: optional, mac dinh `20`, hop le tu `1` den `100`.
- `beforeStartedAt`: optional, ISO date string de paginate cac call cu hon moc nay.

Vi du:

```http
GET /api/calls/conversations/CONVERSATION_ID?limit=20&beforeStartedAt=2026-06-16T08:00:00.000Z
```

### `PATCH /api/calls/:callId/status`

Cap nhat trang thai call.

Body:

```json
{
  "status": "completed",
  "endedAt": "2026-06-16T08:05:00.000Z",
  "durationSec": 300
}
```

Ghi chu:

- `status` bat buoc.
- Neu `endedAt` khong duoc gui va status la `completed`, `cancelled`, `rejected` hoac `missed`, service se tu set `endedAt = now`.
- Neu `durationSec` khong duoc gui nhung co `startedAt` va `endedAt`, service se tu tinh duration theo giay.

### `PATCH /api/calls/:callId/participants`

Cap nhat hoac them state cua mot participant trong call.

Body:

```json
{
  "participantUserId": "participant_user_id",
  "joinedAt": "2026-06-16T08:00:05.000Z",
  "leftAt": "2026-06-16T08:04:55.000Z"
}
```

Validation chinh:

- `participantUserId` bat buoc.
- Phai co it nhat mot trong hai field `joinedAt` hoac `leftAt`.
- `leftAt` neu co phai lon hon hoac bang `joinedAt`.
- User goi API va participant duoc update deu phai la active member cua conversation.

## Twilio APIs

### `GET /api/twilio/token`

Can JWT. Tao Twilio Voice access token cho user hien tai.

Response:

```json
{
  "ok": true,
  "data": {
    "token": "twilio_jwt"
  }
}
```

Token duoc tao voi:

- identity: `req.user.userId`
- TTL: `3600` giay
- VoiceGrant:
  - `outgoingApplicationSid`: `TWILIO_TWIML_APP_SID`
  - `incomingAllow`: `true`

### `POST /api/twilio/voice`

Khong can JWT vi route nay duoc Twilio goi truc tiep.

Webhook doc:

- `From`: caller identity/number do Twilio gui.
- `To`: callee Twilio Client identity.

Neu co `To`, controller tra ve TwiML `Dial -> Client(To)`. Neu thieu `To`, controller tra ve voice message bao thieu destination.

## Bien moi truong

Can cau hinh cac bien sau de tao Twilio token:

```env
TWILIO_ACCOUNT_SID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY_SID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_API_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_TWIML_APP_SID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Neu thieu mot trong cac bien tren, `GET /api/twilio/token` se loi voi message:

```text
Twilio credentials are not fully configured in environment variables.
```

## Authorization va bao mat

- Tat ca `/api/calls/*` deu di qua JWT middleware.
- `GET /api/twilio/token` di qua JWT middleware.
- `POST /api/twilio/voice` khong dung JWT de Twilio co the goi webhook.
- `initiatedBy` chi lay tu JWT user, khong tin body tu client.
- Service kiem tra active membership truoc khi tao, doc hoac sua call.
- Khi update participant, ca requester va `participantUserId` deu phai la active member cua conversation.

## Loi thuong gap

- `400 Validation failed`: payload/query/params sai format hoac thieu field bat buoc.
- `403 User is not an active conversation member`: user khong nam trong conversation hoac membership khong active.
- `404 Call not found`: `callId` khong ton tai.
- Loi Twilio credential: thieu bien moi truong Twilio khi lay token.
