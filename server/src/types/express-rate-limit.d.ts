declare module "express-rate-limit" {
  import type { RequestHandler } from "express";

  interface RateLimitRequestHandler extends RequestHandler {}

  interface Store {
    increment(key: string): Promise<number> | number;
    decrement(key: string): Promise<void> | void;
    resetKey?(key: string): void;
  }

  interface RateLimitOptions {
    windowMs?: number;
    max?: number | ((req: Parameters<RequestHandler>[0], res: Parameters<RequestHandler>[1]) => number);
    standardHeaders?: boolean;
    legacyHeaders?: boolean;
    skipFailedRequests?: boolean;
    skipSuccessfulRequests?: boolean;
    handler?: RequestHandler;
    requestWasSuccessful?: (req: Parameters<RequestHandler>[0], res: Parameters<RequestHandler>[1]) => boolean;
    keyGenerator?: (req: Parameters<RequestHandler>[0], res: Parameters<RequestHandler>[1]) => string;
    skip?: (req: Parameters<RequestHandler>[0], res: Parameters<RequestHandler>[1]) => boolean;
    store?: Store;
  }

  interface RateLimit {
    (options?: RateLimitOptions): RateLimitRequestHandler;
  }

  const rateLimit: RateLimit;
  export default rateLimit;
}
