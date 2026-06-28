# ⚡ Quick Start Guide - OmniChannel System

## 🚀 5-Minute Setup

### **Step 1: Install Dependencies**
```bash
# Backend
cd Backend
npm install

# Frontend (in new terminal)
cd Frontend
npm install
```

### **Step 2: Configure Environment**

**Backend/.env:**
```env
MONGODB_URI=mongodb://localhost:27017/omnichannel
JWT_SECRET=your-secret-key-change-this
GROQ_API_KEY=your-groq-api-key-from-console-groq-com
PORT=5000
```

**Frontend/.env:**
```env
VITE_API_URL=http://localhost:5000/api
```

### **Step 3: Get Free Groq API Key**
1. Go to: https://console.groq.com
2. Sign up (free account)
3. Navigate to API Keys
4. Create new key
5. Copy and paste into `Backend/.env`

### **Step 4: Start MongoDB**
```bash
# If using local MongoDB
mongod

# Or use MongoDB Atlas (cloud) - update MONGODB_URI
```

### **Step 5: Run the App**

**Terminal 1 - Backend:**
```bash
cd Backend
node app.js
```
✅ Expected: `Server running on port 5000`

**Terminal 2 - Frontend:**
```bash
cd Frontend
npm run dev
```
✅ Expected: `Local: http://localhost:8081/`

### **Step 6: Login & Test**
1. Open: http://localhost:8081/login
2. Email: `admin@test.com`
3. Password: `password123`
4. Click **Login**

---

## 🧪 Quick Feature Test

### **Test 1: AI Ticket Intelligence**
1. Go to **AI Tickets** page
2. Enter Customer ID: `6a27e426c2607ff2acc59e74`
3. Enter ticket: "My order hasn't arrived and I'm very frustrated!"
4. Click **Analyze Ticket**
5. ✅ See: Category, Sentiment (Negative), Priority (High), Health Score

### **Test 2: Notifications**
1. Go to **Settings** page
2. Toggle **Browser Notifications** ON
3. Click **Allow** when browser asks
4. Toggle **Sound Alerts** ON
5. Click **Test** button
6. ✅ See: Toast notification + Desktop notification + Bell badge (1)

### **Test 3: Task Management**
1. Go to **My Tasks** page
2. Click **Create Task**
3. Fill form and click **Create**
4. ✅ Drag task card between columns

### **Test 4: Analytics**
1. Go to **Analytics** page
2. ✅ See: KPI cards + 4 charts with data

### **Test 5: Export Report**
1. Go to **Reports** page
2. Select "Last 30 Days"
3. Click **Export as PDF**
4. ✅ PDF downloads automatically

---

## ❌ Troubleshooting

### **Backend won't start**
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Fix**: Start MongoDB first: `mongod`

### **AI analysis fails (401)**
```
Request failed with status code 401
```
**Fix**: Add `GROQ_API_KEY` to `Backend/.env`

### **Frontend shows blank page**
**Fix**: Check `VITE_API_URL` in `Frontend/.env`

### **Gmail poller errors (red text)**
```
Poller error: No access, refresh token...
```
**Fix**: This is expected! Gmail is optional. Ignore these errors.

---

## 🎯 Feature Checklist

After starting, verify these work:

- [ ] Can login with `admin@test.com` / `password123`
- [ ] Dashboard sidebar shows all menu items
- [ ] Bell icon appears in top right
- [ ] Can create new task in My Tasks
- [ ] Can analyze ticket in AI Tickets page
- [ ] Can see charts in Analytics page
- [ ] Can export report in Reports page
- [ ] Notifications work in Settings page

---

## 📱 Pages Overview

| Page | URL | What It Does |
|------|-----|-------------|
| **Login** | `/login` | Authenticate user |
| **Inbox** | `/dashboard` | View all messages |
| **Customers** | `/dashboard/customers` | Manage customer list |
| **Complaint Box** | `/dashboard/complaints` | Social media complaints |
| **AI Tickets** | `/dashboard/ticket-intelligence` | Analyze tickets with AI |
| **My Tasks** | `/dashboard/my-tasks` | Kanban task board |
| **Analytics** | `/dashboard/analytics` | Charts & KPIs |
| **Reports** | `/dashboard/reports` | Export CSV/PDF reports |
| **Settings** | `/dashboard/settings` | Profile, password, notifications |

---

## 🔑 Environment Variables Reference

### **Backend Required**
```env
MONGODB_URI=mongodb://localhost:27017/omnichannel
JWT_SECRET=random-secret-string
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxx
```

### **Backend Optional**
```env
OPENAI_API_KEY=sk-xxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxx
GMAIL_CLIENT_ID=xxxxx.apps.googleusercontent.com
GMAIL_REFRESH_TOKEN=1//xxxxxxxx
```

### **Frontend Required**
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🎨 Default Test Data

### **Admin User**
- Email: `admin@test.com`
- Password: `password123`
- Role: `employer`

### **Test Customer ID**
```
6a27e426c2607ff2acc59e74
```

### **Sample Ticket Content**
```
"My order #12345 hasn't arrived yet and it's been 2 weeks. 
I'm very upset and need this resolved immediately!"
```

Expected AI Response:
- Category: "Order Issue"
- Sentiment: "Negative"
- Priority: "High"
- Health Score: ~30-40 (at-risk)

---

## ⚡ Common Commands

### **Backend**
```bash
# Start server
node app.js

# Create test user
node createTestUser.js

# Create test customer
node createTestCustomer.js
```

### **Frontend**
```bash
# Dev mode
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### **MongoDB**
```bash
# Start MongoDB
mongod

# Connect to shell
mongosh

# View databases
show dbs

# Use omnichannel DB
use omnichannel

# View collections
show collections

# Query tickets
db.ticketintelligences.find().pretty()
```

---

## 🔄 Workflow Examples

### **Create Ticket → Analyze → View Analytics**
1. Create ticket in AI Tickets page
2. Analyze with AI
3. Go to Analytics page
4. See new data in charts
5. Check Reports page for export

### **Enable Notifications → Receive Alert → Mark Read**
1. Settings → Enable browser notifications
2. Create new ticket (or wait for polling)
3. See toast + desktop notification
4. Click bell icon
5. Click notification to mark as read

### **Create Task → Move to In Progress → Complete**
1. My Tasks → Create Task
2. Fill form with priority and due date
3. Drag card to "In Progress" column
4. Work on task
5. Drag card to "Done" column

---

## 📚 Learn More

- **Full Documentation**: See `README.md`
- **Project Summary**: See `PROJECT_SUMMARY.md`
- **Backend API**: http://localhost:5000/api
- **Frontend**: http://localhost:8081

---

## 🎉 You're Ready!

Everything is set up and working. Start building features or demo the app!

**Next Steps**:
1. Customize branding (logo, colors)
2. Add your own features
3. Deploy to production
4. Add to your portfolio

**Good luck! 🚀**
