import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { fetchAllTasks, updateTaskStatus, apiRequest, reassignTask, updateTaskPriority, forceAssignUser } from "../../services/api";
import { getDeadlineDisplay } from "../../utils/helpers";

// --- Helper Utilities ---
const getPriorityClass = (p) => {
  if (p === "high") return "bg-red-100 text-red-700";
  if (p === "medium") return "bg-yellow-100 text-yellow-700";
  return "bg-green-100 text-green-700";
};

const getStatusClass = (s) => {
  if (s === "active") return "bg-green-100 text-green-700";
  if (s === "done" || s === "completed") return "bg-blue-100 text-blue-700";
  if (s === "pending") return "bg-orange-100 text-orange-700";
  if (s === "assigned") return "bg-purple-100 text-purple-700";
  return "bg-gray-100 text-gray-700";
};

const getRoleBadge = (r) => {
  if (r === "admin") return "bg-green-100 text-green-800";
  if (r === "volunteer") return "bg-blue-100 text-blue-800";
  if (r === "helper") return "bg-orange-100 text-orange-800";
  return "bg-gray-100 text-gray-800";
};

const STATUS_ICON = { pending: "⏳", assigned: "📌", active: "🔄", completed: "✅", done: "✅" };

function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-10 h-10 border-4 border-gray-200 border-t-green-700 rounded-full animate-spin" />
      <p className="text-sm font-nunito font-bold text-gray-500">Loading data…</p>
    </div>
  );
}

// --- AI Details Sub-component ---
function AITaskDetails({ task }) {
  let skills = [];
  let resources = [];
  try { skills = JSON.parse(task.skills_required || "[]"); } catch { skills = []; }
  try { resources = JSON.parse(task.resources_required || "[]"); } catch { resources = []; }

  if (!task.problem && skills.length === 0 && resources.length === 0) return null;

  return (
    <div className="mt-2 p-3 bg-indigo-50/60 border border-indigo-100 rounded-lg text-xs flex flex-col gap-2">
      <p className="font-bold text-indigo-700 uppercase tracking-wider text-[10px]">🤖 AI Analysis</p>
      {task.problem && <p className="text-gray-700 italic">📎 {task.problem}</p>}
      {skills.length > 0 && (
        <div>
          <p className="font-bold text-gray-500 mb-1">Required Skills</p>
          <div className="flex flex-wrap gap-1">
            {skills.map((s, i) => <span key={i} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">{s}</span>)}
          </div>
        </div>
      )}
      {resources.length > 0 && (
        <div>
          <p className="font-bold text-gray-500 mb-1">Resources Needed</p>
          <div className="flex flex-wrap gap-1">
            {resources.map((r, i) => <span key={i} className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold">{r}</span>)}
          </div>
        </div>
      )}
    </div>
  );
}

// --- Assignment Reason Sub-component ---
function AssignmentReason({ task }) {
  if (!task.assignedVolunteers && !task.assigned_to_id) return null;

  return (
    <div className="mt-1 px-3 py-2 bg-green-50 border border-green-100 rounded-lg text-[11px] text-green-800 font-bold font-nunito flex flex-wrap gap-2 items-center">
      <span>💡 {task.assignment_reason || "Assigned based on constraints"}</span>
    </div>
  );
}

// --- Main Component ---
export default function AdminDashboard() {
  const { user } = useAuth();
  const userName = localStorage.getItem("userName") || user?.email?.split("@")[0] || "Admin";
  const groupName = localStorage.getItem("userGroupName") || "Digi-Sahaay Group";
  const cityLabel = localStorage.getItem("userCity") || "—";
  const category  = localStorage.getItem("userCategory") || "—";

  const [stats, setStats] = useState({ totalMembers: 0, volunteers: 0, helpers: 0, activeTasks: 0, completed: 0, pending: 0, assigned: 0 });
  const [members, setMembers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const [usersData, tasksData] = await Promise.all([
        apiRequest("/api/users/"),
        fetchAllTasks(),
      ]);
      setMembers(usersData);
      setTasks(tasksData);
      setStats({
        totalMembers: usersData.length,
        volunteers: usersData.filter((u) => u.role === "volunteer").length,
        helpers: usersData.filter((u) => u.role === "helper").length,
        activeTasks: tasksData.filter((t) => t.status === "active").length,
        completed: tasksData.filter((t) => ["completed", "done"].includes(t.status)).length,
        pending: tasksData.filter((t) => t.status === "pending").length,
        assigned: tasksData.filter((t) => t.status === "assigned").length,
      });
    } catch (err) {
      setError(err.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => { loadData(); }, [loadData]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleStatusChange = async (taskId, newStatus) => {
    setActionLoading(taskId);
    try {
      await updateTaskStatus(taskId, newStatus);
      showToast(`Task updated to "${newStatus}" ✓`);
      await loadData();
    } catch (err) {
      showToast(err.message || "Status update failed", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleAdminAction = async (actionFn, ...args) => {
    setActionLoading(args[0]);
    try {
      await actionFn(...args);
      showToast("Admin action applied successfully!");
      await loadData();
    } catch (err) {
      showToast(err.message || "Admin override failed", "error");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-[calc(100vh-60px)] bg-emerald-50/40 p-6 md:p-10 animate-fade-in w-full pb-20 max-w-[1200px] mx-auto">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 px-7 py-3 rounded-full font-nunito font-bold text-sm shadow-xl z-50 animate-fade-in ${toast.type === "success" ? "bg-green-700 text-white" : "bg-red-600 text-white"}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gradient-to-r from-emerald-100 to-green-50 border border-green-200 p-6 md:p-8 rounded-2xl mb-6 shadow-sm gap-4">
        <div>
          <div className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Welcome back, {userName} 🛡️</div>
          <h2 className="text-3xl font-extrabold font-nunito text-gray-800 mb-1">{groupName}</h2>
          <p className="text-sm text-gray-600">📍 {cityLabel} · 🏷️ {category}</p>
        </div>
        {/* Demo CTAs */}
        <div className="flex gap-3 flex-wrap">
          <Link to="/tasks" className="px-5 py-2.5 bg-red-500 text-white rounded-lg text-sm font-bold font-nunito hover:bg-red-600 transition shadow-sm">
            + Create Task
          </Link>
          <Link to="/inputs" className="px-5 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-bold font-nunito hover:bg-teal-700 transition shadow-sm">
            📢 Add Community Input
          </Link>
          <Link to="/ai-board" className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-bold font-nunito hover:bg-indigo-700 transition shadow-sm">
            🤖 View AI Board
          </Link>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6 flex justify-between items-center">
          <p className="text-red-700 font-bold font-nunito text-sm">⚠️ {error}</p>
          <button onClick={loadData} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-bold font-nunito hover:bg-red-600 transition">
            Retry
          </button>
        </div>
      )}

      {/* 7 Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
        {[
          { label: "Members", value: stats.totalMembers, color: "bg-slate-100" },
          { label: "Volunteers", value: stats.volunteers, color: "bg-blue-100" },
          { label: "Helpers", value: stats.helpers, color: "bg-orange-100" },
          { label: "Active Tasks", value: stats.activeTasks, color: "bg-green-100" },
          { label: "Assigned", value: stats.assigned, color: "bg-purple-100" },
          { label: "Completed", value: stats.completed, color: "bg-teal-100" },
          { label: "Pending", value: stats.pending, color: "bg-red-100" },
        ].map((s) => (
          <div key={s.label} className={`${s.color} rounded-xl p-4 text-center shadow-sm hover:-translate-y-0.5 transition-transform`}>
            <div className="text-3xl font-extrabold font-nunito text-gray-900">{s.value}</div>
            <div className="text-[10px] font-bold text-gray-600 mt-1 uppercase tracking-wide">{s.label}</div>
          </div>
        ))}
      </div>

      {loading ? <Spinner /> : (
        <div className="flex flex-col gap-8">
          {/* Members Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-extrabold font-nunito text-gray-800">👥 All Members</h3>
              <Link to="/members" className="px-4 py-1.5 bg-red-500 text-white rounded-full text-xs font-bold font-nunito hover:bg-red-600 transition">
                Manage Members
              </Link>
            </div>

            {members.length === 0 ? (
              <div className="py-10 text-center bg-gray-50 rounded-lg">
                <div className="text-3xl mb-2">👤</div>
                <p className="text-gray-500 text-sm mb-3">No members yet. Start by inviting volunteers.</p>
                <Link to="/register" className="px-4 py-2 bg-red-500 text-white rounded-lg text-xs font-bold font-nunito hover:bg-red-600 transition inline-block">Add Member</Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      {["Name", "Role", "Mobile", "Skills", "Availability"].map((h) => (
                        <th key={h} className="px-4 py-3 font-extrabold font-nunito text-gray-600 uppercase tracking-widest text-xs">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {members.map((m) => (
                      <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-bold text-gray-800">{m.name}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold font-nunito uppercase tracking-wide ${getRoleBadge(m.role)}`}>{m.role}</span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{m.mobile || "—"}</td>
                        <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{m.skills || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold font-nunito inline-flex items-center gap-1 ${m.availability === true || m.availability === "true" || m.availability === "Available" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                            {m.availability === true || m.availability === "true" || m.availability === "Available" ? "✓ Available" : "Busy"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Tasks Table with AI Details */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-extrabold font-nunito text-gray-800">📋 All Tasks</h3>
              <div className="flex gap-2">
                <Link to="/tasks" className="px-4 py-1.5 bg-red-500 text-white rounded-full text-xs font-bold font-nunito hover:bg-red-600 transition">
                  + New Task
                </Link>
                <Link to="/stats" className="px-4 py-1.5 border border-gray-300 text-gray-600 rounded-full text-xs font-bold font-nunito hover:bg-gray-50 transition">
                  View Stats
                </Link>
              </div>
            </div>

            {tasks.length === 0 ? (
              <div className="py-10 text-center bg-gray-50 rounded-lg">
                <div className="text-3xl mb-2">📋</div>
                <p className="text-gray-500 text-sm mb-3">No tasks available. Create the first one to get started!</p>
                <Link to="/tasks" className="px-5 py-2.5 bg-red-500 text-white rounded-lg text-sm font-bold font-nunito hover:bg-red-600 transition inline-block">Create Task</Link>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {tasks.map((t) => {
                  const deadlineInfo = getDeadlineDisplay(t.deadline);
                  const showDeadline = ["active", "assigned", "pending"].includes(t.status);
                  
                  return (
                  <div key={t.id} className={`border ${t.is_emergency === "true" ? "border-red-400 bg-red-50/20" : "border-gray-100 bg-gray-50"} rounded-xl p-4 hover:shadow-sm transition`}>
                    {/* Task Header Row */}
                    <div className="flex flex-wrap gap-2 justify-between items-start mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-extrabold font-nunito text-gray-800 text-base truncate">{t.title}</h4>
                        {showDeadline && deadlineInfo && (
                          <div className={`mt-1 text-xs font-bold font-nunito flex items-center gap-1 ${deadlineInfo.isOverdue ? "text-red-600" : "text-gray-500"}`}>
                            {deadlineInfo.isOverdue ? "⚠️ " : "⏰ "} {deadlineInfo.text}
                          </div>
                        )}
                        {t.desc && <p className="text-xs text-gray-500 mt-0.5 truncate">{t.desc}</p>}
                      </div>
                      <div className="flex gap-2 flex-wrap shrink-0">
                        {t.is_emergency === "true" && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold font-nunito uppercase bg-red-600 text-white animate-pulse">
                            🚨 Emergency
                          </span>
                        )}
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold font-nunito uppercase ${getPriorityClass(t.priority)}`}>{t.priority}</span>
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold font-nunito uppercase inline-flex items-center gap-1 ${getStatusClass(t.status)}`}>
                          {STATUS_ICON[t.status]} {t.status}
                        </span>
                        {t.category && <span className="px-2.5 py-1 rounded-full text-[11px] font-bold font-nunito uppercase bg-gray-200 text-gray-700">{t.category}</span>}
                      </div>
                    </div>

                    {/* Assigned info */}
                    {t.assignedVolunteers && (
                      <p className="text-xs text-gray-600 mb-2">👤 Assigned to: <strong>{t.assignedVolunteers}</strong></p>
                    )}

                    {/* Assignment Reason */}
                    <AssignmentReason task={t} />

                    {/* AI Details */}
                    <AITaskDetails task={t} />

                    {/* Admin Actions */}
                    <div className="flex flex-col sm:flex-row justify-between gap-3 mt-3 pt-3 border-t border-gray-100">
                      {/* State Changes */}
                      <div className="flex gap-2 flex-wrap">
                        {t.status === "assigned" && (
                          <button disabled={actionLoading === t.id} onClick={() => handleStatusChange(t.id, "active")}
                            className="px-4 py-1.5 rounded bg-green-100 text-green-700 text-xs font-bold font-nunito hover:bg-green-200 transition disabled:opacity-50">
                            {actionLoading === t.id ? "…" : "▶ Force Active"}
                          </button>
                        )}
                        {t.status === "active" && (
                          <button disabled={actionLoading === t.id} onClick={() => handleStatusChange(t.id, "completed")}
                            className="px-4 py-1.5 rounded bg-blue-100 text-blue-700 text-xs font-bold font-nunito hover:bg-blue-200 transition disabled:opacity-50">
                            {actionLoading === t.id ? "…" : "✓ Force Complete"}
                          </button>
                        )}
                        {["completed", "done"].includes(t.status) && (
                          <span className="text-green-600 text-xs font-bold">✅ Done</span>
                        )}
                      </div>

                      {/* Power Admin Overrides Panel */}
                      {!["completed", "done"].includes(t.status) && (
                        <div className="flex gap-2 flex-wrap items-center bg-gray-100/50 p-2 rounded-lg border border-gray-200">
                          <span className="text-[10px] uppercase font-bold text-gray-500 mr-2 tracking-widest">Admin Control</span>
                          
                          <select 
                            className="text-[11px] p-1 rounded border border-gray-300 font-bold bg-white"
                            value={t.priority}
                            onChange={(e) => handleAdminAction(updateTaskPriority, t.id, e.target.value)}
                            disabled={actionLoading === t.id}
                          >
                            <option value="high">High</option>
                            <option value="medium">Mod</option>
                            <option value="low">Low</option>
                          </select>

                          <button disabled={actionLoading === t.id} onClick={() => handleAdminAction(reassignTask, t.id)}
                            className="px-2 py-1 rounded bg-white border border-gray-300 text-gray-700 text-[11px] font-bold font-nunito hover:bg-gray-50 transition disabled:opacity-50">
                            🔄 Auto-Reassign
                          </button>
                          
                          <div className="relative group">
                            <select 
                                className="text-[11px] p-1 rounded border-2 border-red-200 text-red-700 bg-red-50 font-bold max-w-[100px]"
                                onChange={(e) => { 
                                  if (e.target.value) handleAdminAction(forceAssignUser, t.id, e.target.value);
                                  e.target.value = "";
                                }}
                                disabled={actionLoading === t.id}
                                defaultValue=""
                              >
                              <option value="" disabled>Force Assign...</option>
                              {members.filter(m => ["volunteer", "helper"].includes(m.role)).map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )})}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
