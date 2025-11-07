declare module "morgan" {
  import type { RequestHandler } from "express";

  type FormatFn = (...args: unknown[]) => string;

  interface Morgan {
    (format: string, options?: Record<string, unknown>): RequestHandler;
    (format: FormatFn): RequestHandler;
  }

  const morgan: Morgan & {
    token(name: string, callback: (...args: unknown[]) => string): void;
  };

  export default morgan;
}
