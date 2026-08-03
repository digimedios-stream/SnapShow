---
name: SnapShow Kinetic
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#3a3939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#c7c4d7'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#908fa0'
  outline-variant: '#464554'
  surface-tint: '#c0c1ff'
  primary: '#c0c1ff'
  on-primary: '#1000a9'
  primary-container: '#8083ff'
  on-primary-container: '#0d0096'
  inverse-primary: '#494bd6'
  secondary: '#ddb7ff'
  on-secondary: '#490080'
  secondary-container: '#6f00be'
  on-secondary-container: '#d6a9ff'
  tertiary: '#ffb2b7'
  on-tertiary: '#67001b'
  tertiary-container: '#ff516a'
  on-tertiary-container: '#5b0017'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e1e0ff'
  primary-fixed-dim: '#c0c1ff'
  on-primary-fixed: '#07006c'
  on-primary-fixed-variant: '#2f2ebe'
  secondary-fixed: '#f0dbff'
  secondary-fixed-dim: '#ddb7ff'
  on-secondary-fixed: '#2c0051'
  on-secondary-fixed-variant: '#6900b3'
  tertiary-fixed: '#ffdadb'
  tertiary-fixed-dim: '#ffb2b7'
  on-tertiary-fixed: '#40000d'
  on-tertiary-fixed-variant: '#92002a'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  display-lg:
    fontFamily: Outfit
    fontSize: 64px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-sm:
    fontFamily: Outfit
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-lg:
    fontFamily: Outfit
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
  headline-md:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-bold:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1440px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
---

## Brand & Style

The brand personality is electric, high-octane, and premium. As a SaaS for live event projections, the design system must mirror the energy of a live concert or a major gala—transitioning seamlessly between festive excitement and professional reliability. 

The aesthetic is **Glassmorphism**, characterized by deep translucent layers, vibrant background blurs, and dynamic indigo-to-purple gradients. The UI should feel like a physical control booth: dark, immersive, and tech-forward. We employ "Floating Lights"—soft, high-intensity color orbs behind the UI—to provide depth and a sense of "stage lighting" within the application.

## Colors

The palette is rooted in deep space blacks to ensure maximum contrast for projection previews and vibrant UI elements.

- **Primary Indigo (#6366f1):** Used for primary actions and "active" states.
- **Secondary Purple (#a855f7):** Used for branding accents and secondary functional elements.
- **Surface Neutrals:** The background is a strict `#0a0a0a`. Elevated surfaces use semi-transparent variants of white (e.g., `rgba(255, 255, 255, 0.05)`) to achieve the frosted glass effect.
- **Accents:** A tertiary Rose (#f43f5e) is reserved for critical alerts or "Live" indicators.

## Typography

We use **Outfit** for headlines to provide a modern, geometric, and high-impact feel that commands attention. **Inter** is used for body text and functional labels to maintain exceptional legibility amidst complex glassmorphic backgrounds.

- **Display levels** are ultra-bold to evoke the feeling of event posters and stage graphics.
- **Labels** often use uppercase with increased letter spacing to provide a technical, "instrument panel" aesthetic.
- On mobile, display sizes scale down aggressively to ensure controls remain accessible without excessive scrolling.

## Layout & Spacing

The design system utilizes a **fluid grid** model with generous margins to allow the "floating lights" and background depth to breathe.

- **Desktop:** 12-column grid, 24px gutters, 48px side margins. 
- **Tablet:** 8-column grid, 16px gutters, 32px side margins.
- **Mobile:** 4-column grid, 12px gutters, 16px side margins.

Spacing follows an 8px base unit. Component internal padding is typically set to `16px` (2u) or `24px` (3u) to maintain a professional, airy feel even within a dark UI.

## Elevation & Depth

Hierarchy is established through **Backdrop Blurs** and **Rim Lighting** rather than traditional shadows.

1.  **Floor (Z-0):** The `#0a0a0a` background with dynamic, low-opacity "Light Orbs" in Indigo and Purple.
2.  **Glass Layer (Z-1):** 10% opacity white fill, `20px` backdrop-blur, and a `1px` inner stroke (white at 15% opacity) to simulate the edge of a glass pane.
3.  **Floating Layer (Z-2):** For modals and pop-overs. Same as Z-1 but with a 20% opacity white fill and a soft `0 20px 40px rgba(0,0,0,0.4)` shadow to provide separation from the glass layers below.

Avoid solid black fills for any container; every surface should feel like a filtered lens.

## Shapes

The design system uses **Rounded (level 2)** geometry. This balances the friendliness of a social event with the precision of a SaaS tool.

- **Standard Buttons/Inputs:** 0.5rem (8px).
- **Cards/Containers:** 1rem (16px).
- **Projector Previews:** 1.5rem (24px) to emphasize the "screen" within the app.
- **Floating Chips:** Pill-shaped (fully rounded) to contrast against the structured grid.

## Components

### Buttons
Primary buttons use the Indigo-to-Purple gradient with white text. Secondary buttons are "Ghost Glass" styles: transparent fills with a 1px Indigo border and a slight backdrop blur. On hover, buttons should "glow" using an external box-shadow with the primary color at low opacity.

### Glass Cards
The signature component. Use `.glass-card` for event listings and dashboard widgets. Must include a `1px` top-left highlight border to catch the "virtual light."

### Input Fields
Dark backgrounds (`rgba(0,0,0,0.3)`) with a `1px` white-alpha border. On focus, the border transitions to Primary Indigo with a soft outer glow.

### Status Indicators
Live events should use a "Pulsing Glow" animation using the Tertiary Rose color. 

### Lists & Tables
Rows should be separated by high-transparency lines (`rgba(255,255,255,0.05)`). Hovering over a list item should trigger a subtle increase in the backdrop-blur intensity rather than a solid color change.