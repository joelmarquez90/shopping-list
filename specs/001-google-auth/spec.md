# Feature Specification: Google Authentication via Firebase

**Feature Branch**: `001-google-auth`
**Created**: 2026-01-10
**Status**: Draft
**Input**: User description: "El sitio web actualmente es público y read-only. Me gustaría agregarle autenticación con Google vía Firebase Authentication"

## Clarifications

### Session 2026-01-10

- Q: Should anonymous users be able to access the app? → A: No, authentication is required to access the app
- Q: Which users are allowed to sign in? → A: Only 90joelmarquez@gmail.com (single-user allowlist)
- Q: What authentication methods are supported? → A: Google Sign-In only (no email/password or other providers)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sign In with Google (Priority: P1)

A visitor arrives at the shopping list application and is presented with a login screen. They must sign in with their Google account to access the application. They click the "Sign in with Google" button, select their Google account from the popup, and if their email is in the allowlist (90joelmarquez@gmail.com), they are authenticated and can access the shopping list.

**Why this priority**: This is the core authentication functionality. Without sign-in capability, no access to the application is possible. This story delivers immediate value by enabling the authorized user to access their shopping list.

**Independent Test**: Can be fully tested by clicking "Sign in with Google", completing the Google OAuth flow with the allowed email, and verifying access to the shopping list is granted.

**Acceptance Scenarios**:

1. **Given** a visitor is on the login page, **When** they click "Sign in with Google", **Then** a Google account selection popup appears
2. **Given** the Google popup is displayed, **When** the user selects the allowed Google account (90joelmarquez@gmail.com), **Then** the user is authenticated and redirected to the shopping list
3. **Given** a user is signed in, **When** they refresh the page, **Then** they remain signed in (session persists)

---

### User Story 2 - Unauthorized User Rejection (Priority: P1)

A visitor attempts to sign in with a Google account that is not in the allowlist. The system rejects the authentication attempt and displays an access denied message.

**Why this priority**: Critical security requirement. The system must prevent unauthorized access to protect user data and enforce the single-user restriction.

**Independent Test**: Can be fully tested by attempting to sign in with a non-allowed Google account and verifying access is denied with an appropriate message.

**Acceptance Scenarios**:

1. **Given** a visitor completes Google sign-in with an unauthorized email, **When** the system validates the email, **Then** access is denied with a clear error message
2. **Given** access is denied, **When** the user views the error, **Then** they see a message indicating only authorized users can access the app
3. **Given** access is denied, **When** the user wants to try again, **Then** they can attempt to sign in with a different account

---

### User Story 3 - Sign Out (Priority: P2)

An authenticated user wants to sign out of the application, either to use a different account or for privacy reasons on a shared device. They click a sign-out button and are returned to the login screen.

**Why this priority**: Essential complement to sign-in functionality. The user needs the ability to end their session, especially on shared devices.

**Independent Test**: Can be fully tested by signing in, clicking "Sign out", and verifying the user returns to the login screen.

**Acceptance Scenarios**:

1. **Given** a user is signed in, **When** they click "Sign out", **Then** their session ends and they see the login screen
2. **Given** a user has signed out, **When** they try to access the shopping list URL directly, **Then** they are redirected to the login screen

---

### Edge Cases

- What happens when a user cancels the Google sign-in popup?
  - The user remains on the login screen and can retry
- What happens if Google authentication fails (network error, Google service unavailable)?
  - An error message is displayed and the user can retry
- What happens when an authenticated user's session expires?
  - The user is redirected to the login screen and prompted to sign in again
- What happens if the allowed user signs in from multiple devices simultaneously?
  - Both sessions remain valid (no single-session restriction)

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST require authentication to access any part of the application (no anonymous access)
- **FR-002**: System MUST provide a "Sign in with Google" button on the login screen
- **FR-003**: System MUST authenticate users via Google OAuth using Firebase Authentication (Google Sign-In only, no other providers)
- **FR-004**: System MUST restrict access to an allowlist of authorized email addresses (currently: 90joelmarquez@gmail.com only)
- **FR-005**: System MUST reject authentication attempts from non-allowlisted email addresses with a clear access denied message
- **FR-006**: System MUST display the authenticated user's name and/or profile photo when signed in
- **FR-007**: System MUST provide a "Sign out" option visible to authenticated users
- **FR-008**: System MUST persist authentication state across page refreshes and browser sessions
- **FR-009**: System MUST redirect unauthenticated users to the login screen when attempting to access protected routes
- **FR-010**: System MUST handle authentication errors gracefully with user-friendly messages

### Key Entities

- **User**: Represents an authenticated user; contains Google-provided ID, email, display name, and profile photo URL
- **Session**: The authentication state that persists the user's logged-in status across page loads
- **Allowlist**: Configuration that defines which email addresses are permitted to access the application (currently single-entry: 90joelmarquez@gmail.com)

## Assumptions

- Firebase project already exists or will be created as part of implementation
- The app will use Firebase's client-side SDK for authentication (no server-side token validation needed for MVP)
- Standard OAuth2 consent screen configuration is sufficient
- The allowlist is hardcoded for MVP; dynamic allowlist management may be added in future iterations
- User data persistence (shopping list per user) will be addressed in a separate feature; this spec only covers authentication

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete the sign-in process in under 30 seconds (from clicking button to seeing shopping list)
- **SC-002**: 100% of sign-in attempts with allowed email succeed (excluding user cancellations and network errors)
- **SC-003**: 100% of sign-in attempts with non-allowed emails are rejected
- **SC-004**: Authentication state persists correctly across page refreshes 100% of the time
- **SC-005**: Users can sign out with a single click
- **SC-006**: Unauthenticated users are redirected to login within 1 second of accessing any protected route
- **SC-007**: Error messages are displayed within 3 seconds of a failure occurring
