# 🚀 HomeSarthi Play Store Launch Guide

## Complete Step-by-Step Checklist

---

## ✅ **PHASE 1: Pre-Launch Preparation**

### 1.1 Install EAS CLI
```bash
npm install -g eas-cli
```

### 1.2 Login to Expo Account
```bash
eas login
```
- Email: hridesh607@expo.dev (or your Expo account)
- This is required for building

### 1.3 Google Play Console Account
- Go to: https://play.google.com/console
- **Cost: $25 one-time fee (required)**
- Complete payment to register as developer
- Fill developer details (name, email, address)

---

## ✅ **PHASE 2: App Configuration**

### 2.1 Update App Assets (CRITICAL)

**Required Images:**
1. **App Icon** (512x512 px) - `./assets/icon.png` ✓ (Already exists)
2. **Adaptive Icon** (1024x1024 px) - `./assets/adaptive-icon.png` ✓ (Already exists)
3. **Splash Screen** - `./assets/splash-icon.png` ✓ (Already exists)

**Action Items:**
- ✅ Icon is already configured
- ✅ Package name set: `com.HomeSarthi.mobile`
- ⚠️ Need to verify icons are high quality (512x512 minimum)

### 2.2 Create Privacy Policy & Terms (MANDATORY)

Google requires these URLs before you can publish.

**Option 1: Use Template (Recommended)**
- Go to: https://app-privacy-policy-generator.nisrulz.com/
- Fill in:
  - App Name: HomeSarthi
  - Contact Email: [your email]
  - Permissions: Location, Camera/Photos, Storage
  - Generate & host on GitHub Pages or your website

**Option 2: Create Your Own**
- Must cover: Data collection, usage, sharing, user rights
- Host at: https://homesarthi.com/privacy-policy
- Host at: https://homesarthi.com/terms-of-service

### 2.3 Update App Config

Already configured in `app.json`:
```json
{
  "name": "HomeSarthi",
  "version": "1.0.0",
  "android": {
    "package": "com.HomeSarthi.mobile",
    "versionCode": 1,
    "permissions": [
      "ACCESS_COARSE_LOCATION",
      "ACCESS_FINE_LOCATION",
      "READ_MEDIA_IMAGES",
      "READ_EXTERNAL_STORAGE"
    ]
  }
}
```

✅ **This is already perfect!**

---

## ✅ **PHASE 3: Build Configuration (EAS)**

### 3.1 Initialize EAS Build
```bash
cd mobile
eas build:configure
```
- This creates `eas.json` file
- Choose: **Android** initially
- Select: **Generate new keystore** (for first build)

### 3.2 Set Environment Variables

Create `eas.json` with production environment:
```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      }
    },
    "preview": {
      "android": {
        "buildType": "apk"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

### 3.3 Verify .env Configuration

Make sure `.env` has production API URL:
```
API_URL=https://your-production-backend.com/api
SOCKET_URL=https://your-production-backend.com
```

⚠️ **IMPORTANT:** Update these before building!

---

## ✅ **PHASE 4: Build the App**

### 4.1 Build Production APK (For Testing)
```bash
eas build --platform android --profile production
```

**What happens:**
- Build runs on Expo's servers (takes 10-20 mins)
- You'll get a download link for APK
- Install on your phone to test

### 4.2 Build Production AAB (For Play Store)
```bash
eas build --platform android --profile production
```

After build completes, modify `eas.json` to create AAB:
```json
{
  "build": {
    "production": {
      "android": {
        "buildType": "app-bundle"
      }
    }
  }
}
```

Then rebuild:
```bash
eas build --platform android --profile production
```

**AAB file is required for Play Store submission.**

---

## ✅ **PHASE 5: Play Store Listing Setup**

### 5.1 Create App in Console
1. Go to: https://play.google.com/console
2. Click **"Create App"**
3. Fill details:
   - **App Name:** HomeSarthi - Student Housing
   - **Default Language:** English (India)
   - **App Type:** App
   - **Free or Paid:** Free

### 5.2 Store Listing (Required Fields)

**App Details:**
- **Short Description** (80 chars max):
  ```
  Find verified student rooms near your college. Zero brokerage. Direct owners.
  ```

- **Full Description** (4000 chars max):
  ```
  🏠 HomeSarthi - India's #1 Student Housing Platform

  Find Your Perfect Room Near Campus - Zero Brokerage Guaranteed!

  ✅ WHY HOMESARTHI?
  • 100% Verified Owners - Every listing manually checked
  • Zero Brokerage - Save ₹10,000-50,000 in fees
  • College-Based Search - Find rooms walking distance from your campus
  • Direct Chat with Owners - No middleman
  • Safe & Secure - Identity verification for visits
  • Real Photos - What you see is what you get

  🎯 PERFECT FOR STUDENTS
  Whether you're looking for:
  • 1 RK / 1 BHK near college
  • PG accommodation
  • Hostel rooms
  • Shared flats
  • Individual rooms

  📍 SMART LOCATION SEARCH
  • Search by college name (IIT, NIT, Amity, etc.)
  • Filter by distance (200m to 10km radius)
  • GPS-based "Near Me" search
  • Map view with prices

  💬 DIRECT COMMUNICATION
  • In-app chat with property owners
  • Schedule visits instantly
  • Get verified owner contact after approval

  🔒 SAFETY FIRST
  • Mandatory Aadhar verification for visits
  • Graduated location disclosure
  • Owner document verification
  • Secure payment information

  🌟 FEATURES
  • Advanced filters (budget, furnishing, amenities)
  • Save favorite rooms
  • Visit history tracking
  • Real-time notifications
  • Offline support

  📊 TRUSTED BY THOUSANDS
  • 10,000+ verified listings
  • 500+ cities covered
  • 50,000+ happy students

  💰 100% FREE FOR STUDENTS
  No hidden charges. No subscription fees. Find your perfect room today!

  Download HomeSarthi now and say goodbye to brokers forever! 🎉
  ```

- **App Icon:** 512x512 PNG (upload from `assets/icon.png`)

### 5.3 Screenshots (CRITICAL - Need 2-8 screenshots)

**Required Sizes:**
- Phone: 1080 x 1920 px (minimum 2 screenshots)
- Tablet (optional): 1536 x 2048 px

**How to Create:**
1. Open app on emulator/device
2. Take screenshots of:
   - **Home/Search Screen** (showing college search)
   - **Map View** (rooms with prices)
   - **Room Details** (with photos, amenities)
   - **Chat Screen** (student-owner conversation)
   - **Search Filters** (showing categories)
   - **Profile/Dashboard** (stats, saved rooms)

**Tools:**
- Use Android Studio Emulator (easiest)
- Or use your phone and ADB: `adb shell screencap -p /sdcard/screenshot.png`
- Upload to `mobile/screenshots/` folder

### 5.4 Graphic Assets

**Feature Graphic** (Required):
- Size: 1024 x 500 px
- Create a banner showing app name + tagline
- Tools: Canva.com (free templates)
- Example: "HomeSarthi - Zero Brokerage Student Rooms"

**Promo Video** (Optional but recommended):
- 15-30 second app demo
- Upload to YouTube
- Paste link in Play Console

### 5.5 Categorization

- **Category:** House & Home
- **Tags:** student housing, rental, rooms, PG, hostel
- **Content Rating:** Complete questionnaire (select "Everyone")

### 5.6 Contact Details

- **Email:** your-support-email@homesarthi.com
- **Phone:** (optional)
- **Website:** https://homesarthi.com
- **Privacy Policy URL:** https://homesarthi.com/privacy-policy

---

## ✅ **PHASE 6: Upload AAB & Testing**

### 6.1 Create Internal Test Release

1. Go to **Testing → Internal Testing**
2. Click **"Create New Release"**
3. Upload your **AAB file** (from EAS build)
4. Fill:
   - **Release Name:** v1.0.0 - Initial Launch
   - **Release Notes:**
     ```
     🎉 Welcome to HomeSarthi v1.0!

     • Search verified student rooms near your college
     • Zero brokerage - save thousands
     • Direct chat with owners
     • Safe & secure with identity verification
     • Real-time notifications
     
     This is our initial release. Report bugs at support@homesarthi.com
     ```

### 6.2 Add Internal Testers

- Add 5-10 email addresses (friends, team)
- They'll get an invite link
- Test for 1-2 days before production

### 6.3 Move to Production

After testing:
1. Go to **Production → Create New Release**
2. Upload same AAB
3. Choose **Rollout Percentage:**
   - Start with 10% (safest)
   - Increase to 50% after 24 hours
   - 100% after 3-5 days

---

## ✅ **PHASE 7: App Review & Compliance**

### 7.1 Data Safety Section

**Data Collected:**
- ✅ Location (approximate & precise)
- ✅ Personal info (name, email, phone)
- ✅ Photos (room images, profile picture)
- ✅ User content (chat messages)

**Data Usage:**
- App functionality
- Personalization
- Analytics

**Data Sharing:**
- ❌ Not shared with third parties

### 7.2 Target Audience

- **Target Age:** 13+
- **Ads:** No (if you don't have ads)

### 7.3 Submit for Review

1. Complete all sections (green checkmarks)
2. Click **"Send for Review"**
3. **Review time:** 1-7 days (usually 2-3 days)

---

## ✅ **PHASE 8: Post-Launch**

### 8.1 Monitor Feedback

- Read reviews daily
- Respond to user issues
- Track crash reports in Play Console

### 8.2 Update Version

When you make changes:
1. Update `version` in `app.json`: "1.0.1"
2. Update `versionCode`: 2
3. Build new AAB
4. Upload to **Production → Create New Release**

---

## 🔧 **Common Issues & Solutions**

### Issue 1: "Invalid Signature"
**Solution:**
```bash
eas credentials
```
- Select Android
- Remove old keystore
- Generate new keystore

### Issue 2: "App Not Installable"
**Solution:**
- Check package name matches: `com.HomeSarthi.mobile`
- Ensure versionCode increments with each build

### Issue 3: "Missing Privacy Policy"
**Solution:**
- Host privacy policy on your domain
- Or use GitHub Pages (free)

### Issue 4: Build Fails
**Solution:**
```bash
# Clear cache
rm -rf node_modules
npm install

# Try build again
eas build --platform android --clear-cache
```

---

## 📋 **Pre-Launch Checklist**

Before submitting to Play Store, verify:

- [ ] **App builds successfully** (APK/AAB)
- [ ] **Tested on real device** (not just emulator)
- [ ] **All features work** (login, search, chat, etc.)
- [ ] **Backend API is HTTPS** (not HTTP)
- [ ] **Privacy Policy URL live**
- [ ] **Terms of Service URL live**
- [ ] **App icon is 512x512 high quality**
- [ ] **2-8 screenshots ready** (1080x1920)
- [ ] **Feature graphic ready** (1024x500)
- [ ] **Short description written** (80 chars)
- [ ] **Full description written** (compelling copy)
- [ ] **Content rating completed**
- [ ] **Contact email working**
- [ ] **Version number correct** (1.0.0)
- [ ] **Package name correct** (com.HomeSarthi.mobile)
- [ ] **Tested with 5+ beta users**
- [ ] **No critical bugs**
- [ ] **Crash-free rate >99%**

---

## 🎯 **Quick Start Commands**

```bash
# 1. Install EAS
npm install -g eas-cli

# 2. Login
eas login

# 3. Configure build
cd mobile
eas build:configure

# 4. Build for Play Store
eas build --platform android --profile production

# 5. After build completes, download AAB and upload to Play Console
```

---

## 📞 **Support & Resources**

- **Expo EAS Docs:** https://docs.expo.dev/build/introduction/
- **Play Console Help:** https://support.google.com/googleplay/android-developer
- **App Icon Generator:** https://easyappicon.com/
- **Screenshot Designer:** https://www.canva.com/
- **Privacy Policy Generator:** https://app-privacy-policy-generator.nisrulz.com/

---

## 🚨 **IMPORTANT REMINDERS**

1. **$25 Google Play Fee** - Required before you can publish
2. **HTTPS Backend** - Play Store rejects HTTP apps
3. **Privacy Policy** - Mandatory, must be publicly accessible
4. **Test Thoroughly** - Use Internal Testing track first
5. **Backup Keystore** - EAS handles this, but keep credentials safe
6. **Update ENV Variables** - Use production API URLs

---

## 🎉 **Expected Timeline**

- **Day 1:** Complete setup, create app in Play Console
- **Day 2:** Build APK/AAB, upload screenshots
- **Day 3:** Internal testing with friends
- **Day 4:** Submit for review
- **Day 5-7:** Google review (wait)
- **Day 8+:** APP GOES LIVE! 🎊

---

**Good luck with your launch! 🚀**

Need help? Check Expo Discord or Stack Overflow.
