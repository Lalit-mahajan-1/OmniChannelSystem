# 🌐 OmniChannel Customer Support System

A full-stack, AI-powered omnichannel customer support platform built with **Node.js**, **React**, **MongoDB**, and **AI APIs** (Groq/OpenAI/Claude).

---

## 📋 Features

### ✅ **Completed Features**

#### 🎫 **AI Ticket Intelligence Engine**
- Automatic ticket classification and categorization
- AI-powered sentiment analysis (Positive/Neutral/Negative)
- Priority detection (Low/Medium/High/Critical)
- Customer health scoring with at-risk detection
- Multi-provider AI support (Groq, OpenAI, Claude)
- Real-time ticket analysis dashboard

#### 📊 **Analytics Dashboard**
- 6 real-time KPI cards (Total Tickets, Critical, Escalated, Active Customers, etc.)
- Interactive charts using Recharts:
  - Category distribution bar chart
  - Sentiment analysis pie chart
  - Priority breakdown pie chart
  - Customer health score distribution
- At-risk customer panel with health indicators
- Auto-refresh functionality

#### 📄 **Reports & Export System**
- 5 comprehensive report types:
  1. Ticket Intelligence Summary
  2. Customer Health Report
  3. At-Risk Customers
  4. Sentiment Trends
  5. Team Performance
- Export to CSV and PDF formats
- Dynamic date range filters (7d, 30d, 90d, 1y, custom)
- Live summary statistics

#### ✅ **My Tasks / Kanban Board**
- Drag-and-drop task management using @dnd-kit
- 3-column board: To Do, In Progress, Done
- Priority badges (Low, Medium, High, Critical)
- Due date tracking with overdue indicators
- Task assignment and customer linking
- Real-time stats dashboard

#### ⚙️ **Settings Page**
- Profile information management
- Password change with validation
- Notification preferences (Email, Browser, Sound)
- AI configuration (Provider, Model, Auto-reply settings)

#### 🔔 **Real-time Notifications System**
- Notification bell with unread count badge
- Toast notifications for new tickets
- Browser desktop notifications support
- Sound alerts (customizable)
- Notification history panel with filtering
- Mark as read/unread functionality
- Auto-polling for new tickets (30s interval)

#### 📧 **Multi-Channel Support**
- Email integration via Gmail API
- WhatsApp Business API integration
- Social media complaint tracking
- Unified inbox for all channels

#### 👥 **Customer Management**
- Customer 360° view
- Interaction history tracking
- Health score monitoring
- Customer segmentation

#### 🔐 **Authentication & Security**
- JWT-based authentication
- Role-based access control (Employer/Customer)
- Rate limiting on auth endpoints
- Password hashing with bcrypt

---

## 🛠️ Tech Stack

### **Backend**
- **Runtime**: Node.js v18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **AI APIs**: Groq, OpenAI, Anthropic Claude
- **Email**: Gmail API with OAuth2
- **Validation**: Express-validator
- **Security**: Helmet, bcrypt, rate limiting

### **Frontend**
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + Custom inline styles
- **State Management**: TanStack Query (React Query)
- **Routing**: React Router v6
- **Charts**: Recharts
- **Drag & Drop**: @dnd-kit
- **Forms**: React Hook Form + Zod
- **Notifications**: Sonner (Toast) + Browser API
- **PDF Export**: jsPDF + jsPDF-AutoTable
- **CSV Export**: PapaParse

---

## 🚀 Getting Started

### **Prerequisites**
- Node.js v18+ installed
- MongoDB instance running (local or Atlas)
- Groq API key (free from [console.groq.com](https://console.groq.com))
- Optional: OpenAI or Claude API keys

### **Installation**

#### 1. Clone the repository
```bash
git clone <your-repo-url>
cd OmniChannelSystem
```

#### 2. Backend Setup
```bash
cd Backend
npm install
```

Create `Backend/.env` file:
```env
# MongoDB
MONGODB_URI=mongodb://localhost:27017/omnichannel

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d

# Server
PORT=5000
NODE_ENV=development

# AI APIs (At least one required)
GROQ_API_KEY=your-groq-api-key
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-claude-key

# Gmail (Optional - for email polling)
GMAIL_CLIENT_ID=your-gmail-client-id
GMAIL_CLIENT_SECRET=your-gmail-client-secret
GMAIL_REDIRECT_URI=http://localhost:5000/auth/gmail/callback
GMAIL_REFRESH_TOKEN=your-refresh-token

# WhatsApp Business (Optional)
WHATSAPP_PHONE_ID=your-phone-id
WHATSAPP_TOKEN=your-whatsapp-token
WHATSAPP_VERIFY_TOKEN=your-verify-token
```

#### 3. Frontend Setup
```bash
cd ../Frontend
npm install
```

Create `Frontend/.env` file:
```env
VITE_API_URL=http://localhost:5000/api
```

#### 4. Start the Application

**Terminal 1 - Backend:**
```bash
cd Backend
node app.js
```

**Terminal 2 - Frontend:**
```bash
cd Frontend
npm run dev
```

Frontend will be available at: `http://localhost:8081`
Backend API at: `http://localhost:5000`

---

## 📝 Default Test Credentials

### **Admin/Employer Login**
- **Email**: `admin@test.com`
- **Password**: `password123`

OR

- **Email**: `rasika02102004@gmail.com`
- **Password**: `password123`

### **Test Customer ID** (for ticket intelligence)
```
6a27e426c2607ff2acc59e74
```

---

## 🎯 How to Use

### **1. AI Ticket Intelligence**
1. Navigate to **AI Tickets** page
2. Enter customer ID: `6a27e426c2607ff2acc59e74`
3. Add ticket content describing an issue
4. Click **Analyze Ticket**
5. View AI-generated classification, sentiment, priority, and customer health score

### **2. View Analytics**
1. Go to **Analytics** page
2. View real-time KPIs and charts
3. Check at-risk customers panel
4. Data auto-refreshes every 30 seconds

### **3. Generate Reports**
1. Navigate to **Reports** page
2. Select date range and report type
3. Click **Export as CSV** or **Export as PDF**
4. Reports download automatically

### **4. Manage Tasks**
1. Go to **My Tasks** page
2. Create new tasks with priority and due dates
3. Drag cards between columns (To Do → In Progress → Done)
4. Track overdue tasks in stats panel

### **5. Enable Notifications**
1. Go to **Settings** page
2. Enable **Browser Notifications** (will request permission)
3. Enable **Sound Alerts** for audio feedback
4. Click **Test** button to test notifications
5. Notification bell will show unread count
6. New tickets trigger automatic notifications

---

## 🔧 Configuration

### **AI Provider Selection**
The system supports multiple AI providers with automatic fallback:

1. **Groq** (Primary, Free) - Fast inference with Llama models
2. **OpenAI** (Fallback) - GPT-4 for advanced analysis
3. **Claude** (Fallback) - Anthropic's Claude for complex reasoning

Configure in **Settings** → **AI Configuration**

### **Gmail Polling**
If Gmail credentials are not configured, polling is automatically disabled. To enable:
1. Set up Google Cloud OAuth credentials
2. Run `node Backend/getGmailToken.js`
3. Add credentials to `Backend/.env`

---

## 📦 Project Structure

```
OmniChannelSystem/
├── Backend/
│   ├── controllers/        # Route controllers
│   ├── models/            # Mongoose schemas
│   ├── routes/            # Express routes
│   ├── services/          # Business logic & AI services
│   ├── middleware/        # Auth, validation, rate limiting
│   ├── utils/             # Helper functions
│   └── app.js             # Entry point
├── Frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── context/       # Context providers (Auth, Notifications)
│   │   ├── lib/           # API client & utilities
│   │   └── types/         # TypeScript type definitions
│   └── index.html
└── docker-compose.yml     # Docker configuration
```

---

## 🐛 Troubleshooting

### **Backend won't start**
- Check MongoDB is running: `mongod --version`
- Verify `.env` file exists with all required variables
- Ensure `GROQ_API_KEY` is set (required for AI features)

### **Gmail polling errors**
- Expected if Gmail credentials not configured
- Disable by leaving `GMAIL_CLIENT_ID` empty in `.env`
- System will skip Gmail polling automatically

### **401 errors on ticket intelligence**
- Ensure you're logged in as employer
- JWT token must be valid (check localStorage)
- Verify `JWT_SECRET` matches between requests

### **Notifications not showing**
- Check browser notification permissions
- Enable in Settings → Notifications
- Click bell icon to view notification panel

---

## 🎨 UI/UX Highlights

- **Dark Mode Design** with gradient accents
- **DM Sans Font** for clean, modern typography
- **Collapsible Sidebar** for maximum workspace
- **Responsive Charts** with Recharts
- **Smooth Animations** using CSS transitions
- **Accessible Components** with ARIA labels
- **Toast Notifications** for user feedback

---

## 🔐 Security Features

- Password hashing with bcrypt (10 rounds)
- JWT token expiration (7 days default)
- Rate limiting on auth endpoints (5 requests/15min)
- Input validation with express-validator
- Mongoose query injection protection
- Helmet.js security headers
- CORS configuration

---

## 🚧 Future Enhancements

- [ ] WebSocket support for real-time updates
- [ ] Advanced AI agent with context memory
- [ ] Multi-language support (i18n)
- [ ] Mobile app (React Native)
- [ ] Advanced analytics with custom date ranges
- [ ] Team collaboration features
- [ ] Custom workflow automation
- [ ] Integration with Slack, MS Teams
- [ ] Voice call support via Twilio

---

## 📄 License

MIT License - feel free to use this project for your portfolio or commercial projects.

---

## 👨‍💻 Author

Built with ❤️ by **Rasika Mane**

**For Resume/Portfolio:**
- Full-stack MERN application
- AI integration with multiple providers
- Real-time notification system
- Drag-and-drop task management
- Advanced data visualization
- Export functionality (CSV/PDF)
- Enterprise-grade authentication

---

## 🤝 Contributing

Contributions welcome! Please open an issue first to discuss changes.

---

## ⭐ Show Your Support

If this project helped you, please give it a ⭐ on GitHub!
