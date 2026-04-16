import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { auth } from "../firebase";

/**
 * Register a new user with email and password.
 * Returns the Firebase user object on success.
 */
export async function registerUser(email, password) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

/**
 * Sign in an existing user with email and password.
 * Returns the Firebase user object on success.
 */
export async function loginUser(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

/**
 * Sign out the current user.
 */
export async function logoutUser() {
  await signOut(auth);
}

/**
 * Get the Firebase ID token for the currently signed-in user.
 * This token can be sent to the backend for verification.
 */
export async function getIdToken() {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("No user is currently signed in.");
  }
  const token = await user.getIdToken();
  return token;
}

/**
 * Subscribe to auth state changes.
 * Returns an unsubscribe function.
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Parse Firebase auth error codes into human-readable messages.
 */
export function getAuthErrorMessage(errorCode) {
  const errorMap = {
    "auth/email-already-in-use": "This email is already registered. Try signing in.",
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/weak-password": "Password must be at least 6 characters.",
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password. Please try again.",
    "auth/invalid-credential": "Invalid email or password. Please check and try again.",
    "auth/too-many-requests": "Too many attempts. Please wait and try again.",
    "auth/network-request-failed": "Network error. Check your connection.",
    "auth/user-disabled": "This account has been disabled.",
  };

  return errorMap[errorCode] || "An unexpected error occurred. Please try again.";
}
