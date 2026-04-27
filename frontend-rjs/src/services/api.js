import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";
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

export async function apiRequest(endpoint, options = {}) {
  const user = await getAuthUser();
  let token = null;

  if (user) {
    token = await user.getIdToken(true);
  }

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `API Error: ${response.status}`);
  }

  return response.json();
}

/** Fetch all tasks */
export async function fetchAllTasks() {
  return apiRequest("/api/tasks");
}

/** Fetch tasks assigned to logged-in user */
export async function fetchMyTasks(userId) {
  const all = await apiRequest("/api/tasks");
  return all.filter((t) => t.assigned_to_id === userId);
}

/** Update task status */
export async function updateTaskStatus(taskId, newStatus) {
  return apiRequest(`/api/tasks/${taskId}/status?new_status=${newStatus}`, {
    method: "PATCH",
  });
}

/** Get logged-in user profile */
export async function fetchMyProfile() {
  return apiRequest("/api/auth/login", { method: "POST" }); // backend uses token
}

/** Admin Action: Force AI Reassignment */
export async function reassignTask(taskId) {
  return apiRequest(`/api/tasks/${taskId}/reassign`, { method: "PATCH" });
}

/** Admin Action: Update Priority */
export async function updateTaskPriority(taskId, priority) {
  return apiRequest(`/api/tasks/${taskId}/priority`, {
    method: "PATCH",
    body: JSON.stringify({ priority })
  });
}

/** Admin Action: Force Assign specific user */
export async function forceAssignUser(taskId, userId) {
  return apiRequest(`/api/tasks/${taskId}/force-assign/${userId}`, { method: "PATCH" });
}

/** Diagnostic Tool: Health Check */
export async function healthCheck() {
  try {
    const res = await fetch("https://digi-sahaay-backend.onrender.com/");
    console.log("Health Check Status:", res.status);
    const text = await res.text();
    console.log("Health Check Response:", text);
    return res.status;
  } catch (err) {
    console.error("Health Check Error:", err);
  }
}