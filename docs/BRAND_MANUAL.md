# CampAIgner Brand Manual

## Brand Identity

### Brand Name
**CampAIgner** - AI-Powered Social Media Management Platform

### Tagline
"Empowering brands with AI-driven insights for enhanced social media engagement"

### Brand Promise
CampAIgner unifies customer communications across multiple channels and leverages AI for intelligent content strategies, providing a centralized dashboard for managing messages, creating content plans, running campaigns, and analyzing performance.

---

## Logo Guidelines

### Primary Logo
The CampAIgner logo features a modern, professional design with blue tones that represent trust, technology, and reliability.

**Logo Variations:**
- Primary (Full color on light background)
- Inverted (White on dark background)
- Transparent (For overlays)

### Logo Usage Rules
- Maintain minimum clear space equal to the height of the "C" around the logo
- Never distort, rotate, or add effects to the logo
- Minimum size: 120px width for digital, 1 inch for print
- Always use official logo files from brand assets

### Logo Colors
- Primary Blue: `hsl(210, 70%, 45%)` / `#2563EB`
- Accent Blue: `hsl(205, 90%, 55%)` / `#3B82F6`

---

## Color Palette

### Primary Colors

| Color Name | HSL Value | Hex | Usage |
|------------|-----------|-----|-------|
| Primary Blue | `hsl(210, 70%, 45%)` | `#2563EB` | Main brand color, CTAs, primary buttons |
| Primary Dark | `hsl(210, 25%, 7.84%)` | `#0F172A` | Text, headings, dark backgrounds |
| Primary Light | `hsl(0, 0%, 100%)` | `#FFFFFF` | Backgrounds, cards, light text |

### Brand Blue Scale

| Token | HSL Value | Usage |
|-------|-----------|-------|
| brand-25 | `hsl(210, 75%, 98%)` | Lightest backgrounds |
| brand-50 | `hsl(210, 70%, 95%)` | Hover states |
| brand-100 | `hsl(210, 65%, 90%)` | Subtle backgrounds |
| brand-200 | `hsl(210, 60%, 80%)` | Borders, dividers |
| brand-300 | `hsl(210, 55%, 70%)` | Disabled states |
| brand-400 | `hsl(210, 50%, 60%)` | Secondary elements |
| brand-500 | `hsl(210, 65%, 50%)` | Standard interactive |
| brand-600 | `hsl(210, 70%, 45%)` | Primary actions |
| brand-700 | `hsl(210, 75%, 35%)` | Hover primary |
| brand-800 | `hsl(210, 80%, 25%)` | Active states |
| brand-900 | `hsl(210, 85%, 15%)` | Darkest accents |

### Accent Colors

| Color Name | HSL Value | Hex | Usage |
|------------|-----------|-----|-------|
| Accent Blue | `hsl(205, 90%, 55%)` | `#3B9FE3` | Highlights, links |
| Accent Navy | `hsl(215, 85%, 25%)` | `#1E3A5F` | Dark accents |
| Accent Light | `hsl(205, 80%, 85%)` | `#B8D9F2` | Soft backgrounds |

### Semantic Colors

| Color Name | HSL Value | Usage |
|------------|-----------|-------|
| Success | `hsl(159.78, 100%, 36.08%)` | Positive feedback, confirmations |
| Warning | `hsl(42.03, 92.83%, 56.27%)` | Caution states, alerts |
| Error | `hsl(356.30, 90.56%, 54.31%)` | Errors, destructive actions |
| Info | `hsl(210, 70%, 45%)` | Informational messages |

### Platform-Specific Colors

| Platform | Hex Color | Usage |
|----------|-----------|-------|
| Instagram | `#E1306C` | Instagram-related UI elements |
| WhatsApp | `#25D366` | WhatsApp-related UI elements |
| Email | `#3F82D1` | Email-related UI elements |
| TikTok | `#000000` | TikTok-related UI elements |

### Dark Mode Palette

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Background | `hsl(0, 0%, 100%)` | `hsl(0, 0%, 0%)` |
| Foreground | `hsl(210, 25%, 7.84%)` | `hsl(200, 6.67%, 91.18%)` |
| Card | `hsl(180, 6.67%, 97.06%)` | `hsl(228, 9.80%, 10%)` |
| Border | `hsl(201.43, 30.43%, 90.98%)` | `hsl(210, 5.26%, 14.90%)` |
| Muted | `hsl(240, 1.96%, 90%)` | `hsl(0, 0%, 9.41%)` |

---

## Typography

### Primary Font
**Inter** - A clean, modern sans-serif typeface optimized for screen readability.

```css
font-family: 'Inter', sans-serif;
```

### Font Import
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
```

### Type Scale

| Style | Weight | Size | Line Height | Usage |
|-------|--------|------|-------------|-------|
| Display | 700 (Bold) | 48px / 3rem | 1.1 | Hero headlines |
| H1 | 700 (Bold) | 36px / 2.25rem | 1.2 | Page titles |
| H2 | 600 (Semibold) | 30px / 1.875rem | 1.3 | Section headers |
| H3 | 600 (Semibold) | 24px / 1.5rem | 1.35 | Subsection headers |
| H4 | 500 (Medium) | 20px / 1.25rem | 1.4 | Card titles |
| Body Large | 400 (Regular) | 18px / 1.125rem | 1.6 | Lead paragraphs |
| Body | 400 (Regular) | 16px / 1rem | 1.5 | Standard text |
| Body Small | 400 (Regular) | 14px / 0.875rem | 1.5 | Secondary text |
| Caption | 400 (Regular) | 12px / 0.75rem | 1.4 | Labels, metadata |

### Secondary Fonts
- **Serif**: Georgia (for editorial content)
- **Monospace**: Menlo (for code snippets)

---

## Spacing System

Based on a 4px base unit with `--spacing: 0.25rem`:

| Token | Value | Pixels |
|-------|-------|--------|
| 0 | 0 | 0px |
| 1 | 0.25rem | 4px |
| 2 | 0.5rem | 8px |
| 3 | 0.75rem | 12px |
| 4 | 1rem | 16px |
| 5 | 1.25rem | 20px |
| 6 | 1.5rem | 24px |
| 8 | 2rem | 32px |
| 10 | 2.5rem | 40px |
| 12 | 3rem | 48px |
| 16 | 4rem | 64px |
| 20 | 5rem | 80px |
| 24 | 6rem | 96px |

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| --radius | 1.3rem (20.8px) | Default radius for cards, modals |
| Small | 0.5rem (8px) | Buttons, inputs |
| Medium | 0.75rem (12px) | Cards, panels |
| Large | 1rem (16px) | Modals, large containers |
| Full | 9999px | Pills, avatars |

---

## Shadows

The platform uses subtle, clean shadows for depth:

| Level | Usage |
|-------|-------|
| shadow-sm | Buttons, small interactive elements |
| shadow | Cards, dropdowns |
| shadow-md | Elevated cards, popovers |
| shadow-lg | Modals, dialogs |
| shadow-xl | Important overlays |

---

## Motion & Animation

### Principles
1. **Subtle and purposeful** - Animation should enhance, not distract
2. **Fast and responsive** - Keep transitions under 300ms for UI interactions
3. **Natural easing** - Use ease-out for entrances, ease-in for exits

### Standard Transitions

```css
/* Default interaction transition */
transition: all 0.2s ease;

/* Hover lift effect */
.hover-lift {
  transition: all 0.2s ease;
}
.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}
```

### Brand Animations

| Animation | Duration | Usage |
|-----------|----------|-------|
| gradientShift | 15s | Background gradients |
| float | 3s | Floating elements, decorative |
| glow | 2s | Accent highlights |
| pulse-glow | 2s | Interactive attention |
| ghost-appear | 1.2s | Staggered content reveal |

---

## UI Components

### Buttons

**Primary Button**
- Background: `var(--primary)` - Primary Blue
- Text: White
- Hover: Darken 10%, slight lift
- Border-radius: Default radius

**Secondary Button**
- Background: Transparent
- Border: 1px solid `var(--border)`
- Text: `var(--foreground)`
- Hover: Light background fill

**Destructive Button**
- Background: `var(--destructive)` - Error red
- Text: White
- Use sparingly for delete/remove actions

### Cards
- Background: `var(--card)`
- Border: 1px solid `var(--border)`
- Border-radius: `var(--radius)`
- Padding: 24px (1.5rem)
- Shadow: shadow-sm on hover

### Form Elements
- Input height: 40px minimum
- Border: 1px solid `var(--border)`
- Focus ring: 2px `var(--ring)` with offset
- Label: Body Small, Medium weight
- Error states: Border and text in `var(--destructive)`

---

## Iconography

### Icon Library
Primary: **Lucide React** - Clean, consistent stroke icons

### Icon Sizes
| Size | Pixels | Usage |
|------|--------|-------|
| xs | 12px | Inline with small text |
| sm | 16px | Buttons, inline actions |
| md | 20px | Default, navigation |
| lg | 24px | Feature icons |
| xl | 32px | Hero sections |

### Brand Icons (react-icons/si)
Use for company/platform logos:
- SiInstagram, SiFacebook, SiWhatsapp, SiTiktok
- SiStripe, SiOpenai, etc.

---

## Imagery Guidelines

### Photography Style
- Clean, modern, professional
- Natural lighting preferred
- Human-centric when showing people
- Tech-forward but approachable

### Illustrations
- Minimal, line-based style
- Brand colors as accents
- Abstract geometric elements welcome
- Avoid overly cartoonish styles

### AI-Generated Content
- Must align with brand aesthetics
- Review for quality before publishing
- Maintain consistent style across generated content

---

## Voice & Tone

### Brand Voice
- **Professional** but not corporate
- **Helpful** and solution-oriented
- **Clear** and jargon-free
- **Empowering** to users

### Writing Guidelines
1. Use active voice
2. Keep sentences concise
3. Avoid technical jargon when possible
4. Be direct and actionable
5. Use "you" to address users

### Tone by Context
| Context | Tone |
|---------|------|
| Success messages | Positive, celebratory |
| Error messages | Helpful, solution-focused |
| Onboarding | Friendly, encouraging |
| Analytics | Professional, data-driven |
| Marketing | Exciting, benefit-focused |

---

## Accessibility

### Color Contrast
- Maintain WCAG 2.1 AA compliance minimum
- Text on backgrounds: 4.5:1 ratio
- Large text (18px+): 3:1 ratio

### Focus States
- Visible focus ring on all interactive elements
- Ring color: `var(--ring)` (Primary Blue)
- Ring offset: 2px

### Mobile Considerations
- Touch targets: 44px minimum
- Font size: Never below 16px for inputs
- Clear tap states and feedback

---

## File Naming Conventions

### Assets
- Lowercase with hyphens: `hero-background.png`
- Include size when relevant: `logo-1200x600.png`
- Platform variants: `logo-instagram.png`

### Components
- PascalCase: `BrandSwitcher.tsx`
- Descriptive names: `UserProfileCard.tsx`

---

## Contact

For brand questions or asset requests, contact the CampAIgner design team.

---

*Last updated: January 2026*
*Version: 1.0*
