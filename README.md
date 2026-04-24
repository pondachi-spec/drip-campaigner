# Automated Drip Campaigner

Multi-step SMS + email drip sequences for real estate lead outreach. AI reply classification, live kanban pipeline, Twilio/SendGrid integrations — all with mock fallbacks.

## Stack

- **Backend** — Node.js + Express on port 3005
- **Database** — MongoDB + Mongoose
- **Scheduler** — node-cron (every 15 min, sends 9am–7pm only)
- **SMS** — Twilio (simulated if keys not set)
- **Email** — SendGrid (simulated if key not set)
- **AI Classifier** — OpenAI GPT-4o-mini (keyword fallback if no key)
- **Frontend** — React + Vite + Tailwind CSS on port 5175

## Quick Start

### 1. Configure `.env`

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE=+15551234567
SENDGRID_API_KEY=SG.xxxxxxxx
FROM_EMAIL=you@yourdomain.com
OPENAI_API_KEY=sk-...
MONGODB_URI=mongodb+srv://...
INVESTOR_NAME=John Smith
PORT=3005
```

Leave any key blank to use mock/simulation mode.

### 2. Install

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 3. Run (dev)

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev
```

### 4. Twilio Webhook

Set your Twilio phone number's inbound SMS webhook to:
```
POST https://yourdomain.com/api/webhook/twilio/sms
```

For local testing use ngrok:
```bash
ngrok http 3005
# Set Twilio webhook to: https://abc123.ngrok.io/api/webhook/twilio/sms
```

## Features

| Feature | Detail |
|---|---|
| Campaign Builder | Slide-out panel with drag-reorder steps, variable chips |
| Step Types | SMS or Email, configurable delay (hours/days) |
| Conditional Logic | "Send only if no reply" per step |
| Template Variables | `{name}` `{address}` `{city}` `{investor_name}` |
| Lead Import | CSV upload or one-click import from Alisha (qualified only) |
| Lead Pipeline | Kanban: New → Contacted → Replied → Hot → Closed |
| Scheduler | node-cron every 15 min, 9am–7pm window only |
| AI Classifier | INTERESTED / NOT_INTERESTED / CALL_ME / WRONG_NUMBER / UNKNOWN |
| Keyword Fallback | Regex matching when no OpenAI key |
| Hot Flagging | INTERESTED/CALL_ME leads auto-flagged, highlighted in pipeline |
| Auto-stop | NOT_INTERESTED/WRONG_NUMBER stops all enrollments for lead |
| Alisha Integration | "Send to Alisha" on Hot leads → POST localhost:3000/api/webhook/propwire |
| Reply Inbox | Filterable by classification with color-coded badges |
| Simulation Mode | Console logs when Twilio/SendGrid keys missing |

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET/POST | /api/campaigns | List / create campaigns |
| GET/PUT/DELETE | /api/campaigns/:id | Get / update / delete |
| PATCH | /api/campaigns/:id/status | Activate or pause |
| POST | /api/campaigns/:id/enroll | Enroll lead IDs |
| GET | /api/leads | All leads (filter: ?status=Hot) |
| GET | /api/leads/stats | Pipeline counts |
| POST | /api/leads/import/csv | CSV upload |
| POST | /api/leads/import/alisha | Pull qualified from Alisha |
| PUT | /api/leads/:id | Update lead |
| POST | /api/leads/:id/alisha | Send hot lead to Alisha |
| GET | /api/messages | Inbox (inbound messages) |
| GET | /api/messages/lead/:id | Conversation thread |
| GET | /api/messages/stats | Reply classification counts |
| POST | /api/webhook/twilio/sms | Twilio inbound SMS |
