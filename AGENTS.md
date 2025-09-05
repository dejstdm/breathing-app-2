# AGENTS.md - AI Development Rules

## Project Overview
This is a Breathing Web App PWA built with Next.js, TypeScript, Tailwind CSS, and shadcn/ui. The app provides guided breathing exercises with precise timing and smooth animations, and it must be installable with complete offline functionality and a branded splash screen.

## Core Development Principles

### 1. Architecture Requirements
- **Modular Design**: Every component must be isolated, testable, and replaceable
- **Configuration-Driven**: Use JSON files for breathing techniques, content, and settings
- **Progressive Web App**: Complete offline functionality after first visit
- **Future-Proof**: Design for easy backend integration and premium feature additions
- **No External Dependencies**: Avoid unnecessary libraries; prefer native web APIs

### 2. Code Quality Standards
- **TypeScript Strict Mode**: All code must be fully typed
- **Component Isolation**: Each component should be self-contained with clear props interface
- **Error Boundaries**: Implement proper error handling at component and app levels
- **Performance First**: Optimize for 60fps animations on mid-range mobile devices
- **Testing Required**: Unit tests for all utilities, integration tests for user flows

### 3. File Structure & Organization
```
src/
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── breathing/          # Breathing-specific components
│   │   ├── BreathingAnimation.tsx  # Replaceable animation component
│   │   ├── TechniqueSelector.tsx
│   │   └── SessionControls.tsx
│   └── layout/             # Layout components
├── data/
│   ├── breathing-techniques.json
│   ├── content.json
│   └── app-config.json
├── hooks/                  # Custom React hooks
├── utils/                  # Pure utility functions
├── types/                  # TypeScript type definitions
└── tests/                  # Test files
```

### 4. Breathing Animation Requirements
- **Component Name**: `BreathingAnimation.tsx`
- **Timing Precision**: ±50ms tolerance for phase synchronization
- **Animation Method**: HTML/CSS transforms + Web Animations API only
- **Replaceable Interface**: Standardized props for easy future replacement with Lottie
- **Reduced Motion**: Respect `prefers-reduced-motion` with fallback indicators
- **Performance**: Transform-only animations, no heavy effects

```typescript
interface BreathingAnimationProps {
  technique: BreathingTechnique;
  isActive: boolean;
  currentPhase: 'inhale' | 'hold' | 'exhale';
  onPhaseChange?: (phase: string) => void;
}
```

### 5. Data Management Rules
- **JSON Configuration**: All breathing techniques, content, and settings in JSON files
- **Local Storage**: Use for user preferences (theme, last technique, settings)
- **No Backend Dependencies**: MVP must work completely without server
- **Data Validation**: Validate all JSON data with TypeScript interfaces
- **Versioning**: Include version fields in JSON files for future migrations

### 6. PWA Implementation Requirements
- **Mandatory for MVP**: Installable app, complete offline functionality after first visit, and branded splash screen.
- **Complete Offline**: All functionality must work offline after first visit
- **Service Worker**: Cache all assets, JSON files, and app shell
- **App Manifest**: Proper icons, theme colors, standalone display
- **Installation**: Implement custom install prompt
- **Update Strategy**: Handle service worker updates gracefully

### 7. Accessibility Standards (WCAG 2.1 AA)
- **Keyboard Navigation**: Full app functionality without mouse/touch
- **Screen Readers**: Proper ARIA labels, live regions for phase announcements
- **Color Contrast**: Minimum 4.5:1 ratio for normal text, 3:1 for large text
- **Text Scaling**: Support up to 200% zoom without horizontal scrolling
- **Reduced Motion**: Alternative experience for motion-sensitive users

### 8. Performance Targets
- **First Load**: <2s on 4G mid-range device
- **Bundle Size**: <120KB gzipped for initial load
- **Core Web Vitals**: LCP <2.5s, CLS <0.05, INP <200ms
- **Animation**: Consistent 60fps, no jank on mobile
- **Memory**: Minimal memory leaks, efficient component mounting/unmounting

### 9. Testing Strategy
- **Unit Tests**: Jest + React Testing Library for all components
- **Integration Tests**: User flows, PWA functionality, offline behavior
- **Performance Tests**: Lighthouse CI, animation frame rate monitoring
- **Accessibility Tests**: axe-core integration, manual screen reader testing
- **Cross-Browser**: Chrome, Firefox, Safari, Edge on desktop and mobile

### 10. Styling Guidelines
- **Tailwind CSS**: Use utility classes, avoid custom CSS when possible
- **shadcn/ui**: Prefer existing components, customize via CSS variables
- **Responsive Design**: Mobile-first approach with container queries
- **Dark Mode**: System preference detection with manual toggle
- **Component Variants**: Use cva (class-variance-authority) for component variants

### 10.1 Design System & Theming
- **Theme Files**: Place TweakCN-exported CSS variables in `public/themes/<theme>.css` under `:root` and optional `.dark`.
- **Theme Manifest (SSOT)**: Maintain `public/themes/manifest.json` as the single source of truth for theme list, default, and labels (no color data; colors come from the CSS files).
- **Theme Loader**: `ThemeProvider` injects `<link id="app-theme">` for the active theme and updates it at runtime.
- **Color Scheme**: Light/Dark/System toggle applies `html.dark` and `data-color-scheme` for targeting; follows OS on System.
- **BEM Classes**: Use BEM-style classes for identification only (e.g., `app-shell__header`, `breath__start`). Styling remains Tailwind-first.

### 11. State Management
- **React State**: Use useState, useReducer for component state
- **Custom Hooks**: Extract complex state logic into reusable hooks
- **Local Storage**: Wrap in custom hooks with error handling
- **No Global State**: Avoid Redux, Zustand until actually needed
- **Effect Management**: Proper cleanup in useEffect hooks
- **Theme State**: Persist `app.theme` (theme CSS file) and `app.scheme` (light/dark/system) in localStorage.

### 12. Error Handling
- **Error Boundaries**: Catch React errors gracefully
- **API Errors**: Handle JSON loading failures with fallbacks
- **User Feedback**: Clear error messages, no technical jargon
- **Logging**: Console errors for development, optional analytics for production
- **Graceful Degradation**: App should work even if some features fail

### 13. Security Considerations
- **Content Security Policy**: Implement strict CSP headers
- **No Inline Scripts**: Avoid inline JavaScript and CSS
- **Sanitization**: Sanitize any user inputs (future features)
- **HTTPS Only**: Enforce HTTPS in production
- **Privacy**: No tracking without explicit user consent

### 14. Development Workflow
- **Incremental Development**: Build features one at a time, test thoroughly
- **Component-First**: Build UI components before integrating
- **Mock Data**: Use realistic mock data during development
- **Hot Reload**: Ensure changes reflect immediately in development
- **TypeScript Checking**: Fix all TypeScript errors before proceeding
- **Incremental UI Preview**: Prefer small changes visible in the browser after each step to enable rapid visual feedback.

### 15. Documentation Requirements
- **Component Documentation**: JSDoc comments for all public interfaces
- **README**: Setup, development, and deployment instructions
- **API Documentation**: Document all utility functions and hooks
- **Testing Guide**: How to run tests, add new tests
- **Deployment Guide**: PWA deployment checklist

### 16. Future-Proofing Guidelines
- **Backend Ready**: Design data layer for easy API integration
- **Feature Flags**: Implement feature toggle system
- **Analytics Ready**: Prepare for privacy-friendly analytics integration
- **Internationalization**: Structure for future i18n support
- **Premium Features**: Design for future paid feature integration

## Specific Implementation Rules

### JSON Data Validation
```typescript
interface BreathingTechnique {
  id: string;
  name: string;
  description: string;
  explanation: string;
  when_to_use: string;
  phases: {
    inhale: number;
    hold: number;
    exhale: number;
  };
  recommended_cycles: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}
```

### Component Naming Conventions
- **Components**: PascalCase (e.g., `BreathingAnimation`)
- **Files**: kebab-case for utilities, PascalCase for components
- **Props**: camelCase with descriptive names
- **Types**: PascalCase with descriptive suffixes (e.g., `BreathingTechniqueData`)

### Git Commit Guidelines
- **feat**: New features
- **fix**: Bug fixes
- **perf**: Performance improvements
- **test**: Adding or updating tests
- **docs**: Documentation updates
- **refactor**: Code refactoring without feature changes

## AI Assistant Instructions
1. Always reference this AGENTS.md file for consistency
2. Ask for clarification if requirements conflict
3. Prioritize user experience and performance
4. Suggest improvements while maintaining scope
5. Flag potential issues early in development
6. Ensure all code is production-ready and tested
7. Keep environment docs in sync: whenever adding or changing an env var, update both `README.md` (Environment Variables section) and `.env.example` accordingly. Public variables must be prefixed with `NEXT_PUBLIC_`.

## Current Routing Decisions (as implemented)
- **Breathing Screen**: Dedicated route at `/breath` for a focused, full-screen animation (header hidden; start/stop overlay controls).
- **Navigation**: Modal drawer with links to Home (`/`), Breathing (`/breath`), Settings (`/settings`), About (`/about`).
- **Settings**: Includes Theme selector and Appearance (Light/Dark/System) toggle.

## Implemented UI Building Blocks
- `src/components/layout/AppShell.tsx` — app bar + drawer (BEM: `app-shell`)
- `src/components/layout/ThemeProvider.tsx` — runtime theme and color-scheme loader
- `src/app/breath/page.tsx` — dedicated breathing screen (BEM: `breath`)
- `src/app/settings/ThemeSelector.tsx` — theme cards with previews (BEM: `theme-selector`)
- `src/app/settings/ColorSchemeToggle.tsx` — light/dark/system segmented control (BEM: `color-scheme-toggle`)
- Theme CSS files in `public/themes/`
