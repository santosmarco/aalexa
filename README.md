# Tinder SDK

An unofficial TypeScript/Node.js SDK for the Tinder API.

## ⚠️ Disclaimer

This is an **unofficial** SDK built by reverse-engineering the Tinder API. Use at your own risk. This SDK is for educational purposes only. The author is not responsible for any misuse or violation of Tinder's Terms of Service.

## Installation

```bash
npm install tinder-sdk
# or
yarn add tinder-sdk
```

## Features

- ✅ Full TypeScript support with strict type safety
- ✅ Authentication (SMS, Facebook)
- ✅ User profile management
- ✅ Get recommendations (potential matches)
- ✅ Like, pass, and super-like actions
- ✅ Match management
- ✅ Messaging
- ✅ Comprehensive error handling
- ✅ Zero dependencies (except axios)

## Quick Start

```typescript
import { TinderClient } from 'tinder-sdk';

const client = new TinderClient();

// Authenticate
const auth = await client.auth.loginWithFacebook(facebookToken, facebookId);

// Or use existing token
client.setAuthToken('your-auth-token');

// Get your profile
const profile = await client.profile.getProfile();
console.log(`Hello, ${profile.name}!`);

// Get recommendations
const recs = await client.matching.getRecommendations();
for (const rec of recs.results) {
  console.log(`${rec.user.name}, ${rec.distance_mi} miles away`);
}

// Like someone
const likeResult = await client.matching.like(userId);
if (likeResult.match) {
  console.log("It's a match! 🎉");
}

// Get matches
const matches = await client.messaging.getMatches();

// Send a message
await client.messaging.sendMessage(matchId, "Hey! 👋");
```

## API Reference

### Authentication

```typescript
// Login with Facebook
const auth = await client.auth.loginWithFacebook(facebookToken, facebookId);

// Login with SMS
const auth = await client.auth.loginWithSms(phoneNumber, otpCode);

// Set existing token
client.auth.setToken('your-token');

// Check authentication status
const isAuth = client.auth.isAuthenticated();

// Logout
client.auth.logout();
```

### Profile Management

```typescript
// Get current user profile
const profile = await client.profile.getProfile();

// Update profile
const updated = await client.profile.updateProfile({
  bio: 'New bio',
  age_filter_min: 22,
  age_filter_max: 30,
  distance_filter: 50,
});

// Get metadata
const meta = await client.profile.getMeta();
```

### Matching

```typescript
// Get recommendations (potential matches)
const recs = await client.matching.getRecommendations();

// Like a user
const likeResult = await client.matching.like(userId);

// Pass on a user
await client.matching.pass(userId);

// Super like a user
const superLikeResult = await client.matching.superLike(userId);
console.log(`Super likes remaining: ${superLikeResult.super_likes.remaining}`);
```

### Messaging

```typescript
// Get all matches
const matches = await client.messaging.getMatches({ count: 100 });

// Get specific match
const match = await client.messaging.getMatch(matchId);

// Send message
const message = await client.messaging.sendMessage(matchId, 'Hello!');

// Unmatch
await client.messaging.unmatch(matchId);
```

## Configuration

```typescript
const client = new TinderClient({
  apiBaseUrl: 'https://api.gotinder.com',
  timeout: 10000,
  userAgent: 'Tinder/12.0.0 (iPhone; iOS 16.0; Scale/2.00)',
});
```

## Error Handling

The SDK provides specific error types:

```typescript
import { 
  TinderError, 
  AuthenticationError, 
  RateLimitError, 
  NotFoundError 
} from 'tinder-sdk';

try {
  await client.matching.like(userId);
} catch (error) {
  if (error instanceof AuthenticationError) {
    console.error('Not authenticated');
  } else if (error instanceof RateLimitError) {
    console.error('Rate limited - slow down!');
  } else if (error instanceof NotFoundError) {
    console.error('User not found');
  } else if (error instanceof TinderError) {
    console.error('API error:', error.message);
  }
}
```

## Type Safety

All API responses are fully typed:

```typescript
import type { 
  User, 
  Match, 
  Message, 
  Profile, 
  Recommendation 
} from 'tinder-sdk';

const profile: Profile = await client.profile.getProfile();
const matches: ReadonlyArray<Match> = await client.messaging.getMatches();
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Watch mode
npm run dev

# Lint
npm run lint
```

## Architecture

```
src/
├── core/           # Core API client
├── modules/        # Feature modules (auth, profile, matching, messaging)
├── types/          # TypeScript type definitions
└── utils/          # Utilities (errors, constants)
```

## License

MIT

## Contributing

Contributions are welcome! Please open an issue or PR.

## Related Projects

- [Tinder API Documentation](https://gist.github.com/rtt/10403467)
- [pynder](https://github.com/charliewolf/pynder)

## Disclaimer

This project is not affiliated with, authorized, maintained, sponsored or endorsed by Tinder or any of its affiliates or subsidiaries. This is an independent and unofficial API. Use at your own risk.
