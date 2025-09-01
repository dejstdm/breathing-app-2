# Breathing Web App

A lightweight, precision-timed Progressive Web App (PWA) for guided breathing exercises. Built with Next.js, TypeScript, Tailwind CSS, and shadcn/ui components.

## Features

- 🫁 **Precision Breathing Techniques**: 4-7-8, 5-5-5, Box Breathing (4-4-4) with ±50ms timing accuracy
- ✨ **Smooth HTML/CSS Animations**: Optimized breathing orb with 60fps performance
- 📱 **Progressive Web App**: Install on any device, works completely offline
- 🎨 **Clean, Accessible Design**: WCAG 2.1 AA compliant with dark/light themes
- 🔧 **Modular Architecture**: JSON-driven configuration, replaceable components
- 🚀 **High Performance**: <2s load time, <120KB bundle size
- 🔒 **Privacy-First**: No tracking, all data stored locally

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **Animations**: HTML/CSS transforms + Web Animations API
- **PWA**: Service Worker + Web App Manifest
- **Testing**: Jest + React Testing Library
- **Analytics**: Privacy-friendly (optional)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd breathing-web-app

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

Open [http://localhost:3000](http://localhost:3000) with your browser to see the app.

The app will auto-reload when you make changes to the code.

### Testing

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run accessibility tests
npm run test:a11y

# Run performance tests
npm run test:perf
```

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
├── app/                    # Next.js app router pages
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── breathing/          # Breathing-specific components
│   │   ├── BreathingAnimation.tsx
│   │   ├── TechniqueSelector.tsx
│   │   └── SessionControls.tsx
│   └── layout/             # Layout components
├── data/
│   ├── breathing-techniques.json
│   ├── content.json
│   └── app-config.json
├── hooks/                  # Custom React hooks
├── utils/                  # Utility functions
├── types/                  # TypeScript definitions
└── tests/                  # Test files

public/
├── icons/                  # PWA icons
├── manifest.json           # Web App Manifest
└── sw.js                   # Service Worker
```

## Configuration

### Adding New Breathing Techniques

Edit `src/data/breathing-techniques.json`:

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

### Environment Variables

Create a `.env.local` file:

```bash
# Optional: Privacy-friendly analytics
NEXT_PUBLIC_ANALYTICS_ENABLED=false
NEXT_PUBLIC_ANALYTICS_URL=your-analytics-url

# Optional: App configuration
NEXT_PUBLIC_APP_VERSION=1.0.0
```

## PWA Features

- **Offline Support**: Complete functionality without internet after first visit
- **Install Prompt**: Custom installation experience
- **App Icons**: Optimized icons for all platforms
- **Splash Screen**: Branded loading experience
- **Background Sync**: Future feature preparation

## Performance Targets

- ✅ First Load: <2s on 4G
- ✅ Lighthouse PWA Score: ≥90
- ✅ Lighthouse Accessibility: ≥95
- ✅ Core Web Vitals: LCP <2.5s, CLS <0.05, INP <200ms
- ✅ Bundle Size: <120KB gzipped

## Accessibility

- Full keyboard navigation support
- Screen reader compatible with ARIA labels
- High contrast mode support
- Respects `prefers-reduced-motion`
- Color contrast ratios meet WCAG 2.1 AA standards
- Text scaling up to 200% zoom

## Browser Support

- Chrome 90+
- Firefox 88+ 
- Safari 14+
- Edge 90+
- iOS Safari 14+
- Android Chrome 90+

## Development Guidelines

Please read [AGENTS.md](./AGENTS.md) for detailed development rules and architectural guidelines.

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