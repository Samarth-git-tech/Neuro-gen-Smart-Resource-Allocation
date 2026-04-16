import { createContext, useContext, useState, useEffect } from "react";
import { onAuthChange, logoutUser } from "../services/auth";
import { auth } from "../firebase";


const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [role, setRoleState] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      setLoading(true);
      setError(null);

      if (firebaseUser) {
        try {
          const token = await firebaseUser.getIdToken(true);

          const res = await fetch("http://localhost:8000/api/auth/login", {
            method: "POST",
            headers: { Authorization: `Bearer ${token}` },
          });

          if (!res.ok) {
            if (res.status === 404) {
              setError("User not registered");
              setRoleState(null);
              setUser(firebaseUser);
              setLoading(false);
              return;
            } else {
              setError("Backend auth failed");
              setRoleState(null);
              setUser(firebaseUser);
              setLoading(false);
              return;
            }
          } else {
            const dbUser = await res.json();
            setRoleState(dbUser.role);
            localStorage.setItem("userRole", dbUser.role);
          }

          setUser(firebaseUser);

        } catch (err) {
          console.error("Auth error:", err);
          setError(err.message);
          setRoleState(null);
          setUser(firebaseUser);
        }
      } else {
        setUser(null);
        setRoleState(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /** Manually update role (called right after backend register completes) */
  const setRole = (newRole) => {
    localStorage.setItem("userRole", newRole);
    setRoleState(newRole);
  };

  const logout = async () => {
    await logoutUser();
    localStorage.removeItem("userRole");
    localStorage.removeItem("userName");
    setUser(null);
    setRoleState("volunteer");
  };

  /** Return the current user's Firebase ID token (fresh) */
  const getToken = async () => {
    if (!auth.currentUser) throw new Error("Not authenticated");
    return auth.currentUser.getIdToken();
  };

  const value = {
    user,
    loading,
    role,
    error,
    setRole,
    logout,
    getToken,
    // legacy alias used in LoginPage
    refreshToken: getToken,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
