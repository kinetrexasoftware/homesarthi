# HomeSarthi Mobile App

React Native mobile application for HomeSarthi - Find your perfect student accommodation.

## 🚀 Features

- ✅ User Authentication (Login & Register)
- ✅ Browse Available Rooms
- ✅ View Room Details
- ✅ Secure Token Storage
- ✅ Cross-platform (iOS & Android)

## 📋 Prerequisites

Before running the app, ensure you have:

1. **Node.js** (LTS version) - Already installed ✓
2. **Expo Go App** - Install on your mobile device:
   - [iOS App Store](https://apps.apple.com/app/expo-go/id982107779)
   - [Google Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

## 🛠️ Installation

All dependencies have been installed. If you need to reinstall:

```bash
npm install
```

## ⚙️ Configuration

### Important: Update API URL

Before running the app, you **MUST** update the API URL in `src/config.js`:

1. Find your computer's IP address:
   ```bash
   ipconfig
   ```
   Look for "IPv4 Address" under your active network adapter (usually starts with 192.168.x.x or 10.x.x.x)

2. Update `src/config.js`:
   ```javascript
   export const API_URL = "http://YOUR_IP_ADDRESS:5000/api";
   ```
   
   **Current IP detected: 10.225.196.8**

## 🏃 Running the App

### Step 1: Start Backend Server
In a separate terminal, navigate to the backend folder and start the server:
```bash
cd ../backend
npm start
```

### Step 2: Start Mobile App
```bash
npx expo start
```

### Step 3: Open on Your Phone
1. Open **Expo Go** app on your phone
2. Scan the QR code displayed in the terminal
3. Make sure your phone and computer are on the **same WiFi network**

## 📱 Testing the App

### Test Login
Use any existing account from your website, or create a new one:
- Email: (your existing user email)
- Password: (your existing password)

### Test Registration
- Fill in all required fields
- Students must provide college name
- Property owners don't need college name

## 🎨 App Structure

```
mobile/
├── App.js                 # Main app entry with navigation
├── src/
│   ├── screens/          # All screen components
│   │   ├── LoginScreen.js
│   │   ├── RegisterScreen.js
│   │   ├── DashboardScreen.js
│   │   └── RoomDetailsScreen.js
│   ├── store/            # State management (Zustand)
│   │   └── authStore.js
│   ├── utils/            # Utilities
│   │   └── api.js        # Axios instance with interceptors
│   └── config.js         # API configuration
├── babel.config.js       # Babel configuration
└── tailwind.config.js    # TailwindCSS (NativeWind) config
```

## 🔧 Troubleshooting

### "Network request failed"
- Ensure backend is running on port 5000
- Verify your IP address in `src/config.js` is correct
- Check that phone and computer are on same WiFi

### "Unable to resolve module"
```bash
npm install
npx expo start --clear
```

### App crashes on startup
```bash
npm install
rm -rf node_modules
npm install
```

## 📦 Dependencies

- **expo** - React Native framework
- **axios** - HTTP client
- **expo-secure-store** - Secure token storage
- **@react-navigation/native** - Navigation
- **zustand** - State management
- **nativewind** - TailwindCSS for React Native
- **lucide-react-native** - Icons

## 🔐 Security

- JWT tokens stored securely using Expo SecureStore
- Automatic token attachment to API requests
- Session persistence across app restarts

## 📝 Next Steps

To make your app fully functional like the website, you can add:

1. **Search & Filters** - Location-based search, price filters
2. **Favorites** - Save rooms for later
3. **User Profile** - Edit profile, upload avatar
4. **Chat** - Real-time messaging with property owners
5. **Booking** - Schedule visits and book rooms
6. **Notifications** - Push notifications for messages
7. **Maps** - Interactive map view of rooms

## 🆘 Need Help?

If you encounter any issues:
1. Check that backend server is running
2. Verify IP address configuration
3. Ensure phone and computer are on same network
4. Check Expo Go app is up to date
