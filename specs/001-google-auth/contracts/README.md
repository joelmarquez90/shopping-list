# Contracts: Google Authentication via Firebase

**Feature Branch**: `001-google-auth`
**Created**: 2026-01-10

## Overview

This directory contains TypeScript interface contracts for the authentication feature. Since this is a client-side only feature using Firebase Auth, there are no REST API contracts—only React component and context contracts.

## Files

| File | Purpose |
|------|---------|
| `auth-context.ts` | AuthContext value interface, useAuth hook contract, error types |
| `components.ts` | Props interfaces for all auth UI components |

## Usage

These contracts serve as the implementation specification. During implementation:

1. Copy type definitions to `src/types/auth.ts`
2. Implement components to match their prop interfaces
3. Implement AuthProvider to match AuthContextValue interface
4. Implement useAuth hook to match UseAuth type

## No API Contracts

This feature does not introduce any REST API endpoints. All authentication is handled client-side through:

- Firebase Auth SDK (`signInWithPopup`, `signOut`, `onAuthStateChanged`)
- React Context for state management
- Environment variables for configuration

Future features (e.g., per-user data persistence with Firestore) may introduce API contracts.
