import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { checkDatabaseConnection } from "./config/database.js";
import { checkRedisConnection } from "./config/redis.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(cors({
    origin: env.CLIENT_URL,
    credentials: true
}));

app.use(express.json());
app.use(requestLogger);

// Health check endpoint
app.get("/health", async (_req, res) => {
    const dbConnected = await checkDatabaseConnection();
    const redisConnected = await checkRedisConnection();

    res.status(200).json({
        success: true,
        message: "CertiFlow Backend API is running",
        timestamp: new Date().toISOString(),
        services: {
            database: dbConnected ? "connected" : "disconnected",
            redis: redisConnected ? "connected" : "disconnected"
        }
    });
});

// Root API router placeholder for modules
const apiRouter = express.Router();

apiRouter.get("/", (_req, res) => {
    res.json({
        success: true,
        message: "CertiFlow v1 API root",
        version: "1.0.0"
    });
});

app.use("/api", apiRouter);

// Central error handling
app.use(errorHandler);

export default app;
