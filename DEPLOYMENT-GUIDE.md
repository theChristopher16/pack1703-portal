# Configuration System Deployment Guide

This guide will walk you through deploying the configuration management system to production.

## 🚀 Quick Deployment

### Option 1: Automated Deployment (Recommended)

1. **Run the deployment script**:
   ```bash
   ./scripts/deploy-config-system.sh
   ```

2. **Follow the verification steps** shown in the script output

### Option 2: Manual Deployment

If you prefer to deploy manually, follow these steps:

## 📋 Pre-Deployment Checklist

- [ ] Firebase CLI is installed (`npm install -g firebase-tools`)
- [ ] You're logged into Firebase (`firebase login`)
- [ ] You have the correct Firebase project selected
- [ ] Your code is committed and ready for deployment

## 🔧 Step-by-Step Deployment

### Step 1: Build the Application

```bash
npm run build
```

### Step 2: Deploy to Firebase

```bash
# Deploy everything
firebase deploy

# Or deploy specific services
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### Step 3: Initialize Configurations

After deployment, you need to initialize the default configurations. You have three options:

#### Option A: Use the Admin Portal (Easiest)

1. Visit your production site: `https://pack-1703-portal.web.app`
2. Go to the admin portal: `/admin`
3. Click on the "Configuration" tab
4. Click "Initialize Defaults" button

#### Option B: Run the Initialization Script

1. Update the Firebase config in `scripts/init-configs.js` with your actual config
2. Run the script:
   ```bash
   node scripts/init-configs.js
   ```

#### Option C: Manual Firestore Setup

1. Open Firebase Console
2. Go to Firestore Database
3. Create a collection called `configurations`
4. Add documents with the default configuration values

## ✅ Verification Steps

After deployment, verify everything is working:

### 1. Check the Admin Portal

1. Visit: `https://pack-1703-portal.web.app/admin`
2. Log in with admin credentials
3. Click the "Configuration" tab
4. Verify you can see the configuration interface

### 2. Test Configuration Management

1. Click "Initialize Defaults" if configurations aren't present
2. Try editing a configuration value (e.g., change the primary email)
3. Save the changes
4. Verify the changes are reflected in the UI

### 3. Test the Public Site

1. Visit the main site: `https://pack-1703-portal.web.app`
2. Verify the pack name and other configurable values are displayed correctly
3. Check that the configuration changes from the admin portal are reflected

### 4. Test Configuration Hooks

1. Open browser developer tools
2. Check the console for any configuration-related errors
3. Verify that configuration values are being loaded correctly

## 🔍 Troubleshooting

### Common Issues

#### "Configuration not found" errors
- Check if configurations were initialized properly
- Verify the configuration keys match what the code expects
- Check Firestore permissions

#### Admin portal not loading
- Verify Firebase hosting deployment was successful
- Check browser console for JavaScript errors
- Ensure admin authentication is working

#### Configuration changes not reflecting
- Check if the configuration cache needs to be cleared
- Verify the configuration service is working
- Check for network connectivity issues

### Debug Commands

```bash
# Check Firebase project
firebase projects:list

# Check deployment status
firebase hosting:sites:list

# View Firestore data
firebase firestore:indexes:list

# Clear configuration cache (in browser console)
configService.clearCache()
```

## 📊 Monitoring

After deployment, monitor these areas:

1. **Performance**: Check if configuration loading affects page load times
2. **Errors**: Monitor for any configuration-related errors in logs
3. **Usage**: Track how often configurations are being accessed
4. **Admin Activity**: Monitor configuration changes in the admin portal

## 🔄 Rollback Plan

If issues arise, you can rollback:

1. **Revert code changes** and redeploy
2. **Disable configuration features** by commenting out the hooks
3. **Use hardcoded fallbacks** temporarily

## 📞 Support

If you encounter issues:

1. Check the browser console for errors
2. Review Firebase Console logs
3. Verify Firestore permissions
4. Test in a staging environment first

## 🎉 Success Criteria

The deployment is successful when:

- [ ] Admin portal loads without errors
- [ ] Configuration tab is accessible
- [ ] Default configurations can be initialized
- [ ] Configuration values can be edited and saved
- [ ] Public site displays configurable values correctly
- [ ] No console errors related to configuration system
- [ ] Performance is acceptable

---

**Remember**: Always test in a staging environment first before deploying to production!
