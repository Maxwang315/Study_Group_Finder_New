import { Types } from "mongoose";

import StatsModel, { type StatsDocument } from "../models/stats";
import { config } from "../config/env";

type CounterField = "totalVisits" | "groupsCreated";

const VISIT_KEY = "stats:totalVisits";
const GROUPS_KEY = "stats:groupsCreated";

type RedisClient = {
  connect(): Promise<void>;
  mget(...keys: string[]): Promise<(string | null)[]>;
  mset(values: Record<string, number | string>): Promise<unknown>;
  incrby(key: string, amount: number): Promise<number>;
};

class StatsService {
  private redis?: RedisClient;

  private statsId?: Types.ObjectId;

  private totalVisits = 0;

  private groupsCreated = 0;

  private initialization?: Promise<void>;

  private get redisKeys() {
    return [VISIT_KEY, GROUPS_KEY];
  }

  private async setupRedis() {
    const redisUrl = config.cache.redisUrl;

    if (!redisUrl) {
      return;
    }

    try {
      const redisModule = await import("ioredis");
      const redisExport = (redisModule as { default?: new (...args: any[]) => RedisClient }).default ??
        ((redisModule as unknown) as new (...args: any[]) => RedisClient | undefined);

      if (!redisExport) {
        console.warn("ioredis is not available. Falling back to in-memory stats tracking.");
        return;
      }

      const RedisConstructor = redisExport as new (...args: any[]) => RedisClient;

      const redis = new RedisConstructor(redisUrl, { lazyConnect: true } as Record<string, unknown>) as RedisClient;

      await redis.connect();

      this.redis = redis;
    } catch (error) {
      console.warn("Failed to initialize Redis client. Falling back to in-memory stats tracking.", error);
    }
  }

  private async ensureInitialized() {
    if (!this.initialization) {
      this.initialization = this.initialize();
    }

    await this.initialization;
  }

  private async initialize() {
    await this.setupRedis();

    const statsDoc = await StatsModel.getSingleton();

    this.statsId = statsDoc._id as Types.ObjectId;

    if (this.redis) {
      await this.synchronizeRedis(statsDoc);
      return;
    }

    this.setLocalCounts(statsDoc);
  }

  private setLocalCounts(doc: StatsDocument) {
    this.totalVisits = doc.totalVisits;
    this.groupsCreated = doc.groupsCreated;
  }

  private async synchronizeRedis(statsDoc: StatsDocument) {
    if (!this.redis) {
      return;
    }

    const [visitValue, groupsValue] = await this.redis.mget(...this.redisKeys);

    if (visitValue === null || groupsValue === null) {
      await this.redis.mset({
        [VISIT_KEY]: statsDoc.totalVisits,
        [GROUPS_KEY]: statsDoc.groupsCreated,
      });

      this.setLocalCounts(statsDoc);
      return;
    }

    this.totalVisits = Number(visitValue);
    this.groupsCreated = Number(groupsValue);
  }

  private async incrementField(field: CounterField, amount = 1) {
    await this.ensureInitialized();

    if (!this.statsId) {
      throw new Error("Stats document not initialized");
    }

    if (this.redis) {
      const key = field === "totalVisits" ? VISIT_KEY : GROUPS_KEY;
      const value = await this.redis.incrby(key, amount);

      if (field === "totalVisits") {
        this.totalVisits = value;
      } else {
        this.groupsCreated = value;
      }
    } else if (field === "totalVisits") {
      this.totalVisits += amount;
    } else {
      this.groupsCreated += amount;
    }

    await StatsModel.incrementField(this.statsId, field, amount);
  }

  async incrementVisitCount(amount = 1) {
    await this.incrementField("totalVisits", amount);
  }

  async incrementGroupsCreated(amount = 1) {
    await this.incrementField("groupsCreated", amount);
  }

  private async getRedisCounts() {
    if (!this.redis) {
      return null;
    }

    const [visitValue, groupsValue] = await this.redis.mget(...this.redisKeys);

    return {
      totalVisits: visitValue ? Number(visitValue) : this.totalVisits,
      groupsCreated: groupsValue ? Number(groupsValue) : this.groupsCreated,
    };
  }

  async getStats() {
    await this.ensureInitialized();

    if (this.redis) {
      const redisCounts = await this.getRedisCounts();

      if (redisCounts) {
        return redisCounts;
      }
    }

    return {
      totalVisits: this.totalVisits,
      groupsCreated: this.groupsCreated,
    };
  }
}

const statsService = new StatsService();

export default statsService;
