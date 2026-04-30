import { useState } from "react";
import { Link, useNavigate, Navigate } from "react-router-dom";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../firebase";
import { useAuth } from "../context/AuthContext";
import Toast from "../components/Toast";
import { API_BASE } from "../services/api";

export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, setRole, loading: authLoading } = useAuth();

  const [selectedRole, setSelectedRole] = useState("volunteer");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");

  // ── Already logged in — skip the login page entirely ──
  // Only redirect if NOT in the middle of a login call
  if (isAuthenticated && !authLoading) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Step 1: Firebase sign-in
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();

      // Step 2: Verify against backend + get real DB role
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        await signOut(auth); // Prevent ghost sessions if backend rejects
        const err = await response.json().catch(() => ({}));
        throw new Error(err.detail || "Login failed — account not found in system.");
      }

      const dbUser = await response.json();

      // Step 3: Persist REAL role from DB (not UI selection)
      const realRole = dbUser.role || selectedRole;
      setRole(realRole);
      if (dbUser.name) localStorage.setItem("userName", dbUser.name);

      // Step 4: Navigate — AuthContext will also sync via onAuthStateChanged
      navigate("/dashboard", { replace: true });

    } catch (err) {
      setError(err.message || "Failed to log in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-60px)] bg-gray-100 flex items-start justify-center p-6 md:p-10 animate-fade-in">
      {error && <Toast message={error} type="error" />}

      <div className="bg-white rounded-[12px] p-8 md:p-10 w-full max-w-[480px] shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-gray-200">
        <span className="inline-block bg-green-100 text-green-800 text-xs font-bold font-nunito px-3 py-1 rounded-full mb-3">
          Step 1 of 1
        </span>

        <h2 className="text-2xl font-extrabold text-gray-800 font-nunito mb-1">Welcome Back!</h2>
        <p className="text-gray-600 text-sm mb-7">Sign in to your Digi-Sahaay account.</p>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          {/* Role hint — informational only, actual role comes from DB */}
          <div className="flex bg-gray-100 p-1.5 rounded-lg mb-2">
            {[
              { id: "admin",     icon: "🛡️", label: "Admin" },
              { id: "volunteer", icon: "🙋", label: "Volunteer" },
              { id: "helper",    icon: "🔧", label: "Staff" },
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedRole(r.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 p-2 rounded-md font-nunito font-bold text-sm transition-all ${
                  selectedRole === r.id
                    ? "bg-white text-green-800 shadow-sm"
                    : "text-gray-500 hover:text-gray-800 hover:bg-white/50"
                }`}
              >
                <span className="text-base">{r.icon}</span> {r.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-gray-800 font-nunito">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-3.5 py-2.5 border-2 border-gray-300 rounded-lg text-sm focus:border-green-500 focus:ring-4 focus:ring-green-100 transition outline-none"
              placeholder="you@email.com"
            />
          </div>

          <div className="flex flex-col gap-1.5 mb-2">
            <label className="text-sm font-bold text-gray-800 font-nunito">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-3.5 py-2.5 border-2 border-gray-300 rounded-lg text-sm focus:border-green-500 focus:ring-4 focus:ring-green-100 transition outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-700 text-white py-3 rounded-lg text-[15px] font-bold font-nunito hover:bg-green-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Signing in…
              </>
            ) : "Log In"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Don't have an account?{" "}
          <Link to="/register" className="text-green-700 font-bold hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
