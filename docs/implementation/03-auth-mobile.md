# Autenticación y Flujo Móvil con Expo

## Mobile Authentication Flow

### Auth Strategy

- Use `better-auth` with `magic link`
- Use `Resend` from day one in both dev and production
- Use a temporary verified sender initially
- Use HTTPS callback before redirecting into Expo deep link

### Auth Flow

1. User enters email in the Expo app
2. App requests magic link
3. Backend creates magic link using `better-auth`
4. `Resend` sends email
5. User clicks email link
6. Link opens backend callback URL
7. Backend verifies token and establishes session
8. Backend redirects to `tourai://auth/callback`
9. Expo app stores session securely, ideally with `expo-secure-store`

### Auth Notes

- Prefer a backend HTTPS callback rather than linking directly to the app scheme
- Session persistence in Expo should be planned carefully
- If needed, use a token exchange step that is easier for mobile clients to persist than cookies alone
