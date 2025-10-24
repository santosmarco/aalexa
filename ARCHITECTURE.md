# Tinder SDK - Project Structure

## Overview

A production-ready, type-safe TypeScript SDK for the unofficial Tinder API.

## Project Statistics

- **Total Lines of Code**: ~1,098 lines
- **Source Code**: ~480 lines
- **Type Definitions**: 155 lines
- **Examples**: 386 lines
- **Documentation**: 232 lines

## Architecture

### Core Design Principles

1. **Type Safety First**: Zero use of `any`, strict TypeScript configuration
2. **Modular Design**: Separated concerns into distinct modules
3. **Readonly by Default**: All data types use readonly to prevent mutations
4. **Error Handling**: Custom error classes for different failure scenarios
5. **Zero External Dependencies**: Only axios for HTTP requests

## Directory Structure

```
/workspace/
├── src/
│   ├── core/              # Core API client
│   │   ├── ApiClient.ts   # HTTP client with interceptors
│   │   └── index.ts       # Core exports
│   │
│   ├── modules/           # Feature modules
│   │   ├── AuthModule.ts      # Authentication (SMS, Facebook)
│   │   ├── ProfileModule.ts   # Profile management
│   │   ├── MatchingModule.ts  # Swiping actions
│   │   ├── MessagingModule.ts # Match & message management
│   │   └── index.ts           # Module exports
│   │
│   ├── types/             # TypeScript definitions
│   │   └── index.ts       # All type definitions
│   │
│   ├── utils/             # Utilities
│   │   ├── errors.ts      # Custom error classes
│   │   ├── constants.ts   # API endpoints & config
│   │   └── index.ts       # Utility exports
│   │
│   └── index.ts           # Main SDK export
│
├── examples/              # Usage examples
│   ├── basic-usage.ts     # Getting started examples
│   └── advanced-usage.ts  # Advanced patterns & utilities
│
├── dist/                  # Compiled JavaScript (generated)
├── package.json           # Dependencies & scripts
├── tsconfig.json          # TypeScript configuration
└── README.md             # Documentation

```

## Module Breakdown

### 1. Core Module (`src/core/`)

**ApiClient.ts** (92 lines)
- Axios-based HTTP client
- Request/response interceptors
- Authentication token management
- Automatic error handling

**Key Features:**
- Auto-injects X-Auth-Token header
- Converts HTTP errors to custom error types
- Type-safe request/response handling

### 2. Feature Modules (`src/modules/`)

**AuthModule.ts** (77 lines)
- Facebook OAuth login
- SMS authentication
- Token management
- Session state

**ProfileModule.ts** (28 lines)
- Get current user profile
- Update profile settings
- Fetch metadata

**MatchingModule.ts** (31 lines)
- Get recommendations
- Like/pass/super-like actions
- Match detection

**MessagingModule.ts** (35 lines)
- Get all matches
- Send messages
- Unmatch users
- Paginated match retrieval

### 3. Type System (`src/types/`)

**155 lines of comprehensive type definitions:**

Core Types:
- `TinderConfig` - SDK configuration
- `AuthToken` - Authentication data
- `User` - User profile data
- `Match` - Match information
- `Message` - Message data
- `Recommendation` - Potential match
- `Photo` - Image data
- `Profile` - Full user profile

Response Types:
- `RecommendationsResponse`
- `MatchResponse`
- `LikeResponse`
- `PassResponse`
- `SuperLikeResponse`
- `MatchesResponse`
- `SendMessageResponse`

**Type Safety Features:**
- All arrays are ReadonlyArray
- All objects use readonly properties
- Gender represented as `0 | 1` literal types
- No use of `any` or type assertions

### 4. Error Handling (`src/utils/errors.ts`)

Custom error hierarchy:
```typescript
TinderError (base)
├── AuthenticationError (401)
├── RateLimitError (429)
└── NotFoundError (404)
```

Each error includes:
- Descriptive message
- HTTP status code
- Original response data

### 5. Examples

**basic-usage.ts** (124 lines)
- Authentication examples
- Profile management
- Getting recommendations
- Liking/passing
- Messaging
- Error handling

**advanced-usage.ts** (262 lines)
- Auto-swiper with strategies
- Bulk message sender
- Match statistics analyzer
- Location updates
- Retry logic with exponential backoff
- Rate limit handling

## API Coverage

### Implemented Endpoints

✅ `/v2/auth/login/facebook` - Facebook login
✅ `/v2/auth/login/sms` - SMS login
✅ `/v2/profile` - Get/update profile
✅ `/v2/meta` - Get metadata
✅ `/v2/recs/core` - Get recommendations
✅ `/like/{id}` - Like user
✅ `/pass/{id}` - Pass user
✅ `/like/{id}/super` - Super like user
✅ `/v2/matches` - Get matches
✅ `/user/matches/{id}` - Get/send messages
✅ DELETE `/user/matches/{id}` - Unmatch

### Potential Future Endpoints

- `/updates` - Real-time updates
- `/profile/photos` - Photo management
- `/v2/fast-match` - Boost features
- `/report/{id}` - Report users
- `/giphy` - GIF search
- `/passport` - Location change

## Configuration

### TypeScript Config Highlights

```json
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noImplicitReturns": true
}
```

### Path Aliases

- `@types/*` → `src/types/*`
- `@core/*` → `src/core/*`
- `@utils/*` → `src/utils/*`

## Usage Patterns

### Basic Usage

```typescript
import { TinderClient } from 'tinder-sdk';

const client = new TinderClient();
client.setAuthToken('your-token');

const profile = await client.profile.getProfile();
const recs = await client.matching.getRecommendations();
```

### With Configuration

```typescript
const client = new TinderClient({
  apiBaseUrl: 'https://api.gotinder.com',
  timeout: 15000,
  userAgent: 'Custom/1.0.0',
});
```

### Error Handling

```typescript
try {
  await client.matching.like(userId);
} catch (error) {
  if (error instanceof AuthenticationError) {
    // Re-authenticate
  } else if (error instanceof RateLimitError) {
    // Wait and retry
  }
}
```

## Build & Development

### Scripts

```bash
npm run build   # Compile TypeScript
npm run dev     # Watch mode
npm run lint    # Run linter
```

### Build Output

Compiles to `dist/` with:
- JavaScript (.js files)
- Type declarations (.d.ts files)
- Source maps

## Best Practices Implemented

1. **No Type Assertions**: Use proper type guards and `satisfies`
2. **Readonly Types**: Prevent accidental mutations
3. **Functional Patterns**: Pure functions where possible
4. **Error Boundaries**: Comprehensive error handling
5. **Rate Limit Awareness**: Built-in delays in examples
6. **Modular Architecture**: Easy to extend
7. **Path Aliases**: Clean imports
8. **Type-only Imports**: Optimized bundle size

## Extension Points

The SDK is designed to be easily extended:

1. **Add New Modules**: Create new class in `src/modules/`
2. **Add New Types**: Extend `src/types/index.ts`
3. **Add New Endpoints**: Use existing `ApiClient` methods
4. **Custom Interceptors**: Extend `ApiClient` class
5. **Custom Error Types**: Extend `TinderError` class

## Testing Strategy (Not Yet Implemented)

Recommended approach:
- Unit tests for utilities
- Integration tests for modules
- Mock Tinder API responses
- Test error scenarios
- Test rate limiting

## Security Considerations

1. Never commit auth tokens
2. Use environment variables
3. Implement token refresh logic
4. Handle token expiration
5. Respect rate limits
6. Follow Tinder's ToS

## Performance Notes

- Minimal dependencies (only axios)
- Tree-shakeable exports
- Type-only imports don't affect bundle
- Efficient readonly types
- No runtime type checking overhead

## Known Limitations

1. No websocket support for real-time updates
2. No photo upload functionality
3. No boost/premium features
4. Rate limiting not automatically handled
5. No token refresh implementation

## Future Enhancements

- [ ] Websocket support for `/updates`
- [ ] Photo upload/management
- [ ] Boost and premium features
- [ ] Automatic rate limit handling
- [ ] Token refresh mechanism
- [ ] Request queuing
- [ ] Response caching
- [ ] Unit tests
- [ ] Integration tests
- [ ] CI/CD pipeline

## License

MIT - See LICENSE file

## Disclaimer

This is an unofficial SDK. Use responsibly and at your own risk.
