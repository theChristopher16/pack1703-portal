# Charleston Wrap Fundraising Integration

## Overview

This integration automatically pulls fundraising data from the Charleston Wrap sponsor portal and displays it in a beautiful, modern dashboard within the Pack 1703 app. Data is synchronized automatically every hour and can be manually refreshed by admins.

## Features

### ✨ Automated Data Sync
- **Cloud Function** (`syncCharlestonWrapData`) runs every hour via Cloud Scheduler
- Uses Puppeteer to log into Charleston Wrap portal and extract real-time data
- Stores data in Firestore for instant access

### 📊 Real-Time Dashboard
- **Live Progress Tracking**: Shows current sales, profit, and items sold
- **Goal Visualization**: Dynamic progress bar with percentage complete
- **Time Tracking**: Days remaining with urgency indicators
- **Projections**: Estimated final totals based on current pace
- **Contact Information**: Quick access to sales rep and chairperson details

### 🎯 Smart Features
- **Responsive Design**: Works perfectly on mobile, tablet, and desktop
- **Real-time Updates**: Dashboard automatically updates when data changes
- **Role-Based Access**: Public viewing for all users, manual sync for admins only
- **Urgency Indicators**: Color-coded alerts based on time remaining

## Architecture

### Backend (Cloud Functions)

```
functions/src/charlestonWrapService.ts
├── CharlestonWrapService class
│   ├── scrapeFundraisingData() - Logs in and extracts data
│   └── saveFundraisingData() - Stores in Firestore
├── syncCharlestonWrapData - Scheduled function (runs every hour)
└── manualSyncCharlestonWrap - Manual trigger for admins
```

**Data Flow:**
1. Cloud Scheduler triggers `syncCharlestonWrapData`
2. Puppeteer opens Charleston Wrap portal
3. Logs in with stored credentials
4. Extracts data from dashboard HTML
5. Parses and structures data
6. Saves to Firestore `fundraising/current` document
7. Frontend subscribes to updates in real-time

### Frontend (React Components)

```
src/
├── services/fundraisingService.ts
│   └── FundraisingService class
│       ├── getCurrentFundraising()
│       ├── subscribeFundraising()
│       ├── calculateProgress()
│       └── manualSync()
├── components/Fundraising/
│   └── CharlestonWrapDashboard.tsx
└── pages/FundraisingPage.tsx
```

### Data Structure

```typescript
interface CharlestonWrapData {
  customerNumber: string;
  organizationName: string;
  campaign: string;
  totalRetail: number;
  totalItemsSold: number;
  totalProfit: number;
  daysRemaining: number;
  saleEndDate: string;
  fundraisingGoal: number;
  goalStatement: string;
  salesRep: {
    name: string;
    phone: string;
    email: string;
  };
  chairperson: {
    name: string;
    phone: string;
    email: string;
  };
  lastUpdated: Timestamp;
}
```

## Installation & Setup

### 1. Install Dependencies

```bash
cd functions
npm install puppeteer cheerio
```

### 2. Configure Environment Variables

Set Charleston Wrap credentials in Cloud Functions environment:

```bash
firebase functions:config:set \
  charleston.wrap.username="27150" \
  charleston.wrap.password="sh140n"
```

Or use environment variables:
```bash
export CHARLESTON_WRAP_USERNAME="27150"
export CHARLESTON_WRAP_PASSWORD="sh140n"
```

### 3. Deploy Cloud Functions

```bash
cd functions
npm run build
firebase deploy --only functions:syncCharlestonWrapData,functions:manualSyncCharlestonWrap
```

### 4. Set Up Cloud Scheduler

The `syncCharlestonWrapData` function uses Cloud Scheduler. It will be automatically deployed with the function.

**Schedule:** Every 1 hour

To modify the schedule, edit `functions/src/charlestonWrapService.ts`:
```typescript
export const syncCharlestonWrapData = functions.pubsub
  .schedule('every 1 hours') // Change this
  .onRun(async (context) => { ... });
```

### 5. Firestore Security Rules

Add these rules to `firestore.rules`:

```javascript
// Allow all authenticated users to read fundraising data
match /fundraising/{document=**} {
  allow read: if request.auth != null;
  allow write: if false; // Only Cloud Functions can write
}
```

## Usage

### For Users (All Roles)

1. Navigate to **Campaign** in the main navigation
2. View real-time fundraising progress
3. See sales stats, goal progress, and contact information
4. Dashboard automatically updates when new data is available

### For Admins

1. Navigate to the Campaign page
2. Click **"Sync Now"** button to manually refresh data
3. Data will update immediately after successful sync
4. Last updated timestamp shows when data was last refreshed

### Manual Data Sync

Admins can trigger a manual sync via the Cloud Function:

```typescript
// From frontend (admin only)
const result = await FundraisingService.manualSync();
console.log(result); // { success: true, data: {...}, message: "..." }
```

## Dashboard Components

### Main Stats Cards
- **Total Sales**: Current retail value of all sales
- **Total Profit**: Amount earned toward fundraising goal
- **Items Sold**: Number of products sold
- **Days Remaining**: Countdown to campaign end (color-coded by urgency)

### Goal Progress Section
- **Progress Bar**: Visual representation of goal completion
- **Percentage**: Current progress toward goal
- **Amount Remaining**: How much more needed to reach goal
- **Time Elapsed**: Percentage of campaign time completed
- **Projected Total**: Estimated final amount based on current pace
- **Goal Statement**: Pack's fundraising message

### Contact Cards
- **Sales Representative**: Name, phone, email
- **Campaign Chairperson**: Name, phone, email

## Customization

### Change Sync Frequency

Edit `functions/src/charlestonWrapService.ts`:

```typescript
// Every hour (default)
.schedule('every 1 hours')

// Every 30 minutes
.schedule('every 30 minutes')

// Every day at 9 AM
.schedule('0 9 * * *')

// Every weekday at 9 AM and 5 PM
.schedule('0 9,17 * * 1-5')
```

### Modify Dashboard Colors

Edit `src/components/Fundraising/CharlestonWrapDashboard.tsx`:

```typescript
// StatCard color scheme
const colorClasses = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  purple: 'bg-purple-50 text-purple-600',
  red: 'bg-red-50 text-red-600',
  orange: 'bg-orange-50 text-orange-600',
};
```

### Change Urgency Thresholds

Edit `src/services/fundraisingService.ts`:

```typescript
static getUrgencyLevel(daysRemaining: number): 'low' | 'medium' | 'high' | 'critical' {
  if (daysRemaining <= 3) return 'critical';
  if (daysRemaining <= 7) return 'high';
  if (daysRemaining <= 14) return 'medium';
  return 'low';
}
```

## Monitoring & Debugging

### View Cloud Function Logs

```bash
# View all logs
firebase functions:log

# View specific function logs
firebase functions:log --only syncCharlestonWrapData

# Follow logs in real-time
firebase functions:log --only syncCharlestonWrapData --follow
```

### Test Manual Sync

From browser console (must be logged in as admin):

```javascript
const { getFunctions, httpsCallable } = await import('firebase/functions');
const functions = getFunctions();
const sync = httpsCallable(functions, 'manualSyncCharlestonWrap');
const result = await sync();
console.log(result.data);
```

### Check Firestore Data

```javascript
// In browser console
import { getFirestore, doc, getDoc } from 'firebase/firestore';
const db = getFirestore();
const fundraisingDoc = await getDoc(doc(db, 'fundraising', 'current'));
console.log(fundraisingDoc.data());
```

## Troubleshooting

### No Data Showing

**Problem**: Dashboard shows "No Active Fundraiser"

**Solutions**:
1. Check if Cloud Function has run: `firebase functions:log`
2. Manually trigger sync as admin
3. Verify Firestore document exists: `fundraising/current`
4. Check Charleston Wrap credentials are correct

### Data Not Updating

**Problem**: Dashboard shows old data

**Solutions**:
1. Check Cloud Scheduler is enabled in GCP Console
2. Verify function isn't failing: Check logs
3. Try manual sync to test function
4. Check if Charleston Wrap portal structure changed

### Puppeteer Errors

**Problem**: Scraper fails to log in

**Solutions**:
1. Verify credentials are correct
2. Check if Charleston Wrap portal HTML changed
3. Try running function locally for debugging
4. Check GCP Cloud Functions memory allocation (may need increase)

### Permission Errors

**Problem**: "Permission denied" when syncing

**Solutions**:
1. Verify user has admin role
2. Check Firestore security rules
3. Ensure Cloud Function has proper IAM permissions

## Performance Considerations

### Cloud Functions
- **Memory**: 512MB (default) - May need 1GB for Puppeteer
- **Timeout**: 60 seconds (default) - Usually completes in 10-15s
- **Concurrent Executions**: Limited to 1 by schedule (no conflicts)

### Optimization Tips
1. Consider caching static content (sales rep info rarely changes)
2. Use incremental updates if API becomes available
3. Implement exponential backoff on failures
4. Add retry logic for transient errors

## Future Enhancements

### Potential Improvements
- [ ] Participant leaderboard (if data available)
- [ ] Historical data tracking and charts
- [ ] Email notifications for milestones
- [ ] Push notifications for goal achievement
- [ ] Export functionality for reports
- [ ] Integration with other fundraising platforms
- [ ] Automated thank-you messages for top sellers
- [ ] Daily digest emails for chairperson

### API Integration
If Charleston Wrap provides an API in the future:
1. Replace Puppeteer scraping with API calls
2. Reduce function complexity and execution time
3. More reliable data updates
4. Access to additional data (individual sales, etc.)

## Security Notes

### Credentials Storage
- **Current**: Environment variables in Cloud Functions
- **Recommended**: Google Secret Manager for production

```typescript
// Using Secret Manager
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const client = new SecretManagerServiceClient();
const [version] = await client.accessSecretVersion({
  name: 'projects/PROJECT_ID/secrets/charleston-wrap-password/versions/latest',
});
const password = version.payload.data.toString();
```

### Data Privacy
- Fundraising data is public within pack
- Personal seller data (if added) should be protected
- Consider COPPA compliance for youth data
- Implement data retention policies

## Support

For issues or questions:
1. Check Cloud Function logs first
2. Review Firestore data structure
3. Test manual sync to isolate issues
4. Check Charleston Wrap portal for changes
5. Contact Christopher Smith (pack developer)

---

**Last Updated**: November 3, 2025
**Version**: 1.0.0
**Maintained By**: Pack 1703 Development Team

