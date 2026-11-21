import { apiRequest } from "./api.js";

export async function submitDecision(batchId, decision, reason) {
    const res = await apiRequest(`/batches/${batchId}/decision`, {
        method: "POST",
        body: JSON.stringify({ decision, reason })
    });
    return res;
}

export async function fetchBatchHistory(batchId) {
    const res = await apiRequest(`/batches/${batchId}/history`);
    return res.data;
}
