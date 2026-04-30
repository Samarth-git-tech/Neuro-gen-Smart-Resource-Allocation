import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

// ── CONFIGURATION ──
// Read from Vite env var; falls back to Railway URL if the variable is missing.
// Local dev: set VITE_API_BASE_URL=http://localhost:8000 in frontend-rjs/.env
// Production: set VITE_API_BASE_URL=https://neuro-gen-smart-resource-allocation-production.up.railway.app in Vercel dashboard
const _rawBase =
  import.meta.env.VITE_API_BASE_URL ||
  "https://neuro-gen-smart-resource-allocation-production.up.railway.app";

// Guard: ensure the URL is always absolute (has a protocol) and has no trailing slash.
// If VITE_API_BASE_URL is set without https:// on the Vercel dashboard, the browser
// would treat it as a relative path and prepend the Vercel origin, producing a broken
// double-domain URL like: https://digi-sahaay.vercel.app/railway.app/api/auth/login
const _withProtocol =
  _rawBase.startsWith("http://") || _rawBase.startsWith("https://")
    ? _rawBase
    : `https://${_rawBase}`;
export const API_BASE = _withProtocol.replace(/\/$/, "");

console.log("[api.js] API_BASE resolved to:", API_BASE);

// Helper to wait for the auth state to initialize
const getAuthUser = () => {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        unsubscribe();
        resolve(user);
      },
      reject
    );
  });
};

/**
 * Global API Request Wrapper
 */
export async function apiRequest(endpoint, options = {}) {
  const user = await getAuthUser();
  let token = null;

  if (user) {
    // We force refresh the token to ensure Railway receives a valid JWT
    token = await user.getIdToken(true);
  }

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // Standardize error reporting
      throw {
        status: response.status,
        message: errorData.detail || `API Error: ${response.status}`,
      };
    }

    return response.json();
  } catch (err) {
    console.error(`Fetch Error at ${endpoint}:`, err);
    throw err;
  }
}

// ── AUTH & PROFILE ──

export async function fetchMyProfile() {
  // Uses POST /login to lookup user by the Bearer token
  return apiRequest("/api/auth/login", { method: "POST" });
}

export async function registerUser(userData) {
  return apiRequest("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(userData),
  });
}

// ── TASKS ──

export async function fetchAllTasks() {
  return apiRequest("/api/tasks");
}

export async function fetchMyTasks(userId) {
  const all = await apiRequest("/api/tasks");
  return all.filter((t) => t.assigned_to_id === userId);
}

export async function updateTaskStatus(taskId, newStatus) {
  return apiRequest(`/api/tasks/${taskId}/status?new_status=${newStatus}`, {
    method: "PATCH",
  });
}

// ── ADMIN ACTIONS ──

export async function reassignTask(taskId) {
  return apiRequest(`/api/tasks/${taskId}/reassign`, { method: "PATCH" });
}

export async function updateTaskPriority(taskId, priority) {
  return apiRequest(`/api/tasks/${taskId}/priority`, {
    method: "PATCH",
    body: JSON.stringify({ priority })
  });
}

export async function forceAssignUser(taskId, userId) {
  return apiRequest(`/api/tasks/${taskId}/force-assign/${userId}`, { method: "PATCH" });
}

// ── DIAGNOSTICS ──

/** Updated for Railway */
export async function healthCheck() {
  try {
    // Always check the current API_BASE instead of a hardcoded string
    const res = await fetch(`${API_BASE}/`);
    console.log("Railway Health Status:", res.status);
    const data = await res.json();
    console.log("Railway Response:", data);
    return res.status;
  } catch (err) {
    console.error("Railway Connection Failed:", err);
    return null;
  }
}