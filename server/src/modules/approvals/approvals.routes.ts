import { Router } from "express";
import { authenticate } from "../../middleware/auth.js";
import { handleApprovalDecision, handleGetBatchHistory } from "./approvals.controller.js";

const router = Router();

router.post("/:id/decision", authenticate, handleApprovalDecision);
router.get("/:id/history", authenticate, handleGetBatchHistory);

export default router;
