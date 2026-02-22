# 🚀 Quick Start - Play Store Launch Commands

## Run these commands in order:

### 1️⃣ Install EAS CLI (One-time setup)
```bash
npm install -g eas-cli
```

### 2️⃣ Login to Expo
```bash
eas login
```
**Use your Expo account:** hridesh607

### 3️⃣ Navigate to mobile folder
```bash
cd mobile
```

### 4️⃣ Configure EAS Build (First time only)
```bash
eas build:configure
```
- Choose: **Android**
- Let it create `eas.json` (already done for you!)

### 5️⃣ Build Preview APK (For testing)
```bash
eas build --platform android --profile preview
```
**Wait time:** 15-20 minutes
**Result:** Download link for APK to test on phone

### 6️⃣ Test the APK
- Download APK from link
- Install on Android phone
- Test all features
- Fix any bugs

### 7️⃣ Build Production AAB (For Play Store)
```bash
eas build --platform android --profile production
```
**Wait time:** 15-20 minutes
**Result:** Download link for AAB file

### 8️⃣ Download AAB
- Click the download link
- Save AAB file to safe location
- This is what you upload to Play Console

---

## 🔄 If you need to rebuild (after changes):

### Increment version first:
Edit `app.json`:
```json
{
  "expo": {
    "version": "1.0.1",  // Increment this
    "android": {
      "versionCode": 2   // Increment this too
    }
  }
}
```

### Then rebuild:
```bash
eas build --platform android --profile production
```

---

## 🆘 Troubleshooting Commands

### Clear build cache:
```bash
eas build --platform android --clear-cache
```

### View build logs:
```bash
eas build:list
```

### Reset credentials (if signature issues):
```bash
eas credentials
```
- Select: Android
- Choose: Remove and regenerate keystore

---

## 📱 After Build Completes

1. **Download AAB file** from Expo dashboard
2. **Go to** https://play.google.com/console
3. **Create app** (if not done)
4. **Upload AAB** to Internal Testing or Production
5. **Fill store listing** (screenshots, description)
6. **Submit for review**

---

## ⏱️ Expected Timeline

| Step | Time Required |
|------|---------------|
| Install EAS CLI | 2 minutes |
| Login | 1 minute |
| Configure | 2 minutes |
| Build APK | 15-20 minutes |
| Test APK | 30-60 minutes |
| Build AAB | 15-20 minutes |
| Create Play Store listing | 2-3 hours |
| Submit for review | 5 minutes |
| **Google review wait** | **1-7 days** |

**Total:** ~1 day of work + waiting for Google approval

---

## 🎯 Your Next 3 Commands

```bash
# 1. Install EAS
npm install -g eas-cli

# 2. Login to Expo
eas login

# 3. Build for testing
cd mobile && eas build --platform android --profile preview
```

**That's it! The build will start, and you'll get APK in 15-20 mins! 🎉**

---

## 📋 What You Need Ready

- [x] Expo account (hridesh607) - ✅ You have this
- [ ] Google Play Developer account ($25)
- [ ] Privacy Policy URL
- [ ] App screenshots (2-8 images)
- [ ] Production backend URL (HTTPS)

---

## 📖 Full Documentation

- **Complete Guide:** `PLAYSTORE_LAUNCH_GUIDE.md`
- **Content Templates:** `PLAYSTORE_LISTING_CONTENT.md`
- **Checklist:** `LAUNCH_CHECKLIST.md`
- **Production Setup:** `PRODUCTION_ENV_SETUP.md`

---

**Ready? Run the first command now! 🚀**
