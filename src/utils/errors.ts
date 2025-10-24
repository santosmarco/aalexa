export class TinderError extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly response?: unknown
  ) {
    super(message);
    this.name = 'TinderError';
    Object.setPrototypeOf(this, TinderError.prototype);
  }
}

export class AuthenticationError extends TinderError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
    this.name = 'AuthenticationError';
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

export class RateLimitError extends TinderError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 429);
    this.name = 'RateLimitError';
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

export class NotFoundError extends TinderError {
  constructor(message = 'Resource not found') {
    super(message, 404);
    this.name = 'NotFoundError';
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}
