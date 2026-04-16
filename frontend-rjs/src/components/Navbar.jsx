import { useNavigate, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

const ADMIN_LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/tasks",     label: "Create Task" },
  { to: "/inputs",    label: "Community" },
  { to: "/ai-board",  label: "AI Board" },
  { to: "/map",       label: "Map" },
  { to: "/stats",     label: "Stats" },
  { to: "/members",   label: "Members" },
];

const VOLUNTEER_LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/inputs",    label: "Report Need" },
];

const HELPER_LINKS = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/tasks",     label: "Create Task" },
  { to: "/inputs",    label: "Community" },
  { to: "/map",       label: "Map" },
];

export default function Navbar() {
  const navigate = useNavigate();
  const { user, logout, role } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks =
    role === "admin"   ? ADMIN_LINKS :
    role === "helper"  ? HELPER_LINKS :
    VOLUNTEER_LINKS;

  const handleLogout = async () => {
    try {
      await logout(); // AuthContext.logout clears localStorage too
      navigate("/login");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-[1200px] mx-auto px-6 py-3 flex justify-between items-center gap-4">
        {/* Brand */}
        <div onClick={() => navigate("/")}
          className="font-nunito font-extrabold text-lg text-green-800 cursor-pointer hover:text-green-600 transition-colors shrink-0">
          Digi-Sahaay
        </div>

        {/* Desktop Nav Links */}
        {user && (
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <NavLink key={link.to} to={link.to}
                className={({ isActive }) =>
                  `px-3 py-1.5 rounded-md text-sm font-bold font-nunito transition-colors ${
                    isActive
                      ? "bg-green-100 text-green-800"
                      : "text-gray-600 hover:text-green-700 hover:bg-green-50"
                  }`
                }>
                {link.label}
              </NavLink>
            ))}
          </div>
        )}

        {/* User Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {user ? (
            <>
              <div className="hidden sm:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-3 py-1 text-sm font-bold font-nunito">
                <span className="text-gray-700">{user.email?.split("@")[0]}</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-green-100 text-green-800 uppercase tracking-wider">
                  {role}
                </span>
              </div>
              <button onClick={handleLogout}
                className="px-4 py-1.5 border border-red-400 text-red-500 rounded-md text-sm font-bold font-nunito hover:bg-red-50 transition-colors">
                Sign Out
              </button>
            </>
          ) : (
            <button onClick={() => navigate("/login")}
              className="px-5 py-2 bg-green-700 text-white rounded-md text-sm font-bold font-nunito hover:bg-green-600 transition-colors shadow-sm">
              Sign In
            </button>
          )}

          {/* Mobile hamburger */}
          {user && (
            <button onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden flex flex-col gap-1 p-2 rounded-md hover:bg-gray-100 transition">
              <span className="block w-5 h-0.5 bg-gray-700"></span>
              <span className="block w-5 h-0.5 bg-gray-700"></span>
              <span className="block w-5 h-0.5 bg-gray-700"></span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {menuOpen && user && (
        <div className="md:hidden border-t border-gray-100 bg-white px-6 py-3 flex flex-col gap-1 animate-fade-in">
          {navLinks.map((link) => (
            <NavLink key={link.to} to={link.to} onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `px-3 py-2.5 rounded-md text-sm font-bold font-nunito transition-colors block ${
                  isActive ? "bg-green-100 text-green-800" : "text-gray-700 hover:bg-gray-50"
                }`
              }>
              {link.label}
            </NavLink>
          ))}
        </div>
      )}
    </nav>
  );
}
