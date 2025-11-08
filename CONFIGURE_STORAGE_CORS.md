# Configure Firebase Storage CORS

The gallery download feature requires CORS configuration on Firebase Storage to allow downloads from sfpack1703.com.

## Option 1: Using Google Cloud Console (Easiest - No CLI Needed)

1. **Open Google Cloud Console Storage Browser**:
   👉 https://console.cloud.google.com/storage/browser/pack1703-portal.firebasestorage.app?project=pack1703-portal

2. **Click the three dots menu (⋮)** next to your bucket name

3. **Select "Edit bucket permissions"** or **"Edit CORS configuration"**

4. **Paste this CORS configuration**:
   ```json
   [
     {
       "origin": ["https://sfpack1703.com", "https://pack1703-portal.web.app", "http://localhost:3000"],
       "method": ["GET", "HEAD"],
       "maxAgeSeconds": 3600,
       "responseHeader": ["Content-Type", "Content-Disposition"]
     }
   ]
   ```

5. **Click "Save"**

## Option 2: Using gsutil CLI

If you have Google Cloud SDK installed:

```bash
gsutil cors set storage-cors.json gs://pack1703-portal.firebasestorage.app
```

## Option 3: Install Google Cloud SDK

1. **Install Google Cloud SDK**:
   ```bash
   # macOS
   brew install --cask google-cloud-sdk
   
   # Or download installer from:
   # https://cloud.google.com/sdk/docs/install
   ```

2. **Authenticate**:
   ```bash
   gcloud auth login
   gcloud config set project pack1703-portal
   ```

3. **Apply CORS**:
   ```bash
   gsutil cors set storage-cors.json gs://pack1703-portal.firebasestorage.app
   ```

## Verify CORS Configuration

After configuring, verify it worked:

```bash
gsutil cors get gs://pack1703-portal.firebasestorage.app
```

## What This Fixes

- ✅ Photo downloads work on desktop
- ✅ "Save to Photos" works properly on mobile
- ✅ No more CORS errors in console
- ✅ Canvas-based image conversion works

## Current Workaround (Until CORS is Configured)

Users can still save photos manually:
- **Mobile**: Long-press on photo → "Save Image" or "Add to Photos"
- **Desktop**: Right-click on photo → "Save Image As"

