# Breathing Web App

A lightweight, precision-timed breathing app built with Next.js, TypeScript, Tailwind CSS, and shadcn/ui. This repo follows an incremental, UI‑first workflow with visible changes in the browser at each step.

## Current Features

- 🧭 **Mobile App Shell**: Top bar with hamburger and a modal drawer (Home, Breathing, Settings, About)
- 🫁 **Dedicated Breathing Screen**: `/breath` is a focused, full‑screen stage with Start/Stop overlay controls
- 🎨 **Multiple Themes**: Theme CSS files in `public/themes/` loaded at runtime; selection persists
- 🌗 **Appearance Toggle**: Light/Dark/System (follows OS when set to System)
- 🧩 **BEM Class Names**: Present for identification/communication (styling remains Tailwind‑first)

Planned (not yet implemented): techniques JSON and selector, precise animation timing, PWA (offline + install), tests.

## Tech Stack

- **Framework**: Next.js 15 (App Router) + TypeScript (strict)
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **Theming**: TweakCN-exported CSS variable themes, loaded via a ThemeProvider
- **Animations**: HTML/CSS transforms + Web Animations API (to be wired)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd breathing-app-2

# Install dependencies
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

### Development

```bash
# Start the development server
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open http://localhost:3000 to see the app. It reloads on changes.

### Environment Variables

- Copy `.env.example` to `.env.local` and adjust values for your environment. Next.js automatically loads `.env.local`.
- Public variables must be prefixed with `NEXT_PUBLIC_` to be exposed to the browser.

Current variables:
- `NEXT_PUBLIC_DEBUG_BREATH` — `0` or `1` (or `true`). When enabled, shows a debug HUD on `/breath` with live cycle/time/phase/status. Useful during development.

Notes:
- `.env.local` is gitignored; do not commit secrets.
- After changing envs, restart the dev server.

### Testing
Test commands will be added as features land.

### Building for Production

```bash
# Build the application
npm run build

# Start production server
npm run start

# Analyze bundle size
npm run analyze
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Wraps pages with AppShell + ThemeProvider
│   ├── page.tsx            # Home placeholder
│   ├── breath/page.tsx     # Dedicated breathing screen
│   └── settings/
│       ├── page.tsx        # Settings page
│       ├── ThemeSelector.tsx
│       └── ColorSchemeToggle.tsx
├── components/
│   └── layout/
│       ├── AppShell.tsx    # Mobile header + drawer
│       └── ThemeProvider.tsx# Theme and color scheme loader
└── ... (data, hooks, utils, types)

public/
└── themes/                 # Theme CSS files from TweakCN
    ├── amethyst-haze.css
    ├── amber-minimal.css
    └── bubblegum.css
```

## Theming
The app loads theme CSS files dynamically and persists your choice.

- Single source of truth: `public/themes/manifest.json` lists available themes and the default.
- Add a new theme by placing a file at `public/themes/<name>.css` with variables under `:root` (and optional `.dark`) and adding an entry to `public/themes/manifest.json`.
- Open `/settings` → Theme and select it; the selector reads labels from the manifest and parses colors from each theme’s CSS for previews (no color data is stored in the manifest).
- Set Appearance to Light/Dark/System; System follows OS and toggles `html.dark` automatically.

Preview cards display a meaningful swatch per theme (overrides are allowed for better representation).

## Routes

- `/` — Home (placeholder for onboarding/quick-pick)
- `/breath` — Focused breathing screen (full screen, Start/Stop overlay controls)
- `/settings` — Theme selector and Appearance toggle
- `/about` — Placeholder

## Roadmap (next)

- Techniques JSON + type definitions and Settings selector
- BreathingAnimation component with precise WAAPI timing (±50ms) and reduced‑motion fallback
- Page transitions (mobile-like) honoring reduced motion
- PWA (manifest + service worker) and install prompt
- Tests (unit + integration + a11y)

## Accessibility (in progress)

- Keyboard navigation, ARIA labels, reduced motion compliance (ongoing)

## Browser Support

- Chrome 90+
- Firefox 88+ 
- Safari 14+
- Edge 90+
- iOS Safari 14+
- Android Chrome 90+

## Development Guidelines

Please read `AGENTS.md` and `PRD.md` for rules, scope, and roadmap.

Key principles:
- **Modular Design**: Components are isolated and replaceable
- **TypeScript Strict**: All code fully typed
- **Performance First**: Optimized for mobile devices
- **Testing Required**: Comprehensive test coverage
- **Accessibility**: WCAG 2.1 AA compliance

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow the development guidelines in [AGENTS.md](./AGENTS.md)
4. Commit changes (`git commit -m 'feat: add amazing feature'`)
5. Push to branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## Roadmap

### Phase 1: Enhanced Experience
- [ ] Audio cues and voice guidance
- [ ] Timed sessions with soft start/end sounds
- [ ] Additional breathing techniques
- [ ] Background soundscapes

### Phase 2: Personalization & Progress
- [ ] User accounts and cloud sync
- [ ] Practice statistics and streaks
- [ ] Custom breathing techniques
- [ ] Achievement system

### Phase 3: Premium Features
- [ ] Advanced programs and courses
- [ ] Social features and challenges
- [ ] Expert-led guided sessions
- [ ] Premium subscription model

### Phase 4: Advanced Integration
- [ ] Wearable device support
- [ ] Biometric feedback integration
- [ ] AI-powered recommendations

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Inspired by breathing apps like Breathwrk and Paced Breathing
- Built with modern web technologies for optimal performance
- Designed with privacy and accessibility as core principles

## Support

If you have questions or need help:

1. Check the [documentation](./docs)
2. Review [AGENTS.md](./AGENTS.md) for development guidelines
3. Open an issue on GitHub
4. Contact the development team

---

**Note**: This is a PWA designed for modern browsers. For the best experience, use the latest version of Chrome, Firefox, Safari, or Edge.

