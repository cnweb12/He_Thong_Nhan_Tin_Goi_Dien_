# Calls Module

Owns call log persistence and call-related business flows.

## Current contents

- `models/call.model.js`
- `services/call.service.js`
- `controllers/call.controller.js`
- `routes/calls.routes.js`
- `validators/call.validator.js`

## Implemented APIs

- `POST /calls` - create call log
- `GET /calls/conversations/:conversationId` - list call history by conversation
- `PATCH /calls/:callId/status` - update call status and duration/end time
- `PATCH /calls/:callId/participants` - upsert participant joined/left state

## Future candidates

- `realtime integration`
