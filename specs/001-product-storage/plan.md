# Implementation Plan: Product Storage

**Branch**: `001-product-storage` | **Date**: 2026-01-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-product-storage/spec.md`

## Summary

Migrate the hardcoded products list from `/src/data/products.ts` to Firebase Firestore, enabling persistent storage and CRUD operations. This includes:
1. Initial data migration script to load existing 55 products
2. Firestore service layer for product operations
3. Admin UI for product management (edit name/URL, add new, delete)
4. Update existing app to fetch products from Firestore instead of static file

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Next.js 16.1.1, React 19.2.3, Firebase 12.7.0, Tailwind CSS 4.x
**Storage**: Firebase Firestore (collection: `products`)
**Testing**: Jest (to be configured) + React Testing Library
**Target Platform**: Web (Next.js App Router) - Mobile-first responsive
**Project Type**: Web application (single Next.js project)
**Performance Goals**:
- Product list load < 3 seconds (per SC-003)
- CRUD operations complete in < 2 seconds (per SC-002)
**Constraints**:
- FCP < 1.5s on 4G (Constitution)
- TTI < 3s on 4G (Constitution)
- Bundle size per route < 200KB gzipped (Constitution)
- Dark mode by default (Constitution)
**Scale/Scope**: ~55 products initially, single admin user for management

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Mobile-First Responsive Design | ✅ PASS | Admin UI will be designed mobile-first with proper touch targets |
| II. Dark Mode by Default | ✅ PASS | All new components will use existing Tailwind dark mode classes |
| III. Firebase-Centric Architecture | ✅ PASS | Using Firestore for storage, Firebase Auth for admin access |
| IV. Data Integrity & Price Tracking | ⚪ N/A | This feature does not involve price data |
| V. Clean UI/UX Design | ✅ PASS | Admin UI will follow minimal design with clear hierarchy |
| VI. Extensibility | ✅ PASS | Service layer abstraction enables future integrations |

**Constitution Gate: PASSED** - No violations detected.

## Project Structure

### Documentation (this feature)

```text
specs/001-product-storage/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (Firestore schema)
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── app/                      # Next.js App Router pages
│   ├── admin/                # NEW: Admin pages for product management
│   │   └── products/         # NEW: Product CRUD UI
│   └── page.tsx              # Existing: Main shopping list
├── components/               # React components
│   ├── ProductRow.tsx        # Existing: Product display
│   ├── ProductList.tsx       # Existing: Product list
│   └── admin/                # NEW: Admin-specific components
│       ├── ProductForm.tsx   # NEW: Add/Edit product form
│       └── ProductTable.tsx  # NEW: Admin product table
├── data/
│   └── products.ts           # Existing: Hardcoded products (to be deprecated)
├── hooks/
│   ├── useProductState.ts    # Existing: Product session state
│   └── useAuth.ts            # Existing: Authentication hook
├── lib/
│   └── firebase.ts           # Existing: Firebase initialization
├── services/                 # NEW: Service layer
│   └── productService.ts     # NEW: Firestore CRUD operations
├── types/
│   ├── product.ts            # Existing: Product interfaces
│   └── auth.ts               # Existing: Auth types
└── scripts/                  # NEW: One-time scripts
    └── seedProducts.ts       # NEW: Initial data migration

tests/
├── unit/                     # NEW: Unit tests
│   └── services/
│       └── productService.test.ts
└── integration/              # NEW: Integration tests (future)
```

**Structure Decision**: Single Next.js project following existing conventions. New code organized in:
- `/src/services/` - Data access layer (new pattern for Firestore operations)
- `/src/app/admin/` - Admin routes protected by auth
- `/src/components/admin/` - Admin-specific UI components
- `/src/scripts/` - One-time migration scripts

## Complexity Tracking

> No constitution violations requiring justification.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| N/A | N/A | N/A |
