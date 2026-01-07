<!--
  SYNC IMPACT REPORT
  ====================
  Version change: N/A (initial) → 1.0.0

  Modified principles: N/A (initial constitution)

  Added sections:
    - Principle I: Mobile-First Responsive Design
    - Principle II: Dark Mode by Default
    - Principle III: Firebase-Centric Architecture
    - Principle IV: Data Integrity & Price Tracking
    - Principle V: Clean UI/UX Design
    - Principle VI: Extensibility for Future Integrations
    - Section: Technical Stack & Constraints
    - Section: Development Workflow
    - Section: Governance

  Removed sections: N/A (initial constitution)

  Templates requiring updates:
    - .specify/templates/plan-template.md ✅ (compatible - no updates needed)
    - .specify/templates/spec-template.md ✅ (compatible - no updates needed)
    - .specify/templates/tasks-template.md ✅ (compatible - no updates needed)
    - .specify/templates/checklist-template.md ✅ (compatible - no updates needed)
    - .specify/templates/agent-file-template.md ✅ (compatible - no updates needed)

  Follow-up TODOs: None
-->

# Shopping List Constitution

## Core Principles

### I. Mobile-First Responsive Design

All UI components MUST be designed mobile-first and scale responsively to desktop viewports.
Every feature MUST be fully functional on both mobile devices and desktop browsers without
degraded experience on either platform.

- Breakpoints MUST follow a consistent system (e.g., sm/md/lg/xl)
- Touch targets MUST meet minimum size requirements (44x44px)
- Layouts MUST adapt gracefully without horizontal scrolling
- Critical actions MUST be accessible with one hand on mobile

**Rationale**: Users will primarily interact with shopping lists on mobile devices while shopping,
but may plan and review on desktop. Equal functionality across devices is non-negotiable.

### II. Dark Mode by Default

The application MUST default to dark mode with an optional light mode toggle.
All color tokens MUST be defined as CSS variables supporting both themes.

- Dark mode MUST be the initial experience for new users
- Theme preference MUST persist across sessions (localStorage/Firestore)
- Color contrast MUST meet WCAG AA standards in both modes
- All UI components MUST be designed and tested in dark mode first

**Rationale**: Dark mode reduces eye strain during extended use, saves battery on OLED devices,
and aligns with modern design expectations. Designing dark-first ensures consistent quality.

### III. Firebase-Centric Architecture

All authentication MUST use Firebase Auth. All persistent data MUST use Firestore Database.
The architecture MUST leverage Firebase's real-time capabilities where appropriate.

- Authentication MUST support email/password at minimum
- Firestore security rules MUST enforce user data isolation
- Offline support SHOULD be enabled for core list functionality
- All database operations MUST be abstracted through service layers

**Rationale**: Firebase provides a unified backend platform that handles auth, database, and
hosting, reducing infrastructure complexity and enabling rapid development.

### IV. Data Integrity & Price Tracking

Price data MUST be stored with full historical context for inflation tracking.
Receipt uploads MUST be processed to extract and validate price information.

- Each price entry MUST include: item identifier, price value, currency, date, source (manual/receipt)
- Price history MUST be queryable by item and date range
- Receipt parsing SHOULD use structured extraction (OCR + AI analysis)
- Currency MUST default to ARS (Argentine Peso) with future multi-currency consideration

**Rationale**: The core value proposition includes inflation tracking and price history analysis.
Accurate, timestamped price data is essential for meaningful insights.

### V. Clean UI/UX Design

All interfaces MUST follow clean design principles: minimal visual noise, clear hierarchy,
and purposeful use of whitespace. The design MUST feel modern and uncluttered.

- Typography MUST use a maximum of 2 font families
- Color palette MUST be limited (primary, secondary, accent, semantic colors)
- Animations MUST be subtle and purposeful (max 300ms for UI transitions)
- Empty states and loading states MUST be designed, not overlooked
- Error messages MUST be user-friendly and actionable

**Rationale**: Users interact with shopping lists in distracting environments (stores).
A clean interface reduces cognitive load and improves task completion.

### VI. Extensibility for Future Integrations

The architecture MUST support future MCP (Model Context Protocol) integration for
automated shopping capabilities without requiring core refactoring.

- API endpoints SHOULD be designed RESTfully with clear contracts
- Shopping list data structures MUST be exportable in standard formats
- Integration points MUST be abstracted through adapter patterns
- Feature flags SHOULD be used for experimental integrations

**Rationale**: Future automated shopping integration is a stated goal. Designing for
extensibility now prevents costly rewrites later.

## Technical Stack & Constraints

### Mandatory Technologies

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js | 14+ (App Router) |
| Language | TypeScript | 5.x (strict mode) |
| Auth | Firebase Auth | Latest |
| Database | Firestore | Latest |
| Styling | Tailwind CSS | 3.x |
| Hosting | Vercel or Firebase Hosting | - |

### Code Quality Standards

- TypeScript strict mode MUST be enabled (`"strict": true`)
- ESLint MUST be configured with recommended rules
- All components MUST be typed (no `any` types without justification)
- Firestore collections MUST have TypeScript interfaces

### Performance Constraints

- First Contentful Paint (FCP) MUST be < 1.5s on 4G
- Time to Interactive (TTI) MUST be < 3s on 4G
- Bundle size per route SHOULD be < 200KB (gzipped)
- Images MUST use next/image for optimization

## Development Workflow

### Branch Strategy

- `main`: Production-ready code
- `develop`: Integration branch
- `feature/*`: New functionality
- `fix/*`: Bug fixes

### Code Review Requirements

- All PRs MUST pass linting and type checks
- All PRs MUST be reviewed before merge
- Firestore security rules changes require explicit review
- UI changes MUST include dark mode screenshots

### Testing Expectations

- Unit tests for utility functions and services
- Component tests for complex UI logic
- E2E tests for critical user flows (optional but recommended)

## Governance

This constitution defines the non-negotiable principles for the Shopping List project.
All implementation decisions MUST align with these principles.

### Amendment Process

1. Propose amendment with rationale
2. Document impact on existing code
3. Update constitution with new version
4. Update affected templates if needed

### Versioning Policy

- MAJOR: Principle removal or fundamental redefinition
- MINOR: New principle added or significant expansion
- PATCH: Clarifications, typo fixes, non-semantic changes

### Compliance

- All PRs MUST verify alignment with Core Principles
- Deviations MUST be documented in Complexity Tracking (see plan-template.md)
- Periodic reviews SHOULD assess continued relevance of principles

**Version**: 1.0.0 | **Ratified**: 2026-01-06 | **Last Amended**: 2026-01-06
