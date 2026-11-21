import { apiRequest } from "./api.js";

export async function fetchBatches() {
    const res = await apiRequest("/batches");
    return res.data || [];
}

export async function fetchBatchDetails(batchId) {
    const res = await apiRequest(`/batches/${batchId}`);
    return res.data;
}

export async function createBatch(courseName, district) {
    const res = await apiRequest("/batches", {
        method: "POST",
        body: JSON.stringify({ courseName, district })
    });
    return res.data;
}

export async function uploadCandidatesCSV(batchId, file) {
    const formData = new FormData();
    formData.append("file", file);

    const token = localStorage.getItem("certiflow_auth_token");
    const response = await fetch(`/api/batches/${batchId}/upload`, {
        method: "POST",
        headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: formData,
        credentials: "include"
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        const error = new Error(data?.message || `Upload failed with status ${response.status}`);
        error.status = response.status;
        error.errors = data?.errors;
        throw error;
    }

    return data.data;
}

export async function addCandidateManually(batchId, candidateData) {
    const res = await apiRequest(`/batches/${batchId}/candidates`, {
        method: "POST",
        body: JSON.stringify(candidateData)
    });
    return res.data;
}

export async function submitBatchForApproval(batchId) {
    const res = await apiRequest(`/batches/${batchId}/submit`, {
        method: "POST"
    });
    return res.data;
}
