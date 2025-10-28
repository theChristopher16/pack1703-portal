# Google Sheets Sync Setup

This guide explains how to set up the Google Sheets integration for syncing inventory data from your Google Sheet to the Pack 1703 Portal.

## Overview

The inventory sync feature allows you to:
- Automatically import inventory items from your Google Sheet
- Keep the inventory up-to-date with a single click
- Update existing items when data changes in the sheet

## Prerequisites

1. A Google Sheet with inventory data (already created at [your spreadsheet](https://docs.google.com/spreadsheets/d/1XD0YFbaecFUPG-8UuQcTi4p8AMK6oxiAgLtf0D133m4/edit))
2. Google Cloud Platform account
3. Access to Firebase Project settings

## Setup Instructions

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google Sheets API:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Sheets API"
   - Click "Enable"

### Step 2: Create an API Key

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the generated API key
4. (Optional) Click "Restrict Key" to limit its usage to the Google Sheets API

### Step 3: Make Your Google Sheet Public (Required)

For the sync to work, your Google Sheet must be publicly readable:

1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1XD0YFbaecFUPG-8UuQcTi4p8AMK6oxiAgLtf0D133m4/edit
2. Click "Share" button (top right)
3. Click "Get link" and change to "Anyone with the link" > "Viewer"
4. Click "Done"

**Note**: Only the data will be readable - not editable. This is safe for inventory tracking.

### Step 4: Add API Key to Your Project

#### For Development (.env.local)

Create a file named `.env.local` in your project root:

```
REACT_APP_GOOGLE_SHEETS_API_KEY=your_api_key_here
```

#### For Production (Firebase Hosting)

1. Go to Firebase Console > Project Settings > Config
2. Add the environment variable to your hosting configuration
3. Or add it to your build environment

## How It Works

### Data Mapping

The sync service maps Google Sheet columns to inventory fields:

| Google Sheet Column | Inventory Field |
|---------------------|----------------|
| Last Checked | lastChecked (date) |
| Item Name | name |
| Qty | quantity |
| Condition | condition (mapped) |
| Description / Notes | description & notes |
| Est | estimatedValue (converted to cents) |

### Condition Mapping

- "Excellent" → excellent
- "Good" → good
- "Fair" → fair
- "Poor" or "Needs Replacement" → poor
- "Replace" or "Repair" → needs_repair

### Date Parsing

Supports dates in M/D/YYYY format (e.g., 1/26/2025)

## Using the Sync Feature

1. **Navigate to Inventory**: Go to Resources > Pack Inventory (or `/resources/inventory`)
2. **Click "Sync from Google Sheet"**: The button is located next to "Add Item"
3. **Confirm the sync**: A confirmation dialog will appear
4. **Wait for completion**: The sync processes all rows from your sheet
5. **Review results**: You'll see a notification with sync results

## What Happens During Sync

- **New items**: Items in the sheet but not in the database are created
- **Existing items**: Items with matching names are updated with the latest data
- **Duplicate names**: Items are matched by name (case-insensitive)
- **Errors**: Any rows with invalid data are skipped and reported

## Troubleshooting

### "Google Sheets API key is invalid or missing"

- Check that your `.env.local` file exists and contains the correct API key
- Restart your development server after adding the environment variable
- Verify the API key is correct in Google Cloud Console

### "Failed to fetch Google Sheet"

- Ensure your Google Sheet is set to "Anyone with the link can view"
- Check that the spreadsheet ID in the code matches your sheet
- Verify the sheet name is "Inventory" (or update the RANGE constant)

### "No data found in Google Sheet"

- Check that your sheet has data in rows 2-100
- Ensure column headers are in row 1
- Verify the sheet tab name matches (currently "Inventory")

## Security Notes

- **API Key**: The API key is only used for read-only access to public sheets
- **No write access**: The sync never modifies your Google Sheet
- **Public access**: Make your sheet public with "Viewer" permission only
- **Environment variables**: Never commit API keys to version control

## Customization

To change which Google Sheet is synced, edit `src/services/googleSheetsSyncService.ts`:

```typescript
const SPREADSHEET_ID = 'your_spreadsheet_id_here';
const RANGE = 'YourSheetName!A2:F100';
```

## Support

For issues or questions, contact the development team or refer to the project documentation.

