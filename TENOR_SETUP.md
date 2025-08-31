# Tenor API Setup Guide

Tenor is Google's GIF platform and has a much simpler signup process than GIPHY. Here's how to set it up:

## 1. Get a Tenor API Key

### Option A: Google Cloud Console (Recommended)
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Tenor API:
   - Go to "APIs & Services" > "Library"
   - Search for "Tenor API"
   - Click "Enable"
4. Create credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy your API key

### Option B: Direct Tenor Access
1. Go to [Tenor Developer Portal](https://tenor.com/developer/dashboard)
2. Sign in with your Google account
3. Create a new app
4. Get your API key

## 2. Configure Your App

### Environment Variable (Recommended)
Add to your `.env` file:
```
REACT_APP_TENOR_API_KEY=your_api_key_here
```

### Direct Configuration
If you prefer to set it directly in the code, update `src/services/tenorService.ts`:
```typescript
this.apiKey = 'your_api_key_here';
```

## 3. API Limits & Usage

- **Free Tier**: 1000 requests per day
- **Paid Tier**: $0.50 per 1000 requests
- **Rate Limits**: 100 requests per minute

## 4. Scout-Themed Search Terms

The app automatically searches for these scout-related terms:
- scout
- camping
- nature
- outdoors
- adventure
- hiking

## 5. Testing

1. Start your development server: `npm start`
2. Go to the chat page
3. Click the GIF button
4. You should see trending GIFs or scout-themed GIFs

## 6. Troubleshooting

### "Using fallback GIFs" message
- Check your API key is correct
- Verify the Tenor API is enabled in Google Cloud Console
- Check your daily quota hasn't been exceeded

### No GIFs loading
- Check browser console for errors
- Verify network connectivity
- Try refreshing the page

## 7. Production Deployment

When deploying to production:
1. Set the environment variable in your hosting platform
2. For Firebase: Add to your environment configuration
3. The API key will be automatically included in the build

## 8. Security Notes

- Never commit your API key to version control
- Use environment variables for production
- The API key is safe to expose in client-side code (it's designed for this)

## 9. API Documentation

- [Tenor API Documentation](https://tenor.com/developer/api-documentation)
- [Google Cloud Console](https://console.cloud.google.com/)

## 10. Migration from GIPHY

If you were previously using GIPHY:
1. The interface remains the same
2. All existing GIF functionality will work
3. Search and trending features are preserved
4. No user-facing changes

---

**Note**: Tenor is owned by Google and integrates well with Google Cloud services. The signup process is much simpler than GIPHY and doesn't require business verification for basic usage.
