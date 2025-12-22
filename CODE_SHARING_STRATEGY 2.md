# Code Sharing Strategy: Web App ↔ iOS App

## Current Architecture

### Web App
- **Stack**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui + lucide-react
- **Backend**: Firebase (Firestore, Auth, Cloud Functions)
- **Services**: 50+ TypeScript service files in `src/services/`

### iOS App
- **Stack**: Swift + SwiftUI
- **UI**: Native SwiftUI components
- **Backend**: Firebase (Firestore, Auth, Cloud Functions)
- **Services**: Swift service layer (currently minimal)

## Code Sharing Options

### Option 1: React Native (Maximum Code Sharing) ⭐ Recommended for Long-term

**What it is**: Rewrite iOS app in React Native to share ~80-90% of code with web app.

**Pros**:
- ✅ **Single codebase** for business logic, services, and most UI
- ✅ **Automatic sync**: Changes in web app immediately work in iOS
- ✅ **Shared TypeScript types** and service layer
- ✅ **Faster development**: Write once, deploy to both platforms
- ✅ **Consistent UX** across platforms
- ✅ **Your existing services** (`src/services/*.ts`) can be reused directly

**Cons**:
- ❌ **Initial migration cost**: Need to rewrite iOS app in React Native
- ❌ **Native features**: Some iOS-specific features require native modules
- ❌ **Performance**: Slightly less performant than pure native (but usually negligible)
- ❌ **Learning curve**: Team needs React Native knowledge

**Implementation**:
```typescript
// Shared service (works in both web and React Native)
// src/services/eventService.ts
export class EventService {
  async fetchEvents(orgId: string) {
    // Same code works in web and React Native
  }
}

// React Native component (similar to web)
// ios/Copse/Components/EventList.tsx
import { EventService } from '../../src/services/eventService';
```

**Migration Path**:
1. Set up React Native project alongside web app
2. Share `src/services/` directory
3. Gradually migrate iOS screens to React Native
4. Use React Native's native modules for iOS-specific features

---

### Option 2: Capacitor/Ionic (Wrap Web App) 

**What it is**: Wrap your existing React web app in a native container.

**Pros**:
- ✅ **Zero iOS rewrite**: Your web app becomes the iOS app
- ✅ **100% code sharing**: Exact same codebase
- ✅ **Fast to deploy**: Can ship iOS app immediately
- ✅ **Native plugins**: Access to device features (camera, calendar, etc.)

**Cons**:
- ❌ **WebView performance**: Not as smooth as native
- ❌ **Limited native feel**: Still feels like a web app
- ❌ **App Store review**: May face stricter review for web-based apps
- ❌ **iOS design patterns**: Can't fully match iOS HIG

**Implementation**:
```bash
# Install Capacitor
npm install @capacitor/core @capacitor/cli
npm install @capacitor/ios

# Build web app
npm run build

# Sync to iOS
npx cap sync ios
```

---

### Option 3: Shared Business Logic Layer (Hybrid Approach) ⭐ Best for Current Situation

**What it is**: Keep separate UI codebases, but share business logic and data models.

**Pros**:
- ✅ **Native UI**: Best user experience on each platform
- ✅ **Shared logic**: Business rules, validation, data transformations
- ✅ **Incremental**: Can implement gradually
- ✅ **Platform-specific**: Optimize each platform independently

**Cons**:
- ❌ **Some duplication**: UI code still needs to be written twice
- ❌ **Manual sync**: Need to keep business logic in sync
- ❌ **More maintenance**: Two codebases to maintain

**Implementation Strategy**:

#### A. Shared Type Definitions
```typescript
// shared/types/Event.ts (TypeScript)
export interface Event {
  id: string;
  title: string;
  date: Date;
  // ...
}
```

```swift
// ios/Copse/Models/Event.swift (Swift)
// Generated from TypeScript or manually synced
struct Event: Codable {
    let id: String
    let title: String
    let date: Date
    // ...
}
```

#### B. Shared Business Logic via Cloud Functions
```typescript
// functions/src/eventLogic.ts
export const validateEvent = (event: Event): ValidationResult => {
  // Business logic shared via Cloud Functions
  // Both web and iOS call this
}
```

#### C. Shared Data Models via Firestore
- Both platforms read/write to same Firestore collections
- Business rules enforced in Firestore Security Rules
- Data validation happens server-side

---

### Option 4: Keep Separate (Current Approach)

**What it is**: Maintain completely separate codebases.

**Pros**:
- ✅ **Platform-optimized**: Best native experience
- ✅ **No migration cost**: Continue as-is
- ✅ **Independent evolution**: Each platform can evolve separately

**Cons**:
- ❌ **Full duplication**: All code written twice
- ❌ **Manual sync**: Every feature needs to be implemented twice
- ❌ **Inconsistency risk**: Features may diverge between platforms
- ❌ **Higher maintenance**: 2x the code to maintain

---

## Recommended Approach: Hybrid (Option 3) → React Native (Option 1)

### Phase 1: Immediate (Hybrid Approach)
**Goal**: Share business logic while keeping native UIs

1. **Extract shared business logic to Cloud Functions**
   ```typescript
   // functions/src/shared/
   - eventValidation.ts
   - rsvpLogic.ts
   - calendarAggregation.ts
   ```

2. **Share TypeScript types** (generate Swift from TypeScript)
   ```bash
   # Use tool like quicktype.io or manual sync
   npx quicktype src/types/Event.ts -o ios/Copse/Models/Event.swift
   ```

3. **Document shared APIs**
   - Create API contracts for Cloud Functions
   - Both platforms call same functions
   - Business logic centralized

### Phase 2: Long-term (React Native)
**Goal**: Single codebase for maximum efficiency

1. **Set up React Native project**
   ```bash
   npx react-native init CopseMobile
   ```

2. **Share service layer**
   ```typescript
   // Move src/services/ to shared/services/
   // Use in both web and React Native
   ```

3. **Gradual migration**
   - Start with simple screens (Login, Settings)
   - Migrate complex screens (Calendar, Events)
   - Keep native modules for iOS-specific features

---

## What Can Be Shared Right Now?

### ✅ Already Shared
- **Firebase Backend**: Firestore, Auth, Cloud Functions
- **Data Models**: Same Firestore collections
- **Business Rules**: Firestore Security Rules

### ✅ Can Share Immediately
1. **Type Definitions** (via code generation)
   ```bash
   # Generate Swift from TypeScript
   npx quicktype src/types/*.ts -o ios/Copse/Models/
   ```

2. **Business Logic** (via Cloud Functions)
   ```typescript
   // functions/src/shared/eventValidation.ts
   export const validateRSVP = (rsvp: RSVP) => {
     // Shared validation logic
   }
   ```

3. **API Contracts** (documented interfaces)
   ```typescript
   // shared/api/events.ts
   export interface FetchEventsRequest {
     organizationId: string;
     startDate: Date;
     endDate: Date;
   }
   ```

### ❌ Cannot Share (Platform-Specific)
- UI Components (React vs SwiftUI)
- Navigation (React Router vs SwiftUI Navigation)
- Platform-specific features (PWA vs App Store)

---

## Implementation Plan

### Step 1: Extract Shared Logic (Week 1-2)
```typescript
// Create shared business logic in Cloud Functions
functions/src/shared/
├── eventValidation.ts
├── rsvpLogic.ts
├── calendarAggregation.ts
└── notificationRules.ts
```

### Step 2: Type Sharing (Week 2-3)
```bash
# Set up type generation pipeline
npm install --save-dev quicktype
# Add to package.json scripts
"generate:types": "quicktype src/types -o ios/Copse/Models"
```

### Step 3: API Standardization (Week 3-4)
```typescript
// Document all Cloud Functions with TypeScript interfaces
// Both platforms use same function signatures
```

### Step 4: Evaluate React Native (Month 2-3)
- Assess if React Native migration makes sense
- Start with one screen as proof of concept
- Measure development velocity improvement

---

## Cost-Benefit Analysis

| Approach | Initial Cost | Ongoing Cost | Code Sharing | Native Feel |
|----------|-------------|--------------|--------------|-------------|
| **React Native** | High (rewrite) | Low (single codebase) | 80-90% | Good |
| **Capacitor** | Low (wrap) | Low | 100% | Fair |
| **Hybrid** | Medium (extract) | Medium (sync) | 40-60% | Excellent |
| **Separate** | Low (current) | High (duplicate) | 0% | Excellent |

---

## Recommendation

**Short-term (Next 3 months)**: Implement **Hybrid Approach (Option 3)**
- Extract business logic to Cloud Functions
- Share type definitions via code generation
- Keep native UIs for best UX

**Long-term (6-12 months)**: Consider **React Native (Option 1)**
- If you find yourself duplicating too much code
- If you want faster feature development
- If team is comfortable with React Native

**Current Priority**: Start with extracting shared business logic to Cloud Functions. This gives you immediate code sharing benefits without requiring a full rewrite.

