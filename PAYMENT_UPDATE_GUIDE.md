# Payment Update Script Setup Guide

## 🚀 Quick Setup

### Step 1: Install Dependencies
```bash
npm install firebase
```

### Step 2: Get Your Firebase Configuration

1. Go to your Firebase Console: https://console.firebase.google.com/
2. Select your project: `pack1703-portal`
3. Click the gear icon → Project Settings
4. Scroll down to "Your apps" section
5. Click on your web app
6. Copy the `firebaseConfig` object

### Step 3: Update the Script

Open `update-payments-simple.js` and replace the `firebaseConfig` object with your actual values:

```javascript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-actual-domain",
  projectId: "your-actual-project-id",
  storageBucket: "your-actual-storage-bucket",
  messagingSenderId: "your-actual-sender-id",
  appId: "your-actual-app-id"
};
```

### Step 4: Update Event ID

Find your event ID by:
1. Going to your events page
2. Looking at the URL when you click on an event
3. The event ID is in the URL: `/events/[EVENT_ID]`

Replace `EVENT_ID` in the script:
```javascript
const EVENT_ID = 'your-actual-event-id';
```

### Step 5: Run the Script

```bash
node update-payments-simple.js
```

The script will:
1. Ask for your admin email and password
2. Connect to Firebase
3. Find each user from the Square list
4. Update their payment status to "completed"
5. Create payment records
6. Show you a summary

## 🔧 What the Script Does

For each user who paid $60:

1. **Finds the user** in your database (flexible name matching)
2. **Finds their RSVP** for the specific event
3. **Updates RSVP** with:
   - `paymentStatus: 'completed'`
   - `paymentMethod: 'square'`
   - `paidAt: current timestamp`
4. **Creates payment record** in the payments collection
5. **Shows progress** and summary

## 📊 Expected Output

```
🚀 Payment Status Update Script
================================
📋 Processing 14 users
🎯 Event ID: your-event-id
💰 Payment Amount: $60

Enter your admin email: your-email@example.com
Enter your admin password: ********

🔐 Connecting to Firebase...
✅ Signed in successfully

🔄 Processing users...

👤 Processing: Megan Williams
  ✅ Found user: Megan Williams
  ✅ Updated: Megan Williams

👤 Processing: Eric Bucknam
  ✅ Found user: Eric Bucknam
  ✅ Updated: Eric Bucknam

... (continues for all users)

📊 Summary:
✅ Updated: 12
⚠️  Already paid: 1
❌ Not found: 1
📋 Total: 14

🎉 Complete!
```

## 🛠️ Troubleshooting

### "User not found"
- The script uses flexible name matching
- Check if the user exists in your database
- Verify the spelling matches your Square records

### "No RSVP found"
- User hasn't RSVP'd to the event yet
- Check the event ID is correct
- User might have RSVP'd with a different name

### "Already paid"
- User's payment status is already "completed"
- No action needed for these users

### Firebase connection errors
- Verify your Firebase configuration
- Check your admin credentials
- Ensure you have the right permissions

## 🔒 Security Notes

- The script requires admin credentials
- It only updates payment status, doesn't change other data
- All changes are logged and reversible
- Payment records are created for audit trail

## 📝 Customization

You can modify the script to:
- Change the payment amount
- Add more users to the list
- Update different events
- Change payment method or notes

Just update the constants at the top of the script!



