# 🚀 Deployment Guide

## ✅ Pre-Deployment Checklist

### **1. Code Quality**
- [x] Build succeeds: `npm run build` (Frontend)
- [x] No TypeScript errors
- [x] All features tested locally
- [x] Environment variables documented

### **2. Security**
- [ ] Change `JWT_SECRET` to strong random string
- [ ] Update default admin password
- [ ] Enable HTTPS/SSL in production
- [ ] Add rate limiting on all endpoints
- [ ] Configure CORS for production domain
- [ ] Remove console.log statements

### **3. Environment Configuration**
- [ ] Production MongoDB URI
- [ ] Production API keys (Groq/OpenAI)
- [ ] Production domain in CORS
- [ ] Environment-specific configs

---

## 🌐 Deployment Options

### **Option 1: Traditional VPS (DigitalOcean, AWS EC2, Linode)**

#### **Backend Setup**
```bash
# 1. SSH into server
ssh user@your-server-ip

# 2. Install Node.js v18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 3. Install MongoDB
# Follow: https://www.mongodb.com/docs/manual/installation/

# 4. Clone repository
git clone <your-repo-url>
cd OmniChannelSystem/Backend

# 5. Install dependencies
npm install --production

# 6. Create .env file
nano .env
# (paste production environment variables)

# 7. Install PM2 for process management
sudo npm install -g pm2

# 8. Start backend
pm2 start app.js --name omnichannel-backend
pm2 save
pm2 startup
```

#### **Frontend Setup**
```bash
# 1. Navigate to frontend
cd ../Frontend

# 2. Install dependencies
npm install

# 3. Create production .env
nano .env
# VITE_API_URL=https://api.yourdomain.com/api

# 4. Build for production
npm run build

# 5. Serve with Nginx
sudo apt-get install nginx

# 6. Configure Nginx
sudo nano /etc/nginx/sites-available/omnichannel
```

**Nginx Config:**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /path/to/OmniChannelSystem/Frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# 7. Enable site
sudo ln -s /etc/nginx/sites-available/omnichannel /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx

# 8. Setup SSL with Certbot (free HTTPS)
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

### **Option 2: Docker Deployment**

```bash
# 1. Build and run with Docker Compose
docker-compose up -d

# 2. Check logs
docker-compose logs -f

# 3. Stop services
docker-compose down
```

**Update docker-compose.yml:**
```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=your-secure-password

  backend:
    build: ./Backend
    ports:
      - "5000:5000"
    depends_on:
      - mongodb
    environment:
      - MONGODB_URI=mongodb://admin:your-secure-password@mongodb:27017/omnichannel?authSource=admin
      - JWT_SECRET=your-production-secret
      - GROQ_API_KEY=${GROQ_API_KEY}
    restart: unless-stopped

  frontend:
    build: ./Frontend
    ports:
      - "8081:80"
    depends_on:
      - backend
    environment:
      - VITE_API_URL=http://backend:5000/api
    restart: unless-stopped

volumes:
  mongo-data:
```

---

### **Option 3: Platform-as-a-Service (Heroku, Railway, Render)**

#### **Render.com (Recommended - Free Tier)**

**Backend:**
1. Go to https://render.com
2. New → Web Service
3. Connect GitHub repo
4. Settings:
   - Build Command: `cd Backend && npm install`
   - Start Command: `cd Backend && node app.js`
   - Environment: Node
   - Add environment variables (see below)

**Frontend:**
1. New → Static Site
2. Connect GitHub repo
3. Settings:
   - Build Command: `cd Frontend && npm install && npm run build`
   - Publish Directory: `Frontend/dist`
   - Add environment variable: `VITE_API_URL=https://your-backend.onrender.com/api`

**MongoDB:**
1. New → Create a MongoDB database
2. Copy connection string
3. Add to backend environment variables

---

### **Option 4: Vercel (Frontend) + Railway (Backend)**

#### **Frontend on Vercel:**
```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy frontend
cd Frontend
vercel

# 3. Add environment variable in Vercel dashboard
# VITE_API_URL=https://your-backend.railway.app/api
```

#### **Backend on Railway:**
1. Go to https://railway.app
2. New Project → Deploy from GitHub
3. Select Backend folder
4. Add environment variables
5. Deploy

---

## 🔐 Production Environment Variables

### **Backend (.env)**
```env
# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/omnichannel?retryWrites=true&w=majority

# JWT
JWT_SECRET=super-secure-random-string-min-32-chars
JWT_EXPIRES_IN=7d

# Server
PORT=5000
NODE_ENV=production

# AI
GROQ_API_KEY=gsk_xxxxxxxxxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxx

# Gmail (optional)
GMAIL_CLIENT_ID=xxxxx.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=xxxxxxxx
GMAIL_REDIRECT_URI=https://yourdomain.com/auth/gmail/callback
GMAIL_REFRESH_TOKEN=1//xxxxxxxx

# WhatsApp (optional)
WHATSAPP_PHONE_ID=xxxxxxxx
WHATSAPP_TOKEN=xxxxxxxx
WHATSAPP_VERIFY_TOKEN=xxxxxxxx

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### **Frontend (.env)**
```env
VITE_API_URL=https://api.yourdomain.com/api
```

---

## 🔒 Security Hardening

### **1. Update CORS Configuration**

**Backend/app.js:**
```javascript
const cors = require('cors');

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:8081'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

### **2. Add Helmet.js (Already configured)**
```javascript
const helmet = require('helmet');
app.use(helmet());
```

### **3. Enable Rate Limiting (Already configured)**
Rate limiting is active on auth endpoints (5 requests/15min).

### **4. MongoDB Security**
```javascript
// Use connection string with auth
MONGODB_URI=mongodb://username:password@host:27017/db?authSource=admin

// Or use MongoDB Atlas (cloud) with IP whitelist
```

### **5. HTTPS/SSL Certificate**
```bash
# Free SSL with Let's Encrypt
sudo certbot --nginx -d yourdomain.com
```

---

## 📊 Monitoring & Logging

### **Option 1: PM2 Logs**
```bash
pm2 logs omnichannel-backend
pm2 monit
```

### **Option 2: Winston Logger**
```bash
npm install winston

# Add to Backend/app.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### **Option 3: External Monitoring**
- **Sentry**: Error tracking
- **LogRocket**: Session replay
- **DataDog**: Application performance monitoring
- **New Relic**: Infrastructure monitoring

---

## 🗄️ Database Backups

### **MongoDB Atlas (Cloud)**
- Automatic backups included
- Point-in-time recovery

### **Self-hosted MongoDB**
```bash
# Backup
mongodump --uri="mongodb://localhost:27017/omnichannel" --out=/path/to/backup

# Restore
mongorestore --uri="mongodb://localhost:27017/omnichannel" /path/to/backup/omnichannel

# Automate with cron (daily at 2 AM)
0 2 * * * mongodump --uri="mongodb://localhost:27017/omnichannel" --out=/backups/$(date +\%Y\%m\%d)
```

---

## 🧪 Production Testing Checklist

After deployment, verify:

- [ ] Frontend loads at production URL
- [ ] Can login with test credentials
- [ ] API endpoints return data
- [ ] HTTPS enabled (green padlock)
- [ ] CORS allows frontend domain
- [ ] MongoDB connection works
- [ ] AI ticket analysis works
- [ ] Notifications display
- [ ] Task creation works
- [ ] Reports export (CSV/PDF)
- [ ] Analytics charts load
- [ ] No console errors
- [ ] Mobile responsive design works

---

## 🚨 Rollback Plan

### **If deployment fails:**

1. **Check logs:**
   ```bash
   pm2 logs
   # or
   docker-compose logs -f
   ```

2. **Rollback to previous commit:**
   ```bash
   git log
   git reset --hard <previous-commit-hash>
   pm2 restart all
   ```

3. **Restore database backup:**
   ```bash
   mongorestore --uri="mongodb://localhost:27017/omnichannel" /backups/latest
   ```

---

## 📈 Performance Optimization

### **Backend**
- [ ] Enable gzip compression
- [ ] Add Redis caching for frequent queries
- [ ] Optimize MongoDB indexes
- [ ] Use connection pooling

### **Frontend**
- [ ] Code splitting (lazy loading routes)
- [ ] Image optimization
- [ ] CDN for static assets
- [ ] Service worker for PWA

### **Database**
```javascript
// Add indexes in MongoDB
db.ticketintelligences.createIndex({ customerId: 1 });
db.ticketintelligences.createIndex({ createdAt: -1 });
db.tasks.createIndex({ assignedTo: 1, status: 1 });
```

---

## 💰 Cost Estimation (Monthly)

### **Free Tier Option:**
- **Frontend**: Vercel (Free)
- **Backend**: Render.com (Free tier)
- **Database**: MongoDB Atlas (Free 512MB)
- **AI**: Groq (Free tier)
- **Total**: $0/month

### **Production Option:**
- **Frontend**: Vercel Pro ($20)
- **Backend**: Render.com Standard ($7)
- **Database**: MongoDB Atlas M10 ($10)
- **AI**: Groq Pro ($20)
- **Total**: ~$57/month

### **Enterprise Option:**
- **VPS**: DigitalOcean Droplet ($24)
- **Database**: MongoDB Atlas M30 ($75)
- **AI**: OpenAI API (pay-per-use)
- **CDN**: Cloudflare (Free)
- **Total**: ~$100-150/month

---

## 🎯 Post-Deployment Tasks

1. **Update README** with production URLs
2. **Add to portfolio** with live demo link
3. **Create demo video** showing key features
4. **Write blog post** about building it
5. **Share on LinkedIn/Twitter** with screenshots
6. **Monitor usage** and errors for first week
7. **Gather feedback** and iterate

---

## 📞 Support & Maintenance

### **Regular Tasks:**
- Update dependencies monthly: `npm update`
- Review error logs weekly
- Database cleanup (old notifications)
- API key rotation quarterly
- Security patches immediately

### **Monitoring:**
- Set up uptime monitoring (UptimeRobot - free)
- Configure alerts for downtime
- Track API usage and limits
- Monitor disk space and memory

---

## ✅ Deployment Complete!

Your OmniChannel Support System is now live! 🎉

**Next Steps:**
1. Share demo URL with employers/recruiters
2. Add to your resume under "Projects"
3. Create case study for portfolio
4. Continue adding features

**Good luck! 🚀**
