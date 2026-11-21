import { Redis } from "ioredis";
import { env } from "./env.js";

export const redis = new Redis({
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    maxRetriesPerRequest: null,
    lazyConnect: true,
    retryStrategy(times) {
        if (times > 5) {
            return null; // Stop retrying after 5 attempts in offline dev mode
        }
        return Math.min(times * 100, 2000);
    }
});

redis.on("error", (err) => {
    if (env.NODE_ENV === "development") {
        // Log cleanly without crashing the dev process if Redis is starting up
        console.warn(`[Redis] Connection warning: ${err.message}`);
    }
});

export async function checkRedisConnection(): Promise<boolean> {
    try {
        if (redis.status !== "ready" && redis.status !== "connecting") {
            await redis.connect();
        }
        const pong = await redis.ping();
        return pong === "PONG";
    } catch {
        return false;
    }
}
