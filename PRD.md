# Breathing Web App — Product Requirements Document (PRD)

## 1. Introduction
The Breathing Web App is a lightweight, installable Progressive Web App (PWA) that guides users through scientifically-backed breathing exercises using precise timing, smooth HTML/CSS animations, and a clean, accessible interface. The MVP focuses on core breathing presets loaded from JSON configuration files, with a modular architecture designed for future feature expansion including premium offerings.

## 2. Goals and Objectives
- Provide a **free, clean, and distraction-free** breathing tool accessible on web (desktop + mobile)
- Offer **science-informed breathing techniques** with clear explanations and precise timing
- Ensure **modular, testable architecture** for easy feature additions and updates
- Deliver **precision timing synchronization** between animations and breathing phases
- Create a **scalable foundation** for future premium features (statistics, custom techniques, backend integration)
- Load fast on typical mobile networks and work **completely offline after first visit**

## 3. Design and Market References (Inspiration)
- **Paced Breathing App** (primary inspiration): Clean interface, precise timing, multiple breathing patterns
- **Breathwrk** (premium benchmark): 50+ exercises, guided classes, dark mode, subscription model - informs long-term roadmap
- **UI References**: Central breathing animation (orb/circle), large readable typography, preset selection chips, dark/light themes
  - Behance: "Breathe iOS App", "Breathing Techniques Application" 
  - Dribbble: "Becalm - Breathing app", "Breathing exercise - SUZY", "Breathing Exercise UI Design"
  - Figma Community examples for layout patterns

> Design inspiration only - all implementations will be original

## 4. Target Audience
- Individuals seeking stress relief, better focus, or sleep support through breathing exercises
- Beginners who need clear guidance and friction-free onboarding
- Users preferring free alternatives to paid breathing apps
- Future premium users interested in advanced features and personalization

## 5. Technical Architecture & Stack

### 5.1 Core Technology Stack
- **Framework**: Next.js 15 (App Router) + TypeScript (strict)
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **Design Tokens**: TweakCN-exported CSS variables per theme
- **Animation**: HTML/CSS + Web Animations API (modular component for easy replacement)
- **State Management**: React state + localStorage for preferences
- **Data**: JSON configuration files (breathing techniques, content)
- **PWA**: Web App Manifest + Service Worker (planned for MVP; not yet implemented)
- **Testing**: Unit/integration tests (to be added as features land)

### 5.2 Modular Architecture Requirements
- **Breathing Animation Component**: Isolated, replaceable component with standardized props interface
- **JSON Data Layer**: Breathing techniques, explanations, and settings stored in JSON files
- **Feature Flag System**: Easy enabling/disabling of features for testing
- **Component Library**: Consistent, reusable UI components
- **Analytics Module**: Privacy-friendly tracking (optional, toggleable)

### 5.3 Theming Architecture (Implemented)
- **Theme Files**: Each theme lives in `public/themes/<name>.css` with variables in `:root` (and optional `.dark`).
- **Theme Loader**: A `ThemeProvider` injects `<link id="app-theme">` at runtime and persists `app.theme` in localStorage.
- **Color Scheme**: Appearance toggle (Light/Dark/System) applies `html.dark` and `data-color-scheme`; persisted as `app.scheme`.

## 6. MVP Features

### 6.1 Core Features
- **Breathing Techniques** (loaded from JSON):
  - 4-7-8 (Relaxing Breath): Inhale 4s, Hold 7s, Exhale 8s - for relaxation and sleep
  - 5-5-5 (Equal Breathing): 5s each phase - for steady focus and balance  
  - 4-4-4 (Box Breathing): 4s each phase - for calm focus and stress relief
- **Precision Animation**: HTML/CSS orb with scale transforms, synchronized to exact timing (±50ms tolerance)
- **Theme System**: Light/dark mode with system preference detection
- **Theme Switching**: Choose between multiple CSS-variable themes in Settings; previews show theme color swatches
- **Accessibility**: Full keyboard support, screen reader compatible, reduced motion support
- **PWA Functionality**: Installable, complete offline support, app icons (planned)
- **Privacy-Friendly Analytics**: Optional usage tracking (cookieless, GDPR-compliant)

### 6.2 JSON Data Structure
```json
{
  "techniques": [
    {
      "id": "4-7-8",
      "name": "4-7-8 Breathing",
      "description": "Relaxing breath technique",
      "explanation": "Promotes relaxation and better sleep by activating the parasympathetic nervous system.",
      "when_to_use": "Before bed, during stress, or when feeling anxious",
      "phases": {
        "inhale": 4,
        "hold": 7,
        "exhale": 8
      },
      "recommended_cycles": 4,
      "difficulty": "beginner"
    }
  ]
}
```

### 6.3 Animation Specifications
- **Component**: Standalone, replaceable breathing animation component
- **Visual**: Circular orb with gradient background, smooth scaling
- **States**: Exhale (scale: 0.65) → Inhale (scale: 1.0) → Hold (static)
- **Timing**: Driven by Web Animations API for precision
- **Reduced Motion**: Fallback to text-based phase indicators
- **Performance**: Transform-only animations, optimized for 60fps on mid-range devices

## 7. User Stories & Acceptance Criteria

### 7.1 Core User Flow
1. **Select Breathing Technique**
   - *As a user, I can browse and select from available breathing techniques*
   - **AC**: Techniques load from JSON, clear visual selection, keyboard accessible

2. **Follow Precise Animation**
   - *As a user, I can follow the breathing rhythm with perfect timing synchronization*
   - **AC**: Animation phases match JSON timing ±50ms, smooth transitions, no jank on mobile

3. **Learn About Techniques**  
   - *As a user, I can read explanations of when and why to use each technique*
   - **AC**: Clear, jargon-free explanations loaded from JSON, mobile-optimized text

4. **Use Offline**
   - *As a user, I can use the app completely offline after first visit*
   - **AC**: All JSON data, assets cached, full functionality without internet (planned)

5. **Install as PWA**
   - *As a user, I can install the app on my device and use it like a native app*
   - **AC**: Install prompt, standalone mode, proper app icons and splash screens (planned)

6. **Switch Theme and Appearance**
   - *As a user, I can select among multiple visual themes and set light/dark/system*
   - **AC**: Settings page shows theme cards with previews; selected theme applies instantly across the app and persists. Appearance toggle sets light/dark/system, follows OS on System.

7. **Navigate via Drawer**
   - *As a user, I can open a drawer and navigate between Home, Breathing, Settings, and About*
   - **AC**: Drawer opens with smooth animation, traps focus, and closes on outside click or Esc. `/breath` hides the header for immersion.

## 8. Future Features (Post-MVP Roadmap)

### Phase 1: Enhanced Experience
- **Audio System**: Phase transition sounds, optional voice guidance, background soundscapes
- **Session Management**: Timed sessions (1-10 minutes), soft start/end sounds
- **Additional Techniques**: Extended JSON library with more breathing patterns

### Phase 2: Personalization & Progress  
- **User Accounts**: Secure login system, cloud sync
- **Statistics & Streaks**: Practice tracking, personal insights, achievement system
- **Custom Techniques**: User-created breathing patterns (saved to account)

### Phase 3: Premium Features
- **Advanced Programs**: Multi-day courses, guided sessions
- **Social Features**: Breathe with friends, community challenges  
- **Premium Content**: Expert-led classes, specialized soundscapes
- **Monetization**: Freemium model with premium subscriptions

### Phase 4: Advanced Integration
- **Wearable Support**: Apple Watch, Fitbit integration
- **Biometric Feedback**: Heart rate variability, guided adaptation
- **AI Recommendations**: Personalized technique suggestions

## 9. Technical Requirements

### 9.1 Performance Targets
- **First Load**: <2s on 4G (mid-range device)
- **Core Web Vitals**: LCP <2.5s, CLS <0.05, INP <200ms  
- **Bundle Size**: <120KB (gzipped) for MVP
- **Lighthouse Scores**: PWA ≥90, Accessibility ≥95, Performance ≥90

### 9.2 Testing Strategy
- **Unit Tests**: All components, utilities, data parsing
- **Integration Tests**: User flows, PWA functionality, offline behavior
- **E2E Tests**: Complete user journeys, cross-browser compatibility
- **Performance Tests**: Animation smoothness, memory usage, load times
- **Accessibility Tests**: Screen readers, keyboard navigation, color contrast

### 9.3 Browser Support
- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile**: iOS Safari 14+, Android Chrome 90+
- **PWA Features**: Service Worker, Web App Manifest support required

## 10. Content & Accessibility

### 10.1 Content Strategy
- **Language**: Plain language, no medical jargon
- **Tone**: Calm, supportive, encouraging
- **Explanations**: Evidence-based benefits, practical usage guidance
- **Localization**: English first, structured for future i18n support

### 10.2 Accessibility Standards
- **WCAG 2.1 AA Compliance**: Color contrast, text scaling, keyboard navigation
- **Screen Reader Support**: Proper ARIA labels, live regions for phase changes
- **Reduced Motion**: Respects user preferences, alternative text-based indicators
- **Keyboard Navigation**: Full app functionality without mouse/touch

## 11. Privacy & Analytics

### 11.1 Privacy Principles
- **No Personal Data**: All progress stored locally (localStorage)
- **Optional Analytics**: Privacy-friendly usage tracking (can be disabled)
- **No Cookies**: Cookieless analytics implementation
- **Transparent Privacy**: Clear privacy policy, user control over data

### 11.2 Analytics Strategy
- **Privacy-First**: Umami or Plausible for cookieless tracking
- **Metrics**: Page views, session duration, technique usage, PWA install rates
- **User Control**: Easy opt-out, clear data usage explanation

## 12. Risk Assessment & Mitigation

### 12.1 Technical Risks
- **Animation Performance**: Mitigation - Transform-only animations, thorough mobile testing
- **PWA Edge Cases**: Mitigation - Comprehensive testing on iOS Safari, fallback strategies
- **Timing Precision**: Mitigation - Web Animations API with fallbacks, extensive timing tests
- **Offline Reliability**: Mitigation - Robust service worker, comprehensive caching strategy

### 12.2 Product Risks  
- **Feature Creep**: Mitigation - Strict MVP scope, clear roadmap phases
- **User Retention**: Mitigation - Focus on core experience quality, privacy-friendly analytics
- **Competition**: Mitigation - Unique value proposition (free, precise, privacy-focused)

## 13. Success Metrics

## 14. Current Navigation & Routes (Implemented)
- **`/breath`**: Focused breathing screen, full-screen stage, start/stop overlay buttons, header hidden.
- **`/`**: Home placeholder; future onboarding/quick-pick space.
- **`/settings`**: Theme selector and Appearance toggle (Light/Dark/System).
- **`/about`**: Placeholder.

### 13.1 MVP Success Criteria
- **Technical**: All Lighthouse scores ≥90, <2s load time, 100% offline functionality
- **User Experience**: Complete breathing session without confusion, successful PWA installation
- **Quality**: Zero critical bugs, 95%+ accessibility compliance
- **Performance**: Smooth 60fps animations on target devices

### 13.2 Growth Metrics (Post-MVP)
- **Engagement**: Session completion rate, repeat usage, session duration
- **Adoption**: PWA install rate, organic growth, user retention
- **Quality**: User feedback scores, low bounce rate, error rates

## 14. Development Approach

### 14.1 Architecture Principles
- **Modular Design**: Isolated, testable components
- **Configuration-Driven**: JSON-based content and settings
- **Progressive Enhancement**: Core functionality works everywhere
- **Future-Proof**: Easy integration of backend services when needed

### 14.2 Quality Assurance
- **Continuous Testing**: Automated test suite, CI/CD integration
- **Performance Monitoring**: Real-time performance tracking
- **Cross-Browser Testing**: Automated and manual testing across target browsers
- **User Testing**: Regular feedback collection and iteration

---

## Appendices

### Appendix A: JSON Schema Examples
- Detailed schemas for breathing techniques, user preferences, analytics events
- Versioning strategy for configuration files
- Migration strategies for schema updates

### Appendix B: Component Architecture
- Breathing animation component interface
- Audio system component specifications  
- Analytics module implementation details
- Theme system architecture

### Appendix C: PWA Implementation Checklist
- Web App Manifest specifications
- Service Worker caching strategies
- Offline functionality requirements
- Installation prompt implementation
