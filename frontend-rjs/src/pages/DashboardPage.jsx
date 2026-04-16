import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import AdminDashboard from "./dashboards/AdminDashboard";
import VolunteerDashboard from "./dashboards/VolunteerDashboard";
import HelperDashboard from "./dashboards/HelperDashboard";
import AIBoardPage from "./AIBoardPage";

const ROLE_META = {
  admin: { label: "Admin Dashboard", icon: "🛡️" },
  volunteer: { label: "Volunteer Dashboard", icon: "🙋" },
  helper: { label: "Staff Dashboard", icon: "🔧" },
};

function RoleDashboard({ role }) {
  switch (role) {
    case "admin":
      return <AdminDashboard />;
    case "helper":
      return <HelperDashboard />;
    case "volunteer":
      return <VolunteerDashboard />;
    default:
      return <div className="p-6">Invalid role</div>;
  }
}

export default function DashboardPage() {
  const { role, loading, error } = useAuth(); // 🔥 IMPORTANT
  const [activeTab, setActiveTab] = useState("dashboard");

  // 🔥 LOADING STATE
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        Loading dashboard...
      </div>
    );
  }

  // 🔥 ERROR STATE
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-red-600">
        Error: {error}
      </div>
    );
  }

  // 🔥 ROLE NOT READY / USER NOT REGISTERED
  if (!role) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-600">
        User not registered. Please register first.
      </div>
    );
  }

  const meta = ROLE_META[role] || ROLE_META.volunteer;

  const tabs = [
    { id: "dashboard", label: meta.label, icon: meta.icon },
    { id: "ai-board", label: "AI Board", icon: "🤖" },
  ];

  return (
    <div className="min-h-[calc(100vh-60px)] bg-gray-50 flex flex-col">

      {/* TAB BAR */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-[60px] z-40">
        <div className="max-w-[1200px] mx-auto px-6 flex items-center gap-1 py-2">

          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mr-3 hidden sm:inline">
            View:
          </span>

          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold
                ${activeTab === tab.id
                  ? "bg-green-700 text-white"
                  : "text-gray-600 hover:bg-gray-100"}
              `}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1">
        {activeTab === "dashboard"
          ? <RoleDashboard role={role} />
          : <AIBoardPage />
        }
      </div>
    </div>
  );
}