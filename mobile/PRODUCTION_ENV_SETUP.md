# ⚠️ PRODUCTION ENVIRONMENT CONFIGURATION

## Current Setup (Development)
EXPO_PUBLIC_SERVER_URL=http://172.20.10.6:5000

## ⚠️ REQUIRED FOR PLAY STORE

Before building for Play Store, you MUST update this to your production server:

### Option 1: Deploy Backend to Cloud (Recommended)

Deploy your backend to one of these services:

**1. Railway.app (Easiest - Free tier)**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
cd ../backend
railway login
railway init
railway up
```
You'll get a URL like: `https://HomeSarthi-production.up.railway.app`

**2. Render.com (Free tier, good Docker support)**
- Go to: https://render.com
- Connect GitHub repo
- Create "Web Service"
- Deploy backend folder
- Get URL like: `https://HomeSarthi-api.onrender.com`

**3. AWS EC2 / Digital Ocean (More control, paid)**
- Launch EC2 instance (t2.micro free tier)
- Install Node.js
- Deploy your backend
- Get public IP or domain

### Option 2: Use Ngrok (Temporary - Testing Only)

**⚠️ Only for initial testing, NOT for production launch!**

```bash
# Install ngrok
npm install -g ngrok

# In separate terminal, run your backend
cd backend
npm run dev

# In another terminal, expose it
ngrok http 5000
```

You'll get a URL like: `https://abc123.ngrok.io`

**Limitation:** This URL changes every time ngrok restarts!

---

## Production .env Configuration

Once you have your production server URL, update `.env`:

```env
# Production Backend URL (MUST be HTTPS!)
EXPO_PUBLIC_SERVER_URL=https://your-production-api.com

# Optional: Socket URL (if different)
EXPO_PUBLIC_SOCKET_URL=https://your-production-api.com
```

### ✅ Checklist Before Building:

- [ ] Backend deployed to cloud service
- [ ] Backend URL is **HTTPS** (not HTTP)
- [ ] `.env` file updated with production URL
- [ ] Tested API calls work from mobile app
- [ ] Database is production MongoDB (not local)
- [ ] Environment variables set on server (JWT_SECRET, etc.)

---

## Quick Deploy to Railway.app

1. **Install Railway CLI:**
   ```bash
   npm install -g @railway/cli
   ```

2. **Navigate to backend:**
   ```bash
   cd ../backend
   ```

3. **Login to Railway:**
   ```bash
   railway login
   ```

4. **Initialize project:**
   ```bash
   railway init
   ```

5. **Deploy:**
   ```bash
   railway up
   ```

6. **Get your URL:**
   ```bash
   railway domain
   ```
   Copy the URL (e.g., `https://HomeSarthi-production.up.railway.app`)

7. **Update mobile/.env:**
   ```env
   EXPO_PUBLIC_SERVER_URL=https://HomeSarthi-production.up.railway.app
   ```

8. **Add environment variables on Railway:**
   - Go to Railway dashboard
   - Click your project
   - Settings → Variables
   - Add: `MONGODB_URI`, `JWT_SECRET`, `CLOUDINARY_*` etc.

---

## Verify Production Setup

Before building, test your production backend:

```bash
# Test API endpoint
curl https://your-production-api.com/api/health

# Should return: {"status":"ok"}
```

---

## After Deployment

Remember to:
- ✅ Update CORS settings on backend to allow mobile app
- ✅ Set proper rate limits
- ✅ Enable SSL/HTTPS
- ✅ Use production MongoDB (MongoDB Atlas recommended)
- ✅ Set proper environment variables
- ✅ Test all API endpoints

---

## Need Help?

**Railway Docs:** https://docs.railway.app/
**Render Docs:** https://render.com/docs
**MongoDB Atlas:** https://www.mongodb.com/atlas/database

---

**🔴 CRITICAL:** Google Play Store REJECTS apps using HTTP (non-HTTPS) APIs!
Your backend MUST be on HTTPS before releasing to production.
