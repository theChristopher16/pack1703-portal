# 🔧 Fixing dSYM Upload Warnings

## What Are These Warnings?

When archiving for TestFlight, you may see warnings like:
```
Upload Symbols Failed
The archive did not include a dSYM for the FirebaseAnalytics.framework...
```

These warnings are **common and non-blocking** when using Swift Package Manager (SPM). Your app will still:
- ✅ Upload to App Store Connect successfully
- ✅ Work in TestFlight
- ✅ Be installable by testers

**However**: Crash reports may not be fully symbolicated (less readable stack traces).

## Why This Happens

Swift Package Manager dependencies don't always include their dSYM files in the archive automatically. This is a known limitation of SPM.

## Solutions

### Option 1: Ignore the Warnings (Recommended for Now)

These warnings don't prevent TestFlight deployment. You can safely ignore them for now. The app will work fine.

**Pros**: No configuration needed
**Cons**: Crash reports may be less readable

### Option 2: Add Build Script (Advanced)

If you want to fix the warnings, you can add a build script to copy dSYMs:

1. In Xcode, select **Copse** project → **Copse** target
2. Go to **Build Phases** tab
3. Click **"+"** → **New Run Script Phase**
4. Drag it to **after** "Embed Frameworks" phase
5. Name it: "Copy SPM dSYMs"
6. Add this script:

```bash
# Copy dSYMs from SPM packages
if [ "${CONFIGURATION}" == "Release" ] && [ -n "${DWARF_DSYM_FOLDER_PATH}" ]; then
    "${PROJECT_DIR}/scripts/copy-spm-dsyms.sh"
fi
```

7. Uncheck **"Show environment variables in build log"** (optional, for cleaner logs)

### Option 3: Use CocoaPods Instead (Not Recommended)

You could switch from SPM to CocoaPods, which handles dSYMs better, but this would require significant project restructuring.

## Current Status

- ✅ App archives successfully
- ✅ App uploads to App Store Connect
- ✅ App works in TestFlight
- ⚠️ dSYM warnings appear (non-blocking)

## Recommendation

**For now**: Ignore the warnings and proceed with TestFlight. They don't affect functionality.

**Later**: If you need better crash reporting, implement Option 2 above.

## Additional Notes

- Firebase Crashlytics will still work, but may have less detailed stack traces
- These warnings only affect third-party frameworks (Firebase, Google, etc.)
- Your app's own code will still be fully symbolicated

## References

- [Apple: Debugging with dSYM files](https://developer.apple.com/documentation/xcode/building-your-app-to-include-debugging-information)
- [Firebase: Symbolicating Crash Reports](https://firebase.google.com/docs/crashlytics/get-deobfuscated-reports)


