import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
    PORT: z.string().default("5000").transform((val) => parseInt(val, 10)),
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    DATABASE_URL: z.string().default("postgresql://certiflow:certiflow_secret@localhost:5432/certiflow?schema=public"),
    REDIS_HOST: z.string().default("localhost"),
    REDIS_PORT: z.string().default("6379").transform((val) => parseInt(val, 10)),
    JWT_SECRET: z.string().default("certiflow-hackathon-insecure-dev-secret-key-32b"),
    CLIENT_URL: z.string().default("http://localhost:3000")
});

export const env = envSchema.parse(process.env);
