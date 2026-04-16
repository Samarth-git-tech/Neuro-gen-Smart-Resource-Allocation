import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

/**
 * ProtectedRoute
 * ──────────────
 * Wraps protected routes — redirects to /login if no user is authenticated.
 *
 * The `stable` guard prevents a flash-redirect to /login right after login/register.
 * Firebase's onAuthStateChanged is async — without this, the component briefly
 * sees isAuthenticated=false while auth state propagates, then immediately redirects.
 *
 * The 300ms timeout is intentional: it gives Firebase + the AuthContext backend
 * role-fetch enough time to settle before making an auth decision.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const [stable, setStable] = useState(false);

  useEffect(() => {
    if (!loading) {
      // 300ms gives the Firebase auth + backend role-fetch time to settle
      const t = setTimeout(() => setStable(true), 300);
      return () => clearTimeout(t);
    }
  }, [loading]);

  // Show loading spinner until auth is fully settled
  if (loading || !stable) {
    return (
      <div className="min-h-[calc(100vh-60px)] bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 max-w-sm w-full text-center animate-fade-in">
          <div className="inline-block w-10 h-10 border-4 border-gray-200 border-t-green-700 rounded-full animate-spin mb-5" />
          <p className="text-gray-700 font-nunito font-bold">Authenticating…</p>
          <p className="text-gray-400 font-nunito text-xs mt-1">Syncing your session</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
