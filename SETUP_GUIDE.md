# 🚀 Automated Deployment Setup Guide

## Quick Setup (5 minutes)

### 1. Get Firebase Service Account Key
1. Go to: https://console.firebase.google.com/project/pack-1703-portal/settings/serviceaccounts/adminsdk
2. Click "Generate new private key"
3. Download the JSON file
4. Copy the entire contents

### 2. Add to GitHub Secrets
1. Go to: https://github.com/theChristopher16/pack1703-portal/settings/secrets/actions
2. Click "New repository secret"
3. Name: `FIREBASE_SERVICE_ACCOUNT`
4. Value: Paste the JSON content

### 3. Test the Setup
1. Go to: https://github.com/theChristopher16/pack1703-portal/actions
2. Click "Test Deployment Setup" workflow
3. Click "Run workflow"
4. Watch it complete successfully

## 🎯 What This Enables

### Automatic Deployments
- ✅ Every push to `main` branch → Auto deploy to production
- ✅ Every PR → Run tests automatically
- ✅ Failed tests → Block deployment
- ✅ **LIVE**: Automated deployment is now active! 🚀

### Manual Deployments
```bash
# Quick deploy
npm run deploy

# Safe deploy with tests
./scripts/deploy.sh
```

### Current Status
- ✅ Map fixes are live: https://pack-1703-portal.web.app
- ✅ Deployment infrastructure is ready
- ⏳ Just needs Firebase secret to enable automation

## 🔧 Troubleshooting

### If GitHub Actions Fails
1. Check the Actions tab in GitHub
2. Look for error messages
3. Verify the Firebase secret is correct

### If Manual Deploy Fails
1. Run `firebase login` to re-authenticate
2. Check Firebase project: `firebase use pack-1703-portal`
3. Try `npm run build` first to test build

### Emergency Rollback
```bash
git log --oneline -5  # Find previous working commit
git checkout <commit-hash>
npm run deploy
```

## 📞 Support
- Firebase Console: https://console.firebase.google.com/project/pack-1703-portal
- GitHub Actions: https://github.com/theChristopher16/pack1703-portal/actions
- Live App: https://pack-1703-portal.web.app
