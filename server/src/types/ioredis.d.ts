declare module "ioredis" {
  export default class Redis {
    constructor(url: string, options?: Record<string, unknown>);
    connect(): Promise<void>;
    mget(...keys: string[]): Promise<(string | null)[]>;
    mset(values: Record<string, number | string>): Promise<unknown>;
    incrby(key: string, amount: number): Promise<number>;
  }
}
