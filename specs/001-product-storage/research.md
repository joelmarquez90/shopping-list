# Research: Product Storage

**Date**: 2026-01-13
**Feature**: 001-product-storage
**Status**: Complete

## Research Tasks

### 1. Firestore Collection Design for Products

**Question**: What is the optimal Firestore collection structure for product data?

**Decision**: Use a flat `products` collection with document IDs matching product slugs.

**Rationale**:
- Simple flat structure is sufficient for ~55 products with no complex relationships
- Using product slug as document ID enables efficient single-document lookups
- No subcollections needed since we're only storing product metadata, not price history
- Firestore's built-in indexing handles queries on any field automatically

**Alternatives Considered**:
- **Auto-generated document IDs**: Rejected because we want stable, predictable IDs that match existing product slugs for backwards compatibility
- **Nested structure (categories → products)**: Rejected as over-engineering for current scope of ~55 products without category filtering requirements

### 2. Firestore CRUD Operations Best Practices

**Question**: How should we structure Firestore read/write operations for optimal performance?

**Decision**: Create a service layer with async functions using Firebase SDK v9+ modular syntax.

**Rationale**:
- Firebase SDK v12 (current) uses modular imports for tree-shaking
- Service layer provides abstraction from Firestore specifics
- Async/await pattern integrates well with React hooks

**Best Practices Applied**:
```typescript
// Use modular imports (tree-shakeable)
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc } from 'firebase/firestore'

// Batch writes for initial seed (more efficient)
import { writeBatch } from 'firebase/firestore'
```

**Alternatives Considered**:
- **Direct Firestore calls in components**: Rejected for violating separation of concerns
- **RTK Query or React Query**: Rejected as over-engineering for simple CRUD with ~55 items

### 3. Data Migration Strategy

**Question**: How should we migrate existing hardcoded products to Firestore?

**Decision**: Create a one-time Node.js script executable via `npx ts-node` that:
1. Reads products from `src/data/products.ts`
2. Uses Firestore batch writes to insert all products
3. Handles duplicates by checking existing documents first (upsert logic)

**Rationale**:
- Batch writes are atomic and more efficient than individual writes
- Script can be run from admin's local machine with Firebase credentials
- Upsert logic allows safe re-runs if interrupted

**Implementation Notes**:
- Firestore batch limit is 500 operations (sufficient for 55 products)
- Script will use `setDoc` with merge option for upsert behavior
- Progress logging for visibility during migration

**Alternatives Considered**:
- **Firebase Console manual import**: Rejected due to tedious manual data entry
- **Cloud Function trigger**: Rejected as over-engineering for one-time operation
- **Admin UI import button**: Rejected as unnecessary complexity

### 4. Admin Access Control

**Question**: How should we restrict product management to administrators?

**Decision**: Use Firebase Auth email verification combined with Firestore Security Rules.

**Rationale**:
- Project already has Firebase Auth configured
- Security rules provide server-side enforcement
- Simple admin check: match against hardcoded admin email(s) in rules

**Security Rules Pattern**:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Products collection
    match /products/{productId} {
      // Anyone can read products
      allow read: if true;

      // Only authenticated admins can write
      allow write: if request.auth != null
                   && request.auth.token.email in ['admin@example.com'];
    }
  }
}
```

**Alternatives Considered**:
- **Custom claims for admin role**: More robust but requires Firebase Admin SDK setup; deferred for future enhancement
- **Client-side only checks**: Rejected as insecure

### 5. Real-time vs On-demand Fetching

**Question**: Should product list use real-time listeners or on-demand fetching?

**Decision**: Use on-demand fetching with `getDocs()` for initial load.

**Rationale**:
- Product catalog changes infrequently (admin updates only)
- Real-time listeners add complexity and connection overhead
- On-demand fetch is simpler and sufficient for current needs
- Can add real-time listening later if needed (e.g., for admin UI showing live updates)

**Alternatives Considered**:
- **onSnapshot real-time listener**: Rejected as unnecessary for slow-changing catalog data
- **Server-side rendering (SSR)**: Consider for future SEO needs, but not required for authenticated shopping list app

### 6. Error Handling and Offline Support

**Question**: How should we handle Firestore errors and offline scenarios?

**Decision**: Implement graceful degradation with error states in UI.

**Rationale**:
- Constitution requires offline support "SHOULD be enabled"
- Firestore SDK has built-in offline persistence
- UI should show clear error states when operations fail

**Implementation**:
- Enable Firestore offline persistence (enabled by default in web SDK)
- Service layer returns typed results with error information
- UI components display appropriate error messages
- Fallback to cached data when network unavailable

## Research Summary

| Topic | Decision | Impact |
|-------|----------|--------|
| Collection structure | Flat `products` with slug as doc ID | Simple, efficient |
| CRUD operations | Service layer with modular SDK | Clean architecture |
| Data migration | One-time script with batch writes | Safe, re-runnable |
| Access control | Firebase Auth + Security Rules | Server-enforced |
| Data fetching | On-demand with getDocs() | Simple, sufficient |
| Error handling | Graceful degradation | Good UX |

## Open Items

None - all research questions resolved.
