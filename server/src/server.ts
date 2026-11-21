import app from "./app.js";
import { env } from "./config/env.js";
import { prisma } from "./config/database.js";
import { redis } from "./config/redis.js";

const server = app.listen(env.PORT, () => {
    console.log(`[CertiFlow API] Server running on http://localhost:${env.PORT} in ${env.NODE_ENV} mode`);
});

const gracefulShutdown = async (signal: string) => {
    console.log(`[CertiFlow API] Received ${signal}. Closing gracefully...`);
    server.close(async () => {
        try {
            await prisma.$disconnect();
            await redis.quit();
            console.log("[CertiFlow API] Closed database and Redis connections.");
            process.exit(0);
        } catch (err) {
            console.error("[CertiFlow API] Error during shutdown:", err);
            process.exit(1);
        }
    });
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
