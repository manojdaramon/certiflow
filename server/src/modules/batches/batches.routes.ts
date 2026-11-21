import { Router } from "express";
import multer from "multer";
import { Role } from "@prisma/client";
import { authenticate, authorize } from "../../middleware/auth.js";
import {
    handleCreateBatch,
    handleListBatches,
    handleGetBatchById,
    handleAddCandidate,
    handleUploadCSV,
    handleSubmitBatch
} from "./batches.controller.js";

const router = Router();

// Configure in-memory upload handling
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 MB limit
    }
});

router.post("/", authenticate, authorize(Role.TRAINING_CENTRE), handleCreateBatch);
router.get("/", authenticate, handleListBatches);
router.get("/:id", authenticate, handleGetBatchById);

router.post("/:id/candidates", authenticate, authorize(Role.TRAINING_CENTRE), handleAddCandidate);
router.post(
    "/:id/upload",
    authenticate,
    authorize(Role.TRAINING_CENTRE),
    upload.single("file"),
    handleUploadCSV
);
router.post("/:id/submit", authenticate, authorize(Role.TRAINING_CENTRE), handleSubmitBatch);

export default router;
