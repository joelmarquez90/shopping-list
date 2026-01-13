# Quickstart: Product Storage

**Feature**: 001-product-storage
**Date**: 2026-01-13

## Prerequisites

1. Node.js 18+ installed
2. Firebase project configured (existing setup from `001-google-auth`)
3. Firestore enabled in Firebase Console
4. Environment variables set in `.env.local`

## Setup Steps

### 1. Enable Firestore

If not already enabled:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Navigate to Firestore Database
4. Click "Create database"
5. Choose "Start in test mode" (we'll add rules later)
6. Select a location (recommend `us-central` or nearest)

### 2. Update Firebase Configuration

Add Firestore to the existing Firebase initialization:

```typescript
// src/lib/firebase.ts
import { getFirestore, Firestore } from 'firebase/firestore'

// ... existing code ...

let db: Firestore | null = null
db = getFirestore(app)

export { auth, db }
```

### 3. Deploy Security Rules

Deploy the Firestore security rules from `/specs/001-product-storage/contracts/firestore.rules`:

```bash
# Install Firebase CLI if not already installed
npm install -g firebase-tools

# Login and initialize (if not done)
firebase login
firebase init firestore

# Copy the rules file
cp specs/001-product-storage/contracts/firestore.rules firestore.rules

# Deploy rules
firebase deploy --only firestore:rules
```

### 4. Run Initial Data Migration

After implementing the seed script:

```bash
# Run the migration script
npx ts-node src/scripts/seedProducts.ts
```

Expected output:
```
Starting product migration...
Found 55 products to migrate
Migrating batch 1/1 (55 products)...
Migration complete: 55 products seeded
```

### 5. Verify Migration

Check products in Firebase Console:

1. Go to Firestore Database
2. Navigate to `products` collection
3. Verify 55 documents exist
4. Spot-check a few documents for correct data

## Development Workflow

### Running the Application

```bash
npm run dev
```

The app should now:
- Load products from Firestore instead of static file
- Display all 55 products on the main page
- Allow admin users to access `/admin/products`

### Testing Product Service

```bash
npm test -- --grep "productService"
```

### Common Issues

**Issue: "Missing or insufficient permissions"**
- Cause: Firestore security rules blocking access
- Fix: Ensure rules are deployed and user is authenticated for write operations

**Issue: "FirebaseError: No Firebase App '[DEFAULT]'"**
- Cause: Firebase not initialized before Firestore access
- Fix: Ensure `src/lib/firebase.ts` is imported before any Firestore operations

**Issue: Products not loading**
- Check browser console for errors
- Verify Firestore is enabled in Firebase Console
- Check network tab for Firestore requests

## Quick Reference

| File | Purpose |
|------|---------|
| `src/lib/firebase.ts` | Firebase initialization |
| `src/services/productService.ts` | Firestore CRUD operations |
| `src/hooks/useProducts.ts` | React hook for product data |
| `src/scripts/seedProducts.ts` | One-time migration script |
| `src/app/admin/products/page.tsx` | Admin product management UI |

## Next Steps

After completing basic setup:

1. [ ] Implement `productService.ts` following contracts
2. [ ] Create `useProducts` hook for React components
3. [ ] Update main app to use Firestore data
4. [ ] Build admin UI for CRUD operations
5. [ ] Run migration script in production
