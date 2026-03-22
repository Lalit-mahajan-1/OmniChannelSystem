# OmniChannel Customer Communication Platform

A unified backend system that collects customer messages from **WhatsApp**, **Gmail**, **Twitter**, and **Reddit** into a single MongoDB database — with AI-powered auto-replies on Gmail.

---

## Tech Stack

- **Runtime**: Node.js + Express
- **Database**: MongoDB Atlas (Mongoose)
- **Email**: Gmail API (OAuth2)
- **WhatsApp**: Meta Cloud API + Webhooks
- **Social**: Puppeteer (no API key needed)
- **AI Agent**: Anthropic Claude API
- **Scheduler**: node-cron

---

## Folder Structure

```
Backend/
├── controllers/
│   ├── customerController.js
│   ├── employerController.js
│   ├── socialController.js
│   └── webhookController.js
├── models/
│   ├── Customer.js
│   ├── Employer.js
│   ├── Email.js
│   └── SocialComplaint.js
├── routes/
│   ├── customerRoutes.js
│   ├── emailRoutes.js
│   ├── employerRoutes.js
│   ├── socialRoutes.js
│   └── webhookRoutes.js
├── services/
│   ├── aiAgentService.js
│   ├── gmailPoller.js
│   ├── gmailService.js
│   ├── socialScraperService.js
│   └── whatsappService.js
├── .env
├── .gitignore
├── app.js
├── getGmailToken.js
└── package.json
```

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env` file:

```env
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string

# Gmail OAuth2
GMAIL_CLIENT_ID=your_client_id
GMAIL_CLIENT_SECRET=your_client_secret
GMAIL_REFRESH_TOKEN=your_refresh_token
GMAIL_ADDRESS=employer@gmail.com

# WhatsApp (Meta Cloud API)
WHATSAPP_TOKEN=your_whatsapp_token
WEBHOOK_VERIFY_TOKEN=your_verify_token

# AI Agent
ANTHROPIC_API_KEY=sk-ant-xxxxxxxx
```

### 3. Get Gmail refresh token (one time)

```bash
node getGmailToken.js
```

Follow the URL printed in terminal, authorize, paste the code back — copy the refresh token into `.env`.

### 4. Start the server

```bash
npm run dev
```

Gmail poller starts automatically every 30 seconds.

---

## API Reference

### Employers

| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/employers` | Create employer |
| GET | `/api/employers` | Get all employers |
| GET | `/api/employers/:id` | Get single employer |
| PUT | `/api/employers/:id` | Update employer |
| DELETE | `/api/employers/:id` | Soft delete |

**Create employer body:**
```json
{
  "name": "Test Employer",
  "email": "employer@gmail.com",
  "password": "test123456",
  "company": "HDFC Bank",
  "phone": "1234567890"
}
```

---

### Customers

| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/customers` | Create customer |
| GET | `/api/customers` | Get all customers |
| GET | `/api/customers/:id` | Get single customer |
| PUT | `/api/customers/:id` | Update customer |
| DELETE | `/api/customers/:id` | Soft delete |
| GET | `/api/customers/channel/:channel/:value` | Find by channel ID |

**Find by channel example:**
```
GET /api/customers/channel/whatsapp/917796449253
GET /api/customers/channel/email/john@gmail.com
```

---

### Gmail Emails

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/emails` | All emails |
| GET | `/api/emails?employerId=xxx` | Filter by employer |
| GET | `/api/emails/thread/:threadId` | Full thread |
| GET | `/api/emails/customer/:customerId` | Customer emails |

---

### WhatsApp

| Method | URL | Description |
|--------|-----|-------------|
| GET | `/api/webhook/whatsapp` | Meta webhook verification |
| POST | `/api/webhook/whatsapp` | Receive inbound messages |
| POST | `/api/webhook/send` | Send reply to customer |
| GET | `/api/webhook/conversations/:customerId` | Chat history |
| GET | `/api/webhook/conversations?employerId=xxx` | All conversations |

**Send reply body:**
```json
{
  "employerId": "mongo_id",
  "customerId": "mongo_id",
  "message": "Hello, how can I help you?"
}
```

---

### Social Scraping (Twitter + Reddit)

| Method | URL | Description |
|--------|-----|-------------|
| POST | `/api/social/scrape` | Trigger scrape |
| GET | `/api/social/complaints` | Get all posts |
| GET | `/api/social/stats` | Dashboard counts |
| DELETE | `/api/social/:id` | Delete a post |

**Scrape body:**
```json
{
  "keyword": "HDFC Bank complaint",
  "platforms": ["twitter", "reddit"]
}
```

**Filter complaints:**
```
GET /api/social/complaints?isComplaint=true
GET /api/social/complaints?sentiment=negative
GET /api/social/complaints?platform=twitter
GET /api/social/stats?keyword=HDFC
```

---

## How Each Channel Works

### Gmail
Server polls employer's Gmail every 30 seconds → finds unread emails → auto-creates customer in DB → saves email → generates AI reply using Claude → sends reply back → marks email as read.

### WhatsApp
Meta sends a POST request to `/api/webhook/whatsapp` on every new message → server extracts customer info → saves message to DB → employer can reply via `/api/webhook/send`.

### Twitter + Reddit
Hit `/api/social/scrape` with a keyword → Puppeteer scrapes Nitter (Twitter mirror) and old.reddit.com → detects complaints using keyword matching → assigns sentiment → saves to MongoDB. No API keys needed.

---

## Dependencies

```json
{
  "express": "^4.18.2",
  "mongoose": "^8.0.0",
  "bcryptjs": "^2.4.3",
  "dotenv": "^16.3.1",
  "axios": "^1.6.0",
  "googleapis": "^131.0.0",
  "node-cron": "^3.0.3",
  "puppeteer": "^21.0.0"
}
```

Install all:
```bash
npm install express mongoose bcryptjs dotenv axios googleapis node-cron puppeteer
```
