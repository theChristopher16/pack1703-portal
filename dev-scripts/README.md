# Development Scripts

⚠️ **WARNING: DO NOT USE THESE SCRIPTS IN PRODUCTION** ⚠️

This directory contains scripts for populating the database with **fake/sample data** for development and testing purposes only.

## Scripts

### `import-seed-data.js`
Imports sample events, locations, announcements, packing lists, and volunteer needs from `seed-data.json`.

**What it creates:**
- Sample seasons
- Sample locations (Camp Wokanda, St. Mark's Church, Peoria Riverfront)
- Sample events (Fall Campout, Den Meetings, Community Service)
- Sample packing lists
- Sample announcements
- Sample volunteer needs

**Usage:**
```bash
node dev-scripts/import-seed-data.js
```

### `seed-analytics-data.js`
Generates fake analytics data for the last 30 days including page views, feature usage, and session events.

**What it creates:**
- Fake page view records
- Fake feature usage records
- Fake session data

**Usage:**
```bash
node dev-scripts/seed-analytics-data.js
```

### `populate-volunteer-data.js`
Creates sample volunteer needs and signup records.

**What it creates:**
- Fake volunteer needs for events
- Sample volunteer signup records

**Usage:**
```bash
node dev-scripts/populate-volunteer-data.js
```

### `clear-seeded-data.js`
**IMPORTANT:** Use this script to remove all seeded/fake data before going to production.

**What it removes:**
- All seeded events, locations, announcements, lists, volunteer needs
- All fake analytics data
- Leaves real user data intact

**Usage:**
```bash
node dev-scripts/clear-seeded-data.js
```

## Production Deployment

Before deploying to production, you **MUST**:

1. ✅ Run `clear-seeded-data.js` to remove all fake data
2. ✅ Verify the portal services no longer inject fake data (already done in production-ready services)
3. ✅ Use the portal UI to create real events, announcements, and volunteer needs
4. ✅ Never run any of the seed scripts in production

## Why Separate These Scripts?

The portal is designed to work with **live data only**. These seed scripts were used during development to test features, but they should never be used in a production environment where real pack families rely on accurate information.

All production data should be created through:
- The admin event creation form
- The announcement creation interface
- The volunteer needs management system
- Real user interactions generating real analytics

## Service Changes for Production

The following services have been updated to **remove fake data fallbacks**:

- ✅ `costManagementService.ts` - No longer returns sample API usage statistics
- ✅ `googleCloudBillingService.ts` - No longer returns mock billing data
- ✅ `systemMonitorService.ts` - Returns zero values instead of fake metrics when no data exists

These changes ensure that when you see data in the admin dashboard, it reflects **real usage** from your pack members.




