---
name: Field Journal
colors:
  surface: '#f8faf5'
  surface-dim: '#d9dbd6'
  surface-bright: '#f8faf5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4ef'
  surface-container: '#edeee9'
  surface-container-high: '#e7e9e4'
  surface-container-highest: '#e1e3de'
  on-surface: '#191c19'
  on-surface-variant: '#59413b'
  inverse-surface: '#2e312e'
  inverse-on-surface: '#f0f1ec'
  outline: '#8c716a'
  outline-variant: '#e0bfb7'
  surface-tint: '#ac3414'
  primary: '#a83212'
  on-primary: '#ffffff'
  primary-container: '#ca4a28'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb4a2'
  secondary: '#6a5b54'
  on-secondary: '#ffffff'
  secondary-container: '#f3ded5'
  on-secondary-container: '#71615a'
  tertiary: '#006480'
  on-tertiary: '#ffffff'
  tertiary-container: '#007ea1'
  on-tertiary-container: '#fbfdff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbd2'
  primary-fixed-dim: '#ffb4a2'
  on-primary-fixed: '#3c0800'
  on-primary-fixed-variant: '#891d00'
  secondary-fixed: '#f3ded5'
  secondary-fixed-dim: '#d6c2ba'
  on-secondary-fixed: '#241914'
  on-secondary-fixed-variant: '#52443d'
  tertiary-fixed: '#bce9ff'
  tertiary-fixed-dim: '#70d2fa'
  on-tertiary-fixed: '#001f29'
  on-tertiary-fixed-variant: '#004d63'
  background: '#f8faf5'
  on-background: '#191c19'
  surface-variant: '#e1e3de'
typography:
  display-title:
    fontFamily: Pretendard
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.3'
    letterSpacing: -0.02em
  section-title:
    fontFamily: Pretendard
    fontSize: 20px
    fontWeight: '700'
    lineHeight: '1.4'
  body-main:
    fontFamily: Pretendard
    fontSize: 15px
    fontWeight: '400'
    lineHeight: '1.6'
  coord-label:
    fontFamily: Geist Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.0'
    letterSpacing: 0.05em
  ranking-num:
    fontFamily: Geist Mono
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.0'
  display-title-mobile:
    fontFamily: Pretendard
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  side-padding: 20px
  section-gap: 40px
  gutter: 16px
  stack-sm: 4px
  stack-md: 12px
---

## Brand & Style

The design system is centered on the concept of a **Contemporary Korean Travel Field Journal**. It departs from the sanitized, high-gloss aesthetics of modern SaaS to embrace the tactile, archival nature of physical travel documentation. The objective is to make the user feel like they are curate-mapping their journey through Korea on high-quality *Hanji* paper.

The style is **Tactile Minimalism** with an **Editorial** lean. It utilizes warm paper textures, ink-on-paper typography, and subtle cartographic elements like hairlines and coordinates. The interface should feel quiet, intentional, and permanent—evoking the emotional response of looking through a well-preserved personal notebook.

**Key Visual Pillars:**
- **Asymmetry:** Slight offsets in layout to break the rigid digital grid.
- **Ink Impression:** High-contrast primary text against soft backgrounds.
- **Cartographic Detail:** Use of monospaced coordinates and micro-labels for metadata.

## Colors

This color palette is inspired by traditional Korean materials and print techniques.

- **Hanji Canvas (#F4F0E8):** The foundational layer. Use this for the primary background of the application to provide warmth and reduce eye strain.
- **Paper Surface (#FFFCF6):** Use for active containers, input fields, or "floating" journal entries to create a subtle sense of elevation.
- **Charcoal Ink (#1E211E):** The primary color for all critical information, heavy iconography, and headers.
- **Vermilion Stamp (#D95432):** Reserved for "the stamp"—active states, primary call-to-actions, and successful collection events. It should feel like a physical ink seal pressed onto the page.
- **Faded Ink & Hairline:** Used for secondary metadata and structural division to ensure the hierarchy remains clear without being aggressive.

## Typography

The typography system uses a dual-font approach to balance readability with technical flair.

- **Pretendard** serves as the workhorse for both Display and Body copy. It provides excellent legibility for Korean characters while maintaining a contemporary, clean feel.
- **Geist Mono** is used exclusively for technical data: GPS coordinates, timestamps, ranking numbers, and micro-metadata. This creates a "field notes" aesthetic, suggesting precision and record-keeping.

**Editorial Rules:**
- Use **Body-main** with a relaxed line height (1.6) to mimic the spacing of a physical journal.
- **Coord-labels** should always be in uppercase (for Latin characters) with increased letter spacing.
- Large titles should occasionally utilize asymmetrical alignment (e.g., hanging indents) to enhance the editorial feel.

## Layout & Spacing

The layout philosophy follows a **Fixed-Fluid Hybrid** model. The core content container is constrained by a 20px side padding to ensure a comfortable reading experience on mobile devices, while vertical spacing is generous to create an editorial flow.

- **The 8px Grid:** All internal component spacing and small-scale padding should follow increments of 8px.
- **Rule-Based Separation:** Instead of heavy boxes, use `Hairline Rule` (#D8D2C7) to separate logical sections.
- **Whitespace as Structure:** Favor 40px+ vertical gaps between major editorial sections.
- **Reflow:** On tablets, the single-column journal view expands into a multi-column "scrapbook" layout where images and coordinates can sit alongside text entries rather than purely stacked.

## Elevation & Depth

This design system avoids the use of heavy shadows or artificial light sources. Depth is communicated through **Tonal Layering** and **Edge Definition**.

- **Level 0 (Base):** `Hanji Canvas` (#F4F0E8).
- **Level 1 (Paper):** `Paper Surface` (#FFFCF6). This level is used for elements that are "placed" on the canvas. It is defined by a 1px solid `Hairline Rule` border rather than a shadow.
- **Interactions:** When an element is pressed, it does not "lift" (no shadow growth). Instead, it may shift slightly in position or change color to `Pale Vermilion`, simulating a physical press.
- **The "Stamp" Effect:** Active states for buttons or badges should feel like an ink impression. They are flat, high-contrast, and sit directly on the surface.

## Shapes

The shape language reflects the "soft-cut" nature of paper and organic stamps.

- **Primary Radius:** A default of 12px is used for small components (chips, buttons).
- **Container Radius:** 18px is used for larger surfaces like image containers or modal sheets, providing a friendly, organic feel.
- **Stamp Exception:** Circular elements (like the stamp collection progress) should be perfect circles, mimicking the traditional *Injang* (Korean seal).
- **Hard Lines:** Dividers and rules are always 1px sharp lines, never rounded.

## Components

### Buttons
- **Primary:** Filled `Vermilion Stamp` with white or `Paper Surface` text. No shadow.
- **Secondary:** Transparent background with a `Charcoal Ink` 1px border.
- **Icon Buttons:** Use 20px line-art icons, never filled, unless in an active state.

### Stamps & Chips
- **Collected Stamp:** A circular component with a 2px `Vermilion Stamp` border and an inner ink-bleed effect icon.
- **Category Chips:** Use `Paper Surface` background with `Faded Ink` text. Low prominence until selected.

### Cards & Containers
- Avoid traditional cards with shadows. Use a "Paper Block" approach: a `Paper Surface` background with a 1px `Hairline Rule` border.
- **Image Containers:** Always accompany images with a `Geist Mono` coordinate label in the bottom-right corner, appearing as a printed serial number.

### Input Fields
- Underlined style preferred over boxed. The underline uses the `Hairline Rule`, turning `Charcoal Ink` on focus.
- Labels sit above the input in `Coord-label` typography.

### Lists
- Separated by thin `Hairline Rules`.
- Each list item should feel like a line in a ledger, with the `ranking-num` or time-stamp on the far left.

### Imagery
- Images must include a subtle film grain overlay (approx 3-5% opacity).
- Use intentional "polaroid" or "magazine" crops—avoid standard 16:9 where possible, favoring 4:5 or 1:1.