# Postman Testing

## Files

- Collection: `postman/tourai-auth.collection.json`
- Environment: `postman/local.postman_environment.json`

## Covered Flows

### Automated

- Existing user session flow
- Fresh user sign up
- Email verification through dev token helper
- Password reset through dev token helper
- Places listing
- Featured place lookup
- GPS resolution near a seeded POI
- Guide generation with audio
- Guide retrieval and status lookup

### Development Helper

- `GET /dev/auth/debug/:email`

This endpoint exists only to make local/Postman verification and password reset flows testable without depending on reading inbox contents manually. It should stay out of production deployments.

## Local Test User

The collection uses this seeded auth user for the existing-session flow:

- email: `delivered@resend.dev`
- password: `StrongPass123!`

It also creates a brand new user on each run for the sign-up, verify and reset flow.

## Run with Postman CLI

```bash
./node_modules/.bin/postman collection run postman/tourai-auth.collection.json \
  -e postman/local.postman_environment.json \
  --verbose
```

Or via npm:

```bash
npm run test:postman:auth
```

## Notes

- The backend must be running on `http://localhost:3000`.
- `Sign Out` requires an `Origin` header because Better Auth enforces origin checks for session-destructive requests.
- The collection relies on cookie persistence within the collection run.
- The verification and password reset flows are automated locally through the dev helper route.
- The backend must be seeded first so `places` and `location/resolve` have data.
