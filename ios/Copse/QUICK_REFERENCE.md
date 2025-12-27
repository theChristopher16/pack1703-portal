# 🚀 Quick Reference - Copse iOS Development

## For New Team Members

1. **Clone repo**: `git clone https://github.com/theChristopher16/pack1703-portal.git`
2. **Open project**: `cd ios/Copse && open Copse.xcodeproj`
3. **Add Firebase config**: Get `GoogleService-Info.plist` from team lead, add to `Copse/Config/`
4. **Select team**: Xcode → Signing & Capabilities → Select your Team
5. **Build**: `Cmd + B`
6. **Run**: `Cmd + R`

See [TEAM_SETUP.md](TEAM_SETUP.md) for detailed instructions.

## For TestFlight Deployment

1. **Update version**: Xcode → General → Increment Build number
2. **Archive**: Product → Archive (select "Any iOS Device")
3. **Upload**: Organizer → Distribute App → App Store Connect
4. **Add testers**: App Store Connect → TestFlight → Add testers

See [TESTFLIGHT_SETUP.md](TESTFLIGHT_SETUP.md) for complete guide.

## Common Commands

```bash
# Build
Cmd + B

# Run
Cmd + R

# Clean build
Cmd + Shift + K

# Archive (for TestFlight)
Product → Archive
```

## Important Files

- `Copse.xcodeproj` - Xcode project (use this, not .xcworkspace)
- `Copse/Config/GoogleService-Info.plist` - Firebase config (NOT in git)
- `Info.plist` - App configuration
- `Copse/App/CopseApp.swift` - App entry point

## Bundle Identifier

- **Current**: `com.copse.Copse`
- **Must match**: App Store Connect app record

## Version Numbers

- **Version** (Marketing): `1.0` (user-facing)
- **Build**: `1`, `2`, `3`... (increment for each TestFlight build)

## Team ID

- Current: `992Y5HL9UQ`
- Each developer can override in Xcode → Signing & Capabilities


