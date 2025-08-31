# Cycling Scout Icons

The Pack 1703 Families Portal now features animated cycling scout icons that replace the static star icons for important locations and features. These icons cycle through scout-appropriate emojis with a bouncing animation effect.

## Features

- **Scout-themed icons**: Uses emojis like 🏕️ (camping), 🔥 (campfire), 🌲 (nature), 🏆 (achievement), ⭐ (star), 🎖️ (badge), 🏅 (medal), 🎯 (target), 🗺️ (map), 🔦 (flashlight)
- **Smooth animations**: Icons bounce to the side before changing, creating a playful effect
- **Database-driven**: Icon list is configurable through the admin interface
- **Consistent timing**: All users see the same icon at the same time
- **Accessible**: Includes proper ARIA labels for screen readers

## Usage

The `CyclingScoutIcon` component is used throughout the application:

```tsx
import CyclingScoutIcon from '../ui/CyclingScoutIcon';

// Basic usage
<CyclingScoutIcon />

// With custom size and interval
<CyclingScoutIcon size={24} interval={2000} />

// With custom styling
<CyclingScoutIcon className="text-primary-500" />
```

## Configuration

The cycling scout icons are managed through the admin configuration system:

1. **Database Key**: `display.cycling_scout_icons`
2. **Type**: Array of strings (emojis)
3. **Default Icons**: `['🏕️', '🔥', '🌲', '🏆', '⭐', '🎖️', '🏅', '🎯', '🗺️', '🔦']`
4. **Validation**: Minimum 1 icon, maximum 20 icons

### Admin Management

1. Navigate to the Admin Dashboard
2. Go to Configuration Manager
3. Find "display.cycling_scout_icons"
4. Edit the array to add/remove/reorder icons
5. Save changes

## Implementation Details

- **Component**: `src/components/ui/CyclingScoutIcon.tsx`
- **Styling**: `src/styles/components/cycling-scout-icon.css`
- **Configuration**: Managed via `configService`
- **Database**: Stored in Firestore `configurations` collection

## Where Used

The cycling scout icons replace star icons in:

- **LocationMap**: Important location indicators
- **LocationCard**: Important location badges
- **LocationFilters**: Important locations filter
- **AnnouncementFeed**: Event-related announcements
- **AnnouncementsPage**: Event-related statistics

## Animation Details

- **Cycle Interval**: Configurable (default 3 seconds)
- **Bounce Duration**: 300ms
- **Animation**: Scale + translateX for side bounce effect
- **Hover Effect**: Slight scale increase on hover

## Technical Notes

- Uses React hooks for state management
- Implements cleanup on unmount
- Graceful fallback to default icons if database fails
- Responsive design with configurable sizes
- Performance optimized with minimal re-renders
