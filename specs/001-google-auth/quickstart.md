# Quickstart: Google Authentication via Firebase

**Feature Branch**: `001-google-auth`
**Created**: 2026-01-10

## Prerequisites

Before implementing this feature, ensure:

1. **Firebase Project**: You have access to a Firebase project (create one at [Firebase Console](https://console.firebase.google.com))
2. **Google Sign-In Provider**: Enabled in Firebase Console > Authentication > Sign-in method
3. **Authorized Domains**: `localhost` and your production domain added in Firebase Console > Authentication > Settings > Authorized domains

## Environment Setup

Create or update `.env.local` with Firebase configuration:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Allowlist Configuration (comma-separated emails)
NEXT_PUBLIC_ALLOWED_EMAILS=90joelmarquez@gmail.com
```

> ⚠️ **Important**: Never commit `.env.local` to version control. Ensure it's in `.gitignore`.

## Installation

```bash
npm install firebase
```

## Implementation Order

Follow these steps in order:

### Step 1: Firebase Initialization

Create `src/lib/firebase.ts` to initialize Firebase.

### Step 2: Auth Types

Create `src/types/auth.ts` with type definitions from `contracts/auth-context.ts`.

### Step 3: Auth Provider

Create `src/components/auth/AuthProvider.tsx` implementing the `AuthContextValue` interface.

### Step 4: Auth Hook

Create `src/hooks/useAuth.ts` to expose auth context.

### Step 5: Login Page

Create `src/app/login/page.tsx` with the sign-in button.

### Step 6: Protected Route

Create `src/components/auth/ProtectedRoute.tsx` to wrap protected content.

### Step 7: User Menu

Create `src/components/auth/UserMenu.tsx` to show user info and sign-out.

### Step 8: Integration

Update `src/app/layout.tsx` to wrap app with AuthProvider.
Update `src/app/page.tsx` to use ProtectedRoute.

## Testing Checklist

After implementation, verify:

- [ ] Visiting `/` while not signed in redirects to `/login`
- [ ] Clicking "Sign in with Google" opens Google account selector
- [ ] Signing in with `90joelmarquez@gmail.com` grants access
- [ ] Signing in with any other email shows "Access denied" message
- [ ] Refreshing the page maintains auth state
- [ ] Clicking "Sign out" returns to login screen
- [ ] After sign out, visiting `/` redirects to `/login`

## File Structure After Implementation

```
src/
├── app/
│   ├── layout.tsx          # Updated: wrap with AuthProvider
│   ├── page.tsx            # Updated: use ProtectedRoute
│   └── login/
│       └── page.tsx        # New: login page
├── components/
│   └── auth/
│       ├── AuthProvider.tsx    # New
│       ├── LoginButton.tsx     # New
│       ├── UserMenu.tsx        # New
│       └── ProtectedRoute.tsx  # New
├── hooks/
│   └── useAuth.ts          # New
├── types/
│   └── auth.ts             # New
└── lib/
    └── firebase.ts         # New
```

## Common Issues

### Popup Blocked

If the browser blocks the popup:
- Ensure the sign-in button is triggered by a user click (not programmatically)
- Guide users to allow popups for your domain

### Firebase Config Errors

If you see "Firebase: Error (auth/invalid-api-key)":
- Verify all `NEXT_PUBLIC_FIREBASE_*` variables are set correctly
- Restart the dev server after changing `.env.local`

### Unauthorized Domain

If Google Sign-In fails with domain error:
- Add your domain to authorized domains in Firebase Console
- For local development, ensure `localhost` is authorized

## Next Steps

After completing this feature:

1. Run `/speckit.tasks` to generate the implementation task list
2. Consider adding E2E tests for auth flows
3. Plan the next feature: per-user data persistence with Firestore
