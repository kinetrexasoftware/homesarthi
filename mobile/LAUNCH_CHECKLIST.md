# 📋 Play Store Launch Checklist

## ⏰ Timeline: 7-10 Days to Launch

Copy this checklist and mark items as you complete them!

---

## 🔴 PHASE 1: CRITICAL REQUIREMENTS (Must Do First)

### Google Play Developer Account
- [ ] Pay $25 registration fee at https://play.google.com/console
- [ ] Complete developer profile (name, address, email)
- [ ] Verify email address
- [ ] Accept developer agreement

### Production Backend Deployment
- [ ] Deploy backend to Railway/Render/AWS
- [ ] Get HTTPS production URL
- [ ] Update `mobile/.env` with production URL
- [ ] Test API endpoints work from mobile app
- [ ] Verify MongoDB is production database (not local)
- [ ] Set environment variables on server (JWT_SECRET, etc.)

### Legal Documents (MANDATORY)
- [ ] Create Privacy Policy (use https://app-privacy-policy-generator.nisrulz.com/)
- [ ] Create Terms of Service
- [ ] Host both documents publicly (your website or GitHub Pages)
- [ ] Save URLs for Play Console

---

## 🟡 PHASE 2: APP CONFIGURATION

### Environment Setup
- [ ] Install EAS CLI: `npm install -g eas-cli`
- [ ] Login to Expo: `eas login`
- [ ] Configure EAS build: `eas build:configure`
- [ ] Verify `eas.json` created successfully

### App Assets Verification
- [ ] App icon (`assets/icon.png`) is 512x512 minimum
- [ ] Adaptive icon (`assets/adaptive-icon.png`) is 1024x1024
- [ ] Splash screen (`assets/splash-icon.png`) looks good
- [ ] All images are high quality (no pixelation)

### App.json Review
- [ ] App name is correct: "HomeSarthi"
- [ ] Package name is correct: `com.HomeSarthi.mobile`
- [ ] Version is `1.0.0`
- [ ] versionCode is `1`
- [ ] Permissions are minimal and necessary

---

## 🟢 PHASE 3: BUILD & TEST

### Build APK for Testing
- [ ] Run: `eas build --platform android --profile preview`
- [ ] Wait for build to complete (15-20 mins)
- [ ] Download APK from Expo dashboard
- [ ] Install on your Android phone
- [ ] Test all major features work

### Testing Checklist
- [ ] Login/Registration works
- [ ] Search functionality works
- [ ] Can view room details
- [ ] Chat messaging works
- [ ] Location/Map works
- [ ] Image upload works
- [ ] Push notifications work
- [ ] No crashes during 30-min usage
- [ ] Tested on 2-3 different Android devices

### Build Production AAB
- [ ] Update `eas.json` buildType to `app-bundle`
- [ ] Run: `eas build --platform android --profile production`
- [ ] Download AAB file
- [ ] Save AAB file safely (you'll upload to Play Console)

---

## 🔵 PHASE 4: PLAY STORE LISTING

### Create App in Play Console
- [ ] Go to https://play.google.com/console
- [ ] Click "Create App"
- [ ] Fill basic details:
  - Name: HomeSarthi - Student Housing
  - Language: English (India)
  - Type: App
  - Free/Paid: Free

### Store Listing Content
- [ ] Write short description (80 chars) - use template from PLAYSTORE_LISTING_CONTENT.md
- [ ] Write full description (4000 chars) - copy from template
- [ ] Upload app icon (512x512)
- [ ] Create 2-8 screenshots (1080x1920) - see guide below
- [ ] Create feature graphic (1024x500) - use Canva
- [ ] Optional: Create promo video (30 secs)

### Screenshots to Create
Screenshot 1: Home/Search screen
- [ ] Open app on emulator/phone
- [ ] Take screenshot of main search page
- [ ] Save as `screenshot-1-home.png`

Screenshot 2: Map View
- [ ] Navigate to map view
- [ ] Show rooms with price markers
- [ ] Save as `screenshot-2-map.png`

Screenshot 3: Room Details
- [ ] Open any room listing
- [ ] Show photos, amenities, price
- [ ] Save as `screenshot-3-details.png`

Screenshot 4: Chat Screen
- [ ] Open chat with owner
- [ ] Show conversation
- [ ] Save as `screenshot-4-chat.png`

Screenshot 5: Filters
- [ ] Open search filters
- [ ] Show categories, budget sliders
- [ ] Save as `screenshot-5-filters.png`

Screenshot 6: Dashboard
- [ ] Open student dashboard
- [ ] Show saved rooms, stats
- [ ] Save as `screenshot-6-dashboard.png`

### App Categorization
- [ ] Select category: **House & Home**
- [ ] Add tags: student housing, rental, rooms, PG, hostel
- [ ] Complete content rating questionnaire
  - User-generated content: YES (chat)
  - Social features: YES (chat)
  - Location sharing: YES
  - Violence/profanity/sexual: NO
  - Gambling: NO

### Contact Details
- [ ] Add support email: support@homesarthi.com
- [ ] Add website: https://homesarthi.com
- [ ] Add privacy policy URL
- [ ] Add phone (optional)

### Data Safety Section
- [ ] Declare location data collection (approximate + precise)
- [ ] Declare personal info (name, email, phone)
- [ ] Declare photos collection
- [ ] Declare messages (chat)
- [ ] Select "Data encrypted in transit"
- [ ] Select "User can request data deletion"
- [ ] Confirm no third-party sharing (except owner-student)

---

## 🟣 PHASE 5: INTERNAL TESTING

### Setup Internal Testing
- [ ] Go to Testing → Internal Testing
- [ ] Create new release
- [ ] Upload AAB file
- [ ] Fill release notes (see template)
- [ ] Add 5-10 tester emails (friends, team)
- [ ] Send invite links

### Beta Testing
- [ ] Testers install app via invite link
- [ ] Collect feedback for 24-48 hours
- [ ] Fix any critical bugs
- [ ] Build new AAB if needed (increment versionCode)

---

## 🟠 PHASE 6: PRODUCTION RELEASE

### Final Pre-Launch Checks
- [ ] All store listing sections complete (green checkmarks)
- [ ] Privacy policy URL works
- [ ] Screenshots look professional
- [ ] Description has no typos
- [ ] App tested with zero crashes
- [ ] Backend API is stable
- [ ] No placeholder content in app

### Submit for Review
- [ ] Go to Production → Create New Release
- [ ] Upload production AAB
- [ ] Write release notes (see template)
- [ ] Choose rollout: Start with 10%
- [ ] Click "Review Release"
- [ ] Click "Start Rollout to Production"

### Post-Submission
- [ ] Wait for Google review (1-7 days, usually 2-3 days)
- [ ] Check Play Console for any review issues
- [ ] Respond to any Google requests

---

## 🎊 PHASE 7: POST-LAUNCH

### Launch Day
- [ ] App is LIVE on Play Store! 🎉
- [ ] Share Play Store link on social media
- [ ] Share with college friends and groups
- [ ] Ask for initial reviews (5-star hopefully!)

### Monitoring (First Week)
- [ ] Check crash reports daily in Play Console
- [ ] Monitor ANR (App Not Responding) rate
- [ ] Read and respond to user reviews
- [ ] Track installs and retention

### Gradual Rollout
- [ ] Day 1: 10% rollout
- [ ] Day 3: If no issues, increase to 50%
- [ ] Day 5: If stable, increase to 100%

### Marketing Launch
- [ ] Post on Instagram, Facebook
- [ ] Share in WhatsApp college groups
- [ ] Email to college placement cells
- [ ] Create press release
- [ ] Reach out to local news/blogs

---

## 🛠 COMMON ISSUES & QUICK FIXES

### "Build Failed"
```bash
# Clear cache and retry
eas build --platform android --clear-cache
```

### "Invalid AAB Signature"
```bash
# Reset credentials
eas credentials
# Select Android → Remove keystore → Generate new
```

### "App not compatible with device"
- Check `minSdkVersion` in app.json (should be 21+)
- Verify targetSdkVersion is latest (33+)

### "Privacy Policy Required"
- Create using: https://app-privacy-policy-generator.nisrulz.com/
- Host on GitHub Pages (free)

---

## 📞 SUPPORT RESOURCES

**If you get stuck:**
- Expo Forums: https://forums.expo.dev/
- Expo Discord: https://discord.gg/expo
- Play Console Help: https://support.google.com/googleplay
- Stack Overflow: Tag `expo` + `android` + `eas-build`

**Useful Tools:**
- Icon Generator: https://easyappicon.com/
- Screenshot Frames: https://www.canva.com/
- Privacy Policy: https://app-privacy-policy-generator.nisrulz.com/
- App Description Writer: ChatGPT / Claude

---

## ✅ FINAL CHECKLIST BEFORE SUBMIT

- [ ] ✅ Backend is on HTTPS (not HTTP)
- [ ] ✅ Privacy Policy is live and accessible
- [ ] ✅ App builds without errors
- [ ] ✅ Tested on real device (not just emulator)
- [ ] ✅ No critical bugs or crashes
- [ ] ✅ Screenshots are high quality (1080x1920)
- [ ] ✅ Description is compelling and clear
- [ ] ✅ All permissions are justified
- [ ] ✅ Content rating completed
- [ ] ✅ $25 Play Console fee paid
- [ ] ✅ Internal testing done (5+ testers)
- [ ] ✅ AAB file is production build (not debug)
- [ ] ✅ Version number is correct (1.0.0)
- [ ] ✅ Package name matches (`com.HomeSarthi.mobile`)

---

## 🎯 EXPECTED TIMELINE

**Day 1-2:** Setup, configuration, build APK
**Day 3:** Internal testing
**Day 4:** Create Play Console listing
**Day 5:** Submit for review
**Day 6-8:** Google review (wait)
**Day 9+:** APP GOES LIVE! 🚀

---

**Pro Tip:** Don't rush! It's better to spend an extra day polishing than to get rejected and wait another week for re-review.

**Good luck with your launch! 🎊**

---

## 📝 NOTES SECTION

Use this space to track your progress:

**Today's Date:** _______________

**Current Phase:** _______________

**Blockers/Issues:**
- 
- 
- 

**Next Steps:**
1. 
2. 
3. 

**Important Links:**
- Play Store URL (after launch): _______________
- Backend Production URL: _______________
- Privacy Policy URL: _______________
