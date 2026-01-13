# Implementation Plan: Google Authentication via Firebase

**Branch**: `001-google-auth` | **Date**: 2026-01-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-google-auth/spec.md`

## Summary

Add Google Sign-In authentication using Firebase Authentication to restrict application access to a single authorized user (90joelmarquez@gmail.com). The application currently has no authentication; after implementation, all users must sign in with Google before accessing any functionality. Unauthorized Google accounts will be rejected with a clear error message.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Next.js 16.1.1, React 19.2.3, Firebase Auth (to be added), Tailwind CSS 4.x
**Storage**: N/A for this feature (authentication state managed by Firebase; no Firestore needed for MVP auth)
**Testing**: ESLint (existing), manual testing for auth flows
**Target Platform**: Web (mobile-first responsive, desktop compatible)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: FCP < 1.5s, TTI < 3s (per constitution)
**Constraints**: Bundle size per route < 200KB gzipped
**Scale/Scope**: Single authorized user (90joelmarquez@gmail.com)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Responsive Design | ✅ PASS | Login page and auth UI will be mobile-first |
| II. Dark Mode by Default | ✅ PASS | Login page will use dark mode with existing Tailwind theme |
| III. Firebase-Centric Architecture | ✅ PASS | Using Firebase Auth as required by constitution |
| IV. Data Integrity & Price Tracking | N/A | This feature does not involve price data |
| V. Clean UI/UX Design | ✅ PASS | Simple, clean login UI with clear error states |
| VI. Extensibility | ✅ PASS | Auth service abstracted, allowlist configurable |

**Constitution Deviation**: The constitution states "Authentication MUST support email/password at minimum" but this feature implements Google Sign-In only per user requirement. This is an intentional deviation documented in Complexity Tracking below.

## Project Structure

### Documentation (this feature)

```text
specs/001-google-auth/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── layout.tsx       # Root layout (add auth provider)
│   ├── page.tsx         # Shopping list (protected)
│   └── login/
│       └── page.tsx     # Login page (new)
├── components/
│   ├── FilterBar.tsx
│   ├── ProductList.tsx
│   ├── ProductRow.tsx
│   └── auth/            # New auth components
│       ├── AuthProvider.tsx
│       ├── LoginButton.tsx
│       ├── UserMenu.tsx
│       └── ProtectedRoute.tsx
├── data/
│   └── products.ts
├── hooks/
│   ├── useProductState.ts
│   └── useAuth.ts       # New auth hook
├── types/
│   ├── product.ts
│   └── auth.ts          # New auth types
└── lib/
    └── firebase.ts      # Firebase initialization (new)

tests/                   # Future: e2e tests for auth flows
```

**Structure Decision**: Single web application using existing Next.js App Router structure. New authentication code organized under `src/components/auth/`, `src/hooks/useAuth.ts`, `src/types/auth.ts`, and `src/lib/firebase.ts`.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Google Sign-In only (no email/password) | User explicitly requested single auth method with Google | Email/password adds complexity; user already has Google account; simplifies onboarding for single-user use case |

