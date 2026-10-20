import "server-only";

/**
 * Typed errors a service throws for things a person can be told about. `handler()` (server/api/handler.ts) turns them into the right
 * HTTP answer, so services never import HTTP code. Anything else is a bug: it is logged and answered with a generic message.
 */
export class ServiceError extends Error {
  constructor(
    readonly status: 400 | 403 | 404 | 409 | 429,
    message: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}
export class ValidationError extends ServiceError {
  constructor(message: string) {
    super(400, message);
  }
}
export class ForbiddenError extends ServiceError {
  constructor(message = "You can’t do that.") {
    super(403, message);
  }
}
export class NotFoundError extends ServiceError {
  constructor(message = "Not found.") {
    super(404, message);
  }
}
export class ConflictError extends ServiceError {
  constructor(message: string) {
    super(409, message);
  }
}
export class RateLimitError extends ServiceError {
  constructor(message = "Slow down a little and try again.") {
    super(429, message);
  }
}
