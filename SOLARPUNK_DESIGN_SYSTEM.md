# 🌱 Solarpunk Design System

A nature-inspired design aesthetic for the Pack 1703 Portal, inspired by the ridealso.com design language with a solarpunk twist.

## 🎨 Design Philosophy

The solarpunk design system combines sustainable technology aesthetics with nature-inspired elements, creating a futuristic yet grounded visual experience that reflects our commitment to environmental stewardship and outdoor adventure.

## 🌈 Color Palette

### Primary Colors
- **Forest Green** (`#2D5016`) - Primary earth tone for main actions and branding
- **Solar Yellow** (`#F4D03F`) - Energy and light, used for accents and highlights
- **Sky Blue** (`#5DADE2`) - Air and water elements, secondary actions
- **Ocean Teal** (`#17A2B8`) - Deep water, used for text and UI elements

### Secondary Colors
- **Terracotta** (`#D2691E`) - Earth and clay, warm accents
- **Earth Brown** (`#8B4513`) - Ground and soil, grounding elements

### Neutrals
- **Ink Dark** (`#1A1A1A`) - Primary text color
- **Fog Light** (`#F8F9FA`) - Background color
- **Cloud Light** (`#E9ECEF`) - Border and divider color

## 🔤 Typography

### Font Families
- **Display**: Poppins (headlines, hero text)
- **Body**: Space Grotesk (body text, UI elements)
- **Mono**: JetBrains Mono (code, technical content)

### Font Weights
- Light (300) - Subtle text
- Regular (400) - Body text
- Medium (500) - UI elements
- Semibold (600) - Subheadings
- Bold (700) - Headlines
- Extra Bold (800) - Hero text

## 🎭 Components

### Hero Sections
Full-screen sections with nature-inspired gradients and bold typography:
```css
.solarpunk-hero {
  min-height: 100vh;
  background: var(--gradient-nature);
  display: flex;
  align-items: center;
  justify-content: center;
}
```

### Buttons
Three button styles with nature-inspired colors and hover effects:

#### Primary Button (Forest Green)
```css
.solarpunk-btn-primary {
  background: var(--gradient-forest);
  color: white;
  border-radius: 1rem;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
```

#### Secondary Button (Glass Effect)
```css
.solarpunk-btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 2px solid var(--forest-green);
}
```

#### Solar Button (Solar Yellow)
```css
.solarpunk-btn-solar {
  background: var(--gradient-solar);
  color: var(--ink-dark);
}
```

### Cards
Glass-morphism cards with nature-inspired borders:
```css
.solarpunk-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 1.5rem;
}
```

## 🎬 Animations

### Nature-Inspired Animations
- **solarpunk-float**: Gentle floating motion with rotation
- **solarpunk-glow**: Pulsing glow effect
- **solarpunk-pulse**: Breathing-like scale animation
- **nature-flow**: Flowing motion with color shifts
- **earth-breath**: Subtle breathing animation

### Usage
```css
.animate-solarpunk-float {
  animation: solarpunk-float 6s ease-in-out infinite;
}
```

## 🌍 Gradients

### Primary Gradients
- **gradient-solarpunk**: Complete nature spectrum
- **gradient-forest**: Forest depths
- **gradient-solar**: Solar energy
- **gradient-sky**: Sky to ocean
- **gradient-earth**: Earth to terracotta
- **gradient-nature**: Full nature spectrum

## 📱 Responsive Design

The design system is fully responsive with:
- Mobile-first approach
- Flexible typography scaling
- Adaptive spacing and layouts
- Touch-friendly interactive elements

## ♿ Accessibility

### Features
- High contrast mode support
- Reduced motion preferences
- Keyboard navigation
- Screen reader compatibility
- Focus indicators

### Usage
```css
@media (prefers-reduced-motion: reduce) {
  .solarpunk-animate-float,
  .solarpunk-animate-glow,
  .solarpunk-animate-pulse {
    animation: none;
  }
}
```

## 🚀 Implementation

### Files Structure
```
src/
├── styles/
│   └── solarpunk-design.css    # Main design system
├── pages/
│   ├── HomePage.tsx            # Solarpunk homepage
│   └── HomePage.original.tsx   # Original backup
└── components/
    └── Layout/
        ├── Layout.tsx          # Solarpunk layout
        └── Layout.original.tsx # Original backup
```

### Toggle Script
Use the provided script to switch between designs:
```bash
./toggle-design.sh solarpunk    # Switch to solarpunk
./toggle-design.sh original     # Switch back to original
./toggle-design.sh status       # Check current status
```

## 🎯 Key Features

### Visual Elements
- ✅ Earth-toned color palette
- ✅ Nature-inspired gradients
- ✅ Glass-morphism effects
- ✅ Subtle hover animations
- ✅ Full-screen hero sections
- ✅ Bold typography hierarchy

### Interactive Elements
- ✅ Smooth transitions
- ✅ Hover effects with letter spacing
- ✅ Scale and transform animations
- ✅ Color-shifting gradients
- ✅ Floating elements

### Technical Features
- ✅ CSS custom properties
- ✅ Tailwind CSS integration
- ✅ Responsive design
- ✅ Accessibility support
- ✅ Performance optimized

## 🔄 Reverting Changes

To revert to the original design:

1. **Using the toggle script**:
   ```bash
   ./toggle-design.sh original
   ```

2. **Manual revert**:
   ```bash
   cp src/pages/HomePage.original.tsx src/pages/HomePage.tsx
   cp src/components/Layout/Layout.original.tsx src/components/Layout/Layout.tsx
   ```

3. **Git revert** (if committed):
   ```bash
   git checkout main
   ```

## 🌟 Inspiration

This design system draws inspiration from:
- **ridealso.com**: Bold typography, full-screen heroes, dynamic colors
- **Solarpunk aesthetic**: Sustainable technology meets nature
- **Scouting values**: Outdoor adventure, environmental stewardship
- **Modern web design**: Glass-morphism, smooth animations, accessibility

## 📝 Notes

- All original files are backed up with `.original.tsx` extensions
- The design system is fully compatible with existing Tailwind CSS classes
- Custom CSS properties are defined in `:root` for easy theming
- All animations respect user preferences for reduced motion
- The design maintains WCAG 2.2 AA accessibility standards

---

*Created for Pack 1703 Portal - Where technology meets tradition* 🌱
