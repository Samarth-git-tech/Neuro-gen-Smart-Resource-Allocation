import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

/** * ── CONFIGURATION ──
 * Ensure your Vercel Environment Variable VITE_API_BASE_URL 
 * is set to: https://neuro-gen-smart-resource-allocation-production.up.railway.app
 */
const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

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