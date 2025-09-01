# Deployment Checklist

## Pre-Deployment Checks ✅

### Code Quality
- [ ] All tests pass (`npm test`)
- [ ] No linting errors (`npm run lint` if available)
- [ ] Code is properly formatted
- [ ] All changes are committed to git

### Build Verification
- [ ] Project builds successfully (`npm run build`)
- [ ] Build directory is created
- [ ] No build warnings or errors

### Firebase Configuration
- [ ] Firebase project is properly configured
- [ ] Service account has correct permissions
- [ ] Environment variables are set (if needed)

## Deployment Options

### Option 1: Quick Deploy (Current)
```bash
npm run deploy
```

### Option 2: Full Deploy with Tests
```bash
./scripts/deploy.sh
```

### Option 3: Manual Deploy
```bash
npm run build
firebase deploy --only hosting
```

### Option 4: Deploy Everything
```bash
npm run deploy:all
```

## Post-Deployment Verification

### Health Checks
- [ ] App loads at https://pack-1703-portal.web.app
- [ ] All pages are accessible
- [ ] No console errors
- [ ] Map functionality works correctly
- [ ] All features are working as expected

### Performance
- [ ] Page load times are acceptable
- [ ] No 404 errors for assets
- [ ] Images and icons load correctly

## Rollback Plan

If deployment fails:
1. Check Firebase console for errors
2. Revert to previous commit if needed
3. Re-deploy previous working version

```bash
git log --oneline -5  # Find previous working commit
git checkout <commit-hash>
npm run deploy
```

## Emergency Contacts
- Firebase Console: https://console.firebase.google.com/project/pack-1703-portal
- GitHub Repository: [Your repo URL]
