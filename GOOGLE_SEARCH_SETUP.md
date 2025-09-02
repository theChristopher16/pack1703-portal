# Google Custom Search API Setup Guide

## Overview
The AI service now uses Google Custom Search API for more reliable and comprehensive web search results. This provides better location information, medical services, and event details.

## Setup Steps

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing project
3. Enable the Custom Search API:
   - Go to "APIs & Services" > "Library"
   - Search for "Custom Search API"
   - Click "Enable"

### 2. Create API Key
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the API key (you'll need this for the Cloud Function)

### 3. Create Custom Search Engine
1. Go to [Google Programmable Search Engine](https://programmablesearchengine.google.com/)
2. Click "Create a search engine"
3. Enter any website (e.g., `google.com`) - this will be expanded to search the entire web
4. Click "Create"
5. Go to "Setup" > "Search the entire web"
6. Enable "Search the entire web"
7. Copy the Search Engine ID (cx) - you'll need this for the Cloud Function

### 4. Configure Cloud Function Environment Variables
1. Go to Firebase Console > Functions
2. Click on your project
3. Go to "Environment variables" tab
4. Add these environment variables:
   ```
   GOOGLE_API_KEY=your_api_key_here
   GOOGLE_CSE_ID=your_search_engine_id_here
   ```

### 5. Deploy Cloud Functions
```bash
cd functions
npm run deploy
```

## Benefits of Google Custom Search API

### ✅ Better Results
- More comprehensive search results
- Better relevance ranking
- Access to Google's vast index

### ✅ Reliable Performance
- Higher success rate than DuckDuckGo
- Better handling of complex queries
- More consistent response times

### ✅ Rich Data
- Detailed snippets
- Accurate URLs
- Better source attribution

### ✅ Fallback Support
- If Google API is not configured, falls back to DuckDuckGo
- No interruption in service during setup

## Usage Limits
- Google Custom Search API: 100 free queries per day
- Additional queries: $5 per 1000 queries
- For most Scout pack usage, the free tier should be sufficient

## Testing
After setup, test the web search by creating an event:
1. Go to Admin AI page
2. Try: "create an event for double lake recreation area north of houston for October 15-18"
3. Check that location and medical services are found

## Troubleshooting
- If no results are found, check that both environment variables are set
- Verify the API key has Custom Search API enabled
- Check that the Search Engine ID is correct
- Monitor Cloud Function logs for any errors

## Cost Optimization
- The AI service caches search results in the database
- Repeated searches for the same location use cached data
- Medical services are saved with events for future reference
