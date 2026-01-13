# Research: Google Authentication via Firebase

**Feature Branch**: `001-google-auth`
**Research Date**: 2026-01-10
**Status**: Complete

## Research Topics

### 1. Firebase Auth Integration with Next.js App Router

**Decision**: Use Firebase client-side SDK with `signInWithPopup` for Google Sign-In, wrapped in a React Context for global auth state management.

**Rationale**:
- `signInWithPopup` is the simplest approach for desktop browsers and works on Vercel deployments
- Mobile compatibility issues with `signInWithPopup` can be addressed with `signInWithRedirect` fallback if needed
- Client-side authentication is sufficient for this MVP (no server-side token validation required)
- React Context pattern is the standard approach for sharing auth state across Next.js App Router

**Alternatives Considered**:
| Alternative | Why Rejected |
|-------------|--------------|
| `signInWithRedirect` only | Requires Firebase Hosting or complex proxy setup for cross-browser compatibility |
| Server-side auth with cookies | Over-engineering for single-user MVP; adds complexity without clear benefit |
| next-firebase-auth package | Additional dependency; not needed for simple Google-only auth |
| Clerk/Auth0/NextAuth | External services add complexity; Firebase already in tech stack |

**Sources**:
- [Firebase Official: Authenticate Using Google with JavaScript](https://firebase.google.com/docs/auth/web/google-signin)
- [Firebase Official: Best practices for signInWithRedirect](https://firebase.google.com/docs/auth/web/redirect-best-practices)

---

### 2. Email Allowlist Enforcement

**Decision**: Implement client-side email validation immediately after successful Google OAuth, before granting app access. If email is not in allowlist, sign out the user and show error.

**Rationale**:
- Simple and effective for single-user restriction
- No server-side infrastructure required
- Allowlist stored in environment variable for easy configuration
- Firebase Auth handles all OAuth complexity; we only validate the resulting email

**Alternatives Considered**:
| Alternative | Why Rejected |
|-------------|--------------|
| Firebase Security Rules | Cannot restrict auth by email without Firestore; overkill for auth-only feature |
| Firebase Functions | Server-side overhead; not needed for client-side validation |
| Middleware validation | Middleware cannot access Firebase auth state directly |

**Implementation Pattern**:
```typescript
// After successful signInWithPopup
const user = result.user;
if (!ALLOWED_EMAILS.includes(user.email)) {
  await signOut(auth);
  throw new Error('Access denied: Unauthorized email');
}
```

---

### 3. Protected Routes in Next.js App Router

**Decision**: Use client-side route protection with `useAuth` hook and loading states. Redirect unauthenticated users to `/login` page.

**Rationale**:
- App Router supports client components for auth state management
- Simple redirect logic in layout or page components
- Loading states prevent flash of unauthorized content
- No middleware complexity needed for single-page protection

**Alternatives Considered**:
| Alternative | Why Rejected |
|-------------|--------------|
| Next.js Middleware | Cannot access client-side Firebase auth state; would require server-side sessions |
| Server Actions for auth check | Over-engineering; Firebase handles auth state persistence |
| Per-page auth wrapper HOC | React Context approach is cleaner with hooks |

**Implementation Pattern**:
```typescript
// In protected page
const { user, loading } = useAuth();

if (loading) return <LoadingSpinner />;
if (!user) {
  redirect('/login');
  return null;
}
```

---

### 4. Session Persistence

**Decision**: Use Firebase's default persistence (`browserLocalPersistence`) to maintain auth state across page refreshes and browser sessions.

**Rationale**:
- Firebase handles all token refresh and session management automatically
- `onAuthStateChanged` listener detects session state on page load
- No custom cookie or storage management needed
- Works seamlessly with React Context pattern

**Implementation Pattern**:
```typescript
// In AuthProvider
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user && ALLOWED_EMAILS.includes(user.email)) {
      setUser(user);
    } else {
      setUser(null);
    }
    setLoading(false);
  });
  return () => unsubscribe();
}, []);
```

---

### 5. Error Handling

**Decision**: Provide user-friendly error messages for common scenarios: popup closed, network error, unauthorized email.

**Rationale**:
- Firebase errors are developer-friendly but not user-friendly
- Custom error messages improve UX
- Error states should guide user to resolution

**Error Scenarios**:
| Firebase Error Code | User Message |
|---------------------|--------------|
| `auth/popup-closed-by-user` | "Sign-in was cancelled. Please try again." |
| `auth/network-request-failed` | "Network error. Please check your connection and try again." |
| `auth/popup-blocked` | "Pop-up was blocked. Please allow pop-ups for this site." |
| Custom: unauthorized email | "Access denied. This application is restricted to authorized users only." |

---

## Security Considerations

1. **CVE-2025-29927**: Ensure Next.js version is patched (current: 16.1.1 is safe)
2. **Client-side validation**: While email allowlist is checked client-side, this is acceptable for this use case because:
   - No sensitive server-side resources to protect
   - Firebase Auth tokens are still required for any future Firestore access
   - UI access restriction is the primary goal
3. **Environment variables**: Firebase config and allowlist should be in `.env.local` (not committed to repo)

## Dependencies to Add

```json
{
  "firebase": "^10.x"
}
```

No additional packages required. Firebase SDK includes all necessary auth functionality.

## Firebase Project Configuration Required

1. Create Firebase project (or use existing)
2. Enable Google Sign-In provider in Firebase Console
3. Add authorized domains (localhost, production domain)
4. Obtain Firebase config values for environment variables

---

**Research Complete**: All NEEDS CLARIFICATION items resolved. Ready for Phase 1 design.
