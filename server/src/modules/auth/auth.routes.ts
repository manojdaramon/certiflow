import { Router } from "express";
import { handleLogin, handleGetMe } from "./auth.controller.js";
import { authenticate } from "../../middleware/auth.js";

const router = Router();

router.post("/login", handleLogin);
router.get("/me", authenticate, handleGetMe);

export default router;
