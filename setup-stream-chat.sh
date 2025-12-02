#!/bin/bash

# Stream Chat Setup Helper Script for Copse
# This script helps configure Stream Chat integration

set -e

echo "🌲 Copse - Stream Chat Setup Helper"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "ios/Copse" ]; then
    echo -e "${RED}❌ Error: Please run this script from the pack1703-portal root directory${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Step 1: Get Stream Chat Credentials${NC}"
echo ""
echo "1. Go to: https://getstream.io/chat/"
echo "2. Sign up or log in"
echo "3. Create a new app (or use existing)"
echo "4. Copy your API Key and API Secret"
echo ""
read -p "Press ENTER when you have your credentials ready..."
echo ""

# Get API credentials
echo -e "${YELLOW}🔑 Enter your Stream Chat credentials:${NC}"
read -p "API Key: " STREAM_API_KEY
read -p "API Secret: " STREAM_API_SECRET
echo ""

if [ -z "$STREAM_API_KEY" ] || [ -z "$STREAM_API_SECRET" ]; then
    echo -e "${RED}❌ Error: API Key and Secret are required${NC}"
    exit 1
fi

echo -e "${BLUE}📝 Step 2: Updating iOS Info.plist${NC}"
# Update Info.plist with API key
if [ -f "ios/Copse/Info.plist" ]; then
    # Check if key already exists
    if grep -q "STREAM_API_KEY" ios/Copse/Info.plist; then
        # Replace existing key
        sed -i.bak "s|<string>YOUR_STREAM_API_KEY_HERE</string>|<string>$STREAM_API_KEY</string>|g" ios/Copse/Info.plist
        sed -i.bak "s|<string>.*</string><!-- STREAM_API_KEY -->|<string>$STREAM_API_KEY</string>|g" ios/Copse/Info.plist
        echo -e "${GREEN}✅ Updated STREAM_API_KEY in Info.plist${NC}"
    else
        echo -e "${YELLOW}⚠️  STREAM_API_KEY not found in Info.plist${NC}"
        echo "Please manually add it to ios/Copse/Info.plist"
    fi
    rm -f ios/Copse/Info.plist.bak 2>/dev/null || true
else
    echo -e "${RED}❌ Error: Info.plist not found${NC}"
    exit 1
fi
echo ""

echo -e "${BLUE}📦 Step 3: Installing NPM Dependencies${NC}"
cd functions
npm install
cd ..
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

echo -e "${BLUE}🔧 Step 4: Configuring Firebase Functions${NC}"
firebase functions:config:set \
    stream.api_key="$STREAM_API_KEY" \
    stream.api_secret="$STREAM_API_SECRET"

echo -e "${GREEN}✅ Firebase config updated${NC}"
echo ""

echo -e "${BLUE}📤 Step 5: Deploying Cloud Functions${NC}"
echo "Deploying generateStreamChatToken, createStreamChatChannel, and addUserToOrganizationChannels..."
firebase deploy --only functions:generateStreamChatToken,functions:createStreamChatChannel,functions:addUserToOrganizationChannels

echo ""
echo -e "${GREEN}✅ Cloud Functions deployed!${NC}"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 Backend Setup Complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: Next Steps in Xcode${NC}"
echo ""
echo "1. Open Copse.xcodeproj in Xcode"
echo "2. Go to: Project → Copse Target → Package Dependencies"
echo "3. Click '+' and add:"
echo "   https://github.com/GetStream/stream-chat-swift.git"
echo "4. Select version 4.94.0"
echo "5. Add products: StreamChat + StreamChatUI"
echo ""
echo "Then build and run the app (Cmd+R)!"
echo ""
echo -e "${BLUE}📚 For detailed testing instructions, see:${NC}"
echo "   ios/Copse/TEST_CHECKLIST.md"
echo ""
echo -e "${GREEN}Happy chatting! 💬🌲${NC}"

