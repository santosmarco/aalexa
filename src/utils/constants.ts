export const DEFAULT_CONFIG = {
  apiBaseUrl: 'https://api.gotinder.com',
  timeout: 10000,
  userAgent: 'Tinder/12.0.0 (iPhone; iOS 16.0; Scale/2.00)',
} as const;

export const ENDPOINTS = {
  AUTH_SMS: '/v2/auth/login/sms',
  AUTH_FACEBOOK: '/v2/auth/login/facebook',
  PROFILE: '/v2/profile',
  META: '/v2/meta',
  RECOMMENDATIONS: '/v2/recs/core',
  LIKE: '/like',
  PASS: '/pass',
  SUPER_LIKE: '/like',
  MATCHES: '/v2/matches',
  MATCH: '/user/matches',
  SEND_MESSAGE: '/user/matches',
  UPDATES: '/updates',
} as const;
