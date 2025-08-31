# GIPHY API Setup Guide

## Overview
The chat system now includes full GIF search functionality powered by the GIPHY API. This provides access to millions of GIFs with search capabilities, just like modern messaging apps.

## Features
- **Trending GIFs**: Automatically loads popular GIFs when the picker is opened
- **Search Functionality**: Search for any GIF by keyword
- **Scout-Themed Suggestions**: Curated search terms for scout-related content
- **Fallback System**: Graceful degradation when API is not available
- **Modern UI**: iPhone-style GIF picker with loading states

## Getting a GIPHY API Key

### Step 1: Create a GIPHY Account
1. Go to [https://developers.giphy.com/](https://developers.giphy.com/)
2. Click "Get Started" or "Sign Up"
3. Create a free account

### Step 2: Create an App
1. After logging in, click "Create App"
2. Choose "API" as the app type
3. Fill in the required information:
   - **App Name**: "Pack 1703 Portal" (or your preferred name)
   - **App Description**: "Scout pack chat system with GIF integration"
   - **App Website**: Your app's URL (optional)
   - **App Redirect URL**: Leave blank for now

### Step 3: Get Your API Key
1. After creating the app, you'll see your API key
2. Copy the API key (it looks like: `abc123def456ghi789`)

## Configuration

### Option 1: Environment Variable (Recommended)
1. Create a `.env` file in your project root (if it doesn't exist)
2. Add your API key:
   ```
   REACT_APP_GIPHY_API_KEY=your_api_key_here
   ```
3. Restart your development server

### Option 2: Direct Configuration
1. Open `src/services/giphyService.ts`
2. Find the constructor method
3. Replace `'YOUR_GIPHY_API_KEY'` with your actual API key:
   ```typescript
   this.apiKey = 'your_actual_api_key_here';
   ```

## API Limits
- **Free Tier**: 42 requests per hour
- **Pro Tier**: 1,000 requests per hour ($5/month)
- **Premium Tier**: 10,000 requests per hour ($99/month)

For a scout pack, the free tier should be sufficient for normal usage.

## Usage
Once configured, users can:
1. Click the GIF button (😊) in the chat input
2. Browse trending GIFs automatically loaded
3. Click "Search" to search for specific GIFs
4. Click any GIF to insert it into their message

## Scout-Themed Search Terms
The system includes curated search terms for scout-related content:
- scout salute
- camping
- nature
- adventure
- friendship
- outdoor activities
- hiking
- campfire
- wilderness
- teamwork

## Troubleshooting

### API Key Not Working
- Verify the API key is correct
- Check that the environment variable is properly set
- Restart the development server after adding the environment variable

### No GIFs Loading
- Check the browser console for error messages
- Verify your internet connection
- The system will show fallback GIFs if the API is unavailable

### Rate Limiting
- If you hit rate limits, consider upgrading to a paid plan
- The system gracefully handles rate limiting by showing fallback content

## Security Notes
- Never commit your API key to version control
- Use environment variables for production deployments
- The API key is only used client-side for GIF requests

## Production Deployment
For production deployment, set the environment variable in your hosting platform:
- **Firebase**: Add to environment variables in Firebase console
- **Vercel**: Add to environment variables in Vercel dashboard
- **Netlify**: Add to environment variables in Netlify dashboard

## Support
If you need help with the GIPHY API:
- [GIPHY API Documentation](https://developers.giphy.com/docs/api)
- [GIPHY Support](https://support.giphy.com/)
- [API Status](https://status.giphy.com/)
