const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export async function apiRequest(endpoint, options = {}) {
    const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
    
    const config = {
        headers: {
            "Content-Type": "application/json",
            ...options.headers
        },
        credentials: "include",
        ...options
    };

    try {
        const response = await fetch(url, config);
        const data = await response.json().catch(() => null);

        if (!response.ok) {
            const error = new Error(data?.message || `Request failed with status ${response.status}`);
            error.status = response.status;
            error.errors = data?.errors;
            throw error;
        }

        return data;
    } catch (err) {
        console.error(`[API Error] ${endpoint}:`, err);
        throw err;
    }
}

export async function fetchHealth() {
    try {
        const response = await fetch("/health");
        return await response.json();
    } catch (err) {
        return { success: false, message: "Backend unreachable", error: err.message };
    }
}
