---
name: Matenron
colors:
  surface: '#f7faf6'
  surface-dim: '#d8dbd7'
  surface-bright: '#f7faf6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f4f0'
  surface-container: '#ecefeb'
  surface-container-high: '#e6e9e5'
  surface-container-highest: '#e0e3df'
  on-surface: '#181c1a'
  on-surface-variant: '#3f4944'
  inverse-surface: '#2d312f'
  inverse-on-surface: '#eef2ed'
  outline: '#6f7973'
  outline-variant: '#bec9c2'
  surface-tint: '#1b6b51'
  primary: '#004532'
  on-primary: '#ffffff'
  primary-container: '#065f46'
  on-primary-container: '#8bd6b7'
  inverse-primary: '#8bd6b6'
  secondary: '#5d5f5e'
  on-secondary: '#ffffff'
  secondary-container: '#dfe0df'
  on-secondary-container: '#616362'
  tertiary: '#652925'
  on-tertiary: '#ffffff'
  tertiary-container: '#823f3a'
  on-tertiary-container: '#ffb4ad'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#a6f2d1'
  primary-fixed-dim: '#8bd6b6'
  on-primary-fixed: '#002116'
  on-primary-fixed-variant: '#00513b'
  secondary-fixed: '#e2e2e2'
  secondary-fixed-dim: '#c6c7c6'
  on-secondary-fixed: '#1a1c1c'
  on-secondary-fixed-variant: '#454747'
  tertiary-fixed: '#ffdad6'
  tertiary-fixed-dim: '#ffb3ac'
  on-tertiary-fixed: '#3b0908'
  on-tertiary-fixed-variant: '#73332f'
  background: '#f7faf6'
  on-background: '#181c1a'
  surface-variant: '#e0e3df'
typography:
  display-lg:
    fontFamily: Noto Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Noto Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-md:
    fontFamily: Noto Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Noto Sans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Noto Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Hanken Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  headline-lg-mobile:
    fontFamily: Noto Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  container-max: 1200px
  gutter: 20px
---

## Brand & Style

The brand identity centers on the "Tactile Professional" aesthetic—blending the precision of a high-stakes Mahjong match with the clarity of a modern data-analysis tool. This design system bridges the gap between traditional gaming heritage and contemporary educational software.

The UI should feel grounded, scholarly, and reliable. It utilizes a **Tactile-Minimalist** style: clean layouts with subtle physical metaphors, such as surfaces that mimic the weight and texture of high-quality urea resin tiles. The emotional goal is to provide a "flow state" environment where the complexity of Mahjong calculations is simplified through structured, calm, and high-contrast visual cues.

## Colors

The palette is derived from the physical elements of the Mahjong parlor.

- **Primary (Deep Emerald):** Used for headers, primary action buttons, and active states. It establishes the "Table" context.
- **Secondary (Ivory):** The base color for tile-mimicking components and cards. It provides a warm, classic feel compared to pure white.
- **Accent (Crimson):** Reserved for critical information—Dora indicators, Riichi status, and error states.
- **Neutral (Slate/Light Grey):** Used for backgrounds and secondary text to ensure the emerald and ivory elements remain the focus.

Functional color application should follow a 60-30-10 rule, where the background and secondary ivory dominate the space, primary emerald provides the structure, and crimson highlights the logic.

## Typography

This design system utilizes **Noto Sans** for its universal clarity and exceptional support for Japanese characters, essential for tile names and terminology. **Hanken Grotesk** is introduced as a secondary label font to provide a sharp, modern contrast for numerical data and technical metadata.

- **Headlines:** Bold and authoritative to anchor the card-based layout.
- **Body Text:** Standard weight with generous line height for readability during complex quiz scenarios.
- **Data Labels:** Uppercase or high-tracking labels using Hanken Grotesk for point values, "Fu" counts, and "Han" multipliers.

## Layout & Spacing

This design system employs a **Fixed-Fluid Hybrid** grid. The primary content area is constrained to a 1200px maximum width on desktop to maintain readability, while using a 12-column grid.

- **Mobile:** 4-column grid with 16px margins.
- **Tablet:** 8-column grid with 24px margins.
- **Desktop:** 12-column grid with 32px margins.

The spacing rhythm is based on a 4px baseline, ensuring that tile components and point-calculation tables align perfectly. Horizontal spacing between tiles in a "hand" component should be minimal (2px - 4px) to mimic the appearance of a physical row of tiles.

## Elevation & Depth

Hierarchy is established through **Tonal Stacking** and **Soft Inset Shadows**.

1.  **Level 0 (Background):** The very light slate background represents the room environment.
2.  **Level 1 (Table):** Emerald Green surfaces (headers or sidebars) appear flush or slightly recessed.
3.  **Level 2 (Cards/Tiles):** Ivory surfaces use a soft, low-blur shadow (0px 4px 12px rgba(0,0,0,0.08)) to appear lifted.
4.  **Level 3 (Interactive Tiles):** When a user selects a tile, it gains a stronger shadow and a 1px Crimson border to indicate focus.

Avoid heavy blurs; maintain a crisp, mathematical feel to the depth layers.

## Shapes

The shape language is **Soft-Geometric**. While modern apps often trend toward high roundedness, this design system uses subtle 4px (0.25rem) radiuses to echo the slightly eased edges of physical Mahjong tiles.

- **Tiles:** 4px border radius.
- **Buttons/Inputs:** 4px border radius for a professional, "tool-like" appearance.
- **Cards:** 8px (0.5rem) border radius to separate major content sections.
- **Selection Indicators:** Circular (pill) shapes are reserved exclusively for "Riichi" indicators and floating status badges.

## Components

### Mahjong Tiles
The core interactive element. Tiles should be Ivory (#fafaf9) with a 1px border (#e2e8f0). The glyphs (numbers/symbols) should be high-contrast. When selected, a tile should translate -4px on the Y-axis.

### Primary Buttons
Solid Emerald Green (#065f46) with white text. Use Hanken Grotesk in medium weight for button labels to differentiate from body text.

### Calculation Cards
Containers for point data. Use a Secondary Ivory background with a Crimson Red left-accent border (4px width) to denote "Dora" or "Winning" hand sections. 

### Data Visualization
Use Crimson Red for positive point swings (gains) and a muted Slate for losses. Progress bars for quiz completion should use Emerald Green.

### Tile Picker
A specialized component organized by suit (Man, Pin, Sou, Honors). This should use a dense grid layout with minimal padding to allow all tiles to be visible on one screen without excessive scrolling.
