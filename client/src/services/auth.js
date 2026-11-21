import { apiRequest } from "./api.js";

const TOKEN_KEY = "certiflow_auth_token";
const USER_KEY = "certiflow_auth_user";

export function getStoredToken() {
    return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch {
        return null;
    }
}

export async function login(email, password) {
    const res = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
    });

    if (res.success && res.data) {
        localStorage.setItem(TOKEN_KEY, res.data.token);
        localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
        return res.data.user;
    }

    throw new Error(res.message || "Login failed");
}

export async function fetchCurrentUser() {
    const token = getStoredToken();
    if (!token) return null;

    try {
        const res = await apiRequest("/auth/me");
        if (res.success && res.data) {
            localStorage.setItem(USER_KEY, JSON.stringify(res.data));
            return res.data;
        }
        return null;
    } catch {
        logout();
        return null;
    }
}

export function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
}
