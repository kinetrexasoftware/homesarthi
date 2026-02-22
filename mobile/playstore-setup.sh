#!/bin/bash

# HomeSarthi Play Store Launch - Quick Start Script
# This script guides you through the initial setup for Play Store deployment

echo "🚀 HomeSarthi Play Store Launch Setup"
echo "======================================"
echo ""

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "📦 Installing EAS CLI globally..."
    npm install -g eas-cli
else
    echo "✅ EAS CLI is already installed"
fi

echo ""
echo "🔐 Step 1: Login to Expo Account"
echo "--------------------------------"
echo "You'll be prompted to login with your Expo account (hridesh607)"
eas login

echo ""
echo "⚙️  Step 2: Configure Build"
echo "-------------------------"
echo "This will create build configuration for Android"
eas build:configure

echo ""
echo "✅ Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Update your .env file with PRODUCTION API URLs"
echo "2. Verify your app assets (icon, splash screen)"
echo "3. Run: npm install (if any missing dependencies)"
echo "4. Build APK for testing: eas build --platform android --profile preview"
echo "5. Build AAB for Play Store: eas build --platform android --profile production"
echo ""
echo "📖 Check PLAYSTORE_LAUNCH_GUIDE.md for detailed instructions!"
echo ""
