# Sentry Configuration

## Setup Instructions

1. **Create a Sentry Account** (if you don't have one):
   - Go to https://sentry.io/signup/
   - Free tier includes 5,000 errors/month

2. **Create a New Project**:
   - Select "Next.js" as the platform
   - Copy your DSN (Data Source Name)

3. **Add Environment Variable**:
   Add to your `.env.local` file:

   ```
   NEXT_PUBLIC_SENTRY_DSN=your_dsn_here
   ```

4. **Deploy**:
   - Sentry will automatically track errors in production
   - Errors from ErrorBoundary components are logged to Sentry
   - View errors in your Sentry dashboard

## Features Enabled

- ✅ Client-side error tracking
- ✅ Server-side error tracking
- ✅ Edge runtime error tracking
- ✅ Session replay on errors
- ✅ ErrorBoundary integration
- ✅ Source maps (optional, requires SENTRY_AUTH_TOKEN)

## Configuration Files

- `sentry.client.config.ts` - Browser error tracking
- `sentry.server.config.ts` - Server error tracking
- `sentry.edge.config.ts` - Edge/middleware error tracking

## Testing

To test error tracking:

1. Throw an error in a component wrapped with ErrorBoundary
2. Check your Sentry dashboard for the error report
3. View stack traces, breadcrumbs, and session replays

## Optional: Source Maps

For better debugging, add to `.env.local`:

```
SENTRY_AUTH_TOKEN=your_auth_token_here
```

Generate auth token at: https://sentry.io/settings/account/api/auth-tokens/
