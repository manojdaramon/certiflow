import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/app.js";

describe("Health Check API", () => {
    it("should return 200 and service statuses", async () => {
        const response = await request(app).get("/health");
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.services).toBeDefined();
    });

    it("should return 200 on /api root", async () => {
        const response = await request(app).get("/api");
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain("CertiFlow");
    });
});
