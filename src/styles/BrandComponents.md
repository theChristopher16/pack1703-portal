# 🎨 Pack 1703 Portal Brand Kit

> **SmithStation + Solyn unified brand system**  
> Community • Nature • Technology

## Color Palette

### Core Colors
- **Sunlit Yellow** `#F6C945` - Accent/Energy (use sparingly for highlights)
- **Soft Moss Green** `#6BAA75` - Primary/Action buttons
- **Teal-Gray** `#4C6F7A` - Brand text / UI chrome
- **Ink** `#1C1C1C` - Headlines
- **Fog** `#F4F6F7` - Panels/Backgrounds
- **Cloud** `#E6EBED` - Borders/Dividers

### Tailwind Classes
```tsx
// Background colors
bg-moss        // Primary green
bg-teal        // Secondary teal
bg-sun         // Accent yellow
bg-fog         // Light background
bg-ink         // Dark background

// Text colors
text-ink       // Headlines
text-teal-700  // Body text
text-moss      // Primary actions

// Border colors
border-cloud   // Dividers
```

## Typography

### Font Family
- **Display & UI**: Inter (professional, warm, readable)

### Hierarchy
```tsx
// Headlines
<h1 className="text-ink font-display text-2xl">
  Welcome to Pack 1703
</h1>

// Body text
<p className="text-teal-700">
  Community • Nature • Technology
</p>

// Small text
<span className="text-teal-600 text-sm">
  Last updated 2 days ago
</span>
```

## Component Patterns

### Brand Container
```tsx
<div className="mx-auto max-w-7xl px-6">
  {/* Content */}
</div>
```

### Card
```tsx
<section className="bg-fog rounded-brand shadow-card border border-cloud p-6">
  <h2 className="text-ink font-display text-xl">Card Title</h2>
  <p className="text-teal-700">Card content goes here</p>
</section>
```

### Primary Button
```tsx
<button className="bg-moss text-white hover:bg-moss-600 active:bg-moss-700 rounded-md px-4 py-2 font-medium transition-colors">
  Join Event
</button>
```

### Secondary Button
```tsx
<button className="bg-teal text-white hover:bg-teal-600 active:bg-teal-700 rounded-md px-4 py-2 font-medium transition-colors">
  Learn More
</button>
```

### Accent Tag/Badge
```tsx
<span className="inline-flex items-center gap-2 rounded-full bg-sun/15 text-ink px-3 py-1 border border-sun/40">
  <svg className="size-3 fill-sun" />
  New
</span>
```

### Alert/Banner
```tsx
<div className="rounded-brand border border-cloud shadow-card overflow-hidden">
  <div className="h-1 w-full bg-sun"></div>
  <div className="bg-gradient-brand text-white p-6">
    <h1 className="font-display text-2xl">Blue & Gold Celebration</h1>
    <p className="opacity-90">Saturday · 3:00–6:00 · Community Hall</p>
  </div>
  <div className="bg-white p-4 text-teal-800">
    Bring a reusable bottle ♻️ — small actions, big signal.
  </div>
</div>
```

### Input Field
```tsx
<input
  type="text"
  className="w-full rounded-md border border-cloud bg-white px-4 py-2 text-ink focus:border-moss focus:ring-2 focus:ring-moss/20 transition-colors"
  placeholder="Enter your name"
/>
```

### Navigation Item
```tsx
<a
  href="/events"
  className="text-teal-700 hover:text-moss hover:bg-moss/10 px-3 py-2 rounded-md transition-colors"
>
  Events
</a>
```

## Email Templates

### Header
```html
<table role="presentation" width="100%" style="background:#F4F6F7;">
  <tr><td align="center">
    <table role="presentation" width="640" style="background:#ffffff;border:1px solid #E6EBED;border-radius:14px;">
      <tr>
        <td style="padding:24px 28px;border-bottom:1px solid #E6EBED;">
          <div style="font:700 22px/1.2 Inter,system-ui,sans-serif;color:#1C1C1C;">
            Pack 1703 Portal
          </div>
          <div style="font:500 12px/1.4 Inter,system-ui,sans-serif;color:#4C6F7A;">
            Community • Nature • Technology
          </div>
        </td>
      </tr>
      <tr>
        <td style="padding:24px 28px;">
          <a href="#" style="background:#6BAA75;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;display:inline-block;">
            Open the Portal
          </a>
        </td>
      </tr>
      <tr>
        <td style="height:6px;background:#F6C945;"></td>
      </tr>
    </table>
  </td></tr>
</table>
```

## Usage Guidelines

### Hierarchy
- **ink** for headlines
- **teal-gray** for body text
- **moss** for primary actions
- **sunlit yellow** as thin highlight (rules, tags, progress bars)

### Accessibility
- Pair **moss** or **ink** on light backgrounds
- Avoid **yellow** for text—use it as an accent only
- Maintain 4.5:1 contrast ratio for body text
- Use **teal-700** or darker for readable text

### Tone
- **Warm, optimistic, practical**
- "Tech as a tool, not a toy"
- Community-focused
- Nature-inspired

## Brand Values

- 🌱 **Community** - Building connections
- 🌿 **Nature** - Environmental stewardship
- 🔧 **Technology** - Tools for good
- ✨ **Quality** - Professional, polished, purposeful

