import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { fetchMyProfile, fetchMyTasks, updateTaskStatus } from "../../services/api";

export default function HelperDashboard() {
  const { user } = useAuth();
  const userName = localStorage.getItem("userName") || user?.email?.split("@")[0] || "Helper";

  const [profile, setProfile] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const myProfile = await fetchMyProfile();
      setProfile(myProfile);
      const myTasks = await fetchMyTasks(myProfile.id);
      setTasks(myTasks);
    } catch (err) {
      console.error("Failed to load helper data:", err);
      showToast("Could not load your tasks. Please refresh.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAction = async (taskId, newStatus, label) => {
    setActionLoading(taskId + newStatus);
    try {
      await updateTaskStatus(taskId, newStatus);
      showToast(`Task ${label} ✓`);
      await loadData();
    } catch (err) {
      showToast(err.message || "Action failed", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const assignedTasks  = tasks.filter((t) => t.status === "assigned");
  const activeTasks    = tasks.filter((t) => t.status === "active");
  const doneTasks      = tasks.filter((t) => ["completed", "done"].includes(t.status));

  const stats = {
    activeTasks: activeTasks.length,
    completed: doneTasks.length,
    pending: assignedTasks.length,
    total: tasks.length,
  };

  const getPriorityClass = (p) => {
    if (p === "high") return "bg-red-100 text-red-700";
    if (p === "medium") return "bg-yellow-100 text-yellow-700";
    return "bg-green-100 text-green-700";
  };

  const getStatusClass = (s) => {
    if (s === "active") return "bg-green-100 text-green-700";
    if (s === "assigned" || s === "pending") return "bg-orange-100 text-orange-700";
    return "bg-blue-100 text-blue-700";
  };

  return (
    <div className="min-h-[calc(100vh-60px)] bg-orange-50/30 p-6 md:p-10 animate-fade-in w-full pb-20 block max-w-[1100px] mx-auto">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 px-7 py-3 rounded-full font-nunito font-bold text-sm shadow-xl z-50 transition-all duration-300 ease-in-out animate-fade-in
          ${toast.type === "success" ? "bg-green-700 text-white" : "bg-red-600 text-white"}`}
        >
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-gradient-to-r from-orange-100 to-amber-50 border border-orange-200 p-6 md:p-8 rounded-2xl mb-8 shadow-sm">
        <div className="mb-4 md:mb-0">
          <div className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Logistics & Supply View 🔧</div>
          <h2 className="text-3xl font-extrabold font-nunito text-gray-800 mb-1">{userName}</h2>
          <p className="text-sm text-gray-600">Managing on-ground operations and distribution tasks.</p>
        </div>
        <Link to="/tasks" className="px-5 py-2.5 bg-orange-600 text-white flex shrink-0 rounded-lg text-sm font-bold font-nunito hover:bg-orange-500 transition shadow-sm">
          + Create Task
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-100 p-5 rounded-xl text-center shadow-sm">
          <div className="text-3xl font-extrabold font-nunito text-blue-900">{stats.activeTasks}</div>
          <div className="text-xs font-semibold text-blue-700 mt-1 uppercase tracking-wide">Active Tasks</div>
        </div>
        <div className="bg-orange-100 p-5 rounded-xl text-center shadow-sm">
          <div className="text-3xl font-extrabold font-nunito text-orange-900">{stats.pending}</div>
          <div className="text-xs font-semibold text-orange-700 mt-1 uppercase tracking-wide">Awaiting Response</div>
        </div>
        <div className="bg-green-100 p-5 rounded-xl text-center shadow-sm">
          <div className="text-3xl font-extrabold font-nunito text-green-900">{stats.completed}</div>
          <div className="text-xs font-semibold text-green-700 mt-1 uppercase tracking-wide">Completed</div>
        </div>
        <div className="bg-teal-100 p-5 rounded-xl text-center shadow-sm">
          <div className="text-3xl font-extrabold font-nunito text-teal-900">{stats.total}</div>
          <div className="text-xs font-semibold text-teal-700 mt-1 uppercase tracking-wide">Total Assigned</div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center text-gray-500">
          ⏳ Loading your tasks…
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          {/* Active / Assigned Feed */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-5 border-b border-gray-100 pb-3">
              <h3 className="text-lg font-extrabold font-nunito text-gray-800">📋 Operations Board</h3>
              <Link to="/tasks" className="px-3 py-1 border border-orange-600 text-orange-600 rounded-full text-xs font-bold font-nunito hover:bg-orange-50 transition">+ New</Link>
            </div>
            
            {tasks.filter((t) => !["completed", "done"].includes(t.status)).length === 0 ? (
              <p className="py-6 text-center text-gray-500 text-sm bg-gray-50 rounded-lg">No active or pending operations.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {tasks
                  .filter((t) => !["completed", "done"].includes(t.status))
                  .map((t) => (
                    <div key={t.id} className="bg-gray-50 border border-gray-200 border-l-4 rounded-lg p-5 flex flex-col md:flex-row gap-4 justify-between shadow-sm"
                      style={{ borderLeftColor: t.priority === "high" ? "#ef4444" : (t.priority === "medium" ? "#f59e0b" : "#22c55e") }}>
                      
                      <div className="flex-1 flex flex-col justify-center">
                        <div className="text-base font-extrabold font-nunito text-gray-800 mb-1">{t.title}</div>
                        <div className="text-xs text-gray-500 mb-2">{t.category} &bull; <span className="font-bold">{t.priority}</span> priority</div>
                        {t.problem && <div className="text-xs italic text-gray-500 mb-2 truncate">📎 {t.problem}</div>}
                        {t.desc && <div className="text-sm text-gray-700">{t.desc}</div>}
                        
                        {/* Resource tags automatically decoded */}
                        {t.resources_required && (() => {
                          try {
                            const res = JSON.parse(t.resources_required || "[]");
                            return res.length > 0 ? (
                              <div className="mt-3 flex gap-2 flex-wrap">
                                <span className="text-[11px] font-bold text-gray-400 mt-1 uppercase">Boxes:</span>
                                {res.map((r, i) => (
                                  <span key={i} className="bg-white border border-gray-200 text-orange-700 text-[11px] font-bold px-2 py-0.5 rounded shadow-sm">{r}</span>
                                ))}
                              </div>
                            ) : null;
                          } catch { return null; }
                        })()}
                      </div>
                      
                      <div className="flex md:flex-col items-center md:items-end justify-between gap-3 min-w-[120px] pt-3 md:pt-0 border-t md:border-t-0 border-gray-200">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold font-nunito uppercase tracking-wide ${getStatusClass(t.status)}`}>
                          {t.status}
                        </span>

                        {t.status === "assigned" && (
                          <div className="flex gap-2 w-full md:flex-col">
                            <button
                              className="bg-green-600 text-white px-3 py-1.5 rounded text-xs font-bold font-nunito hover:bg-green-500 transition shadow-sm flex-1 md:w-full"
                              disabled={actionLoading === t.id + "active"}
                              onClick={() => handleAction(t.id, "active", "accepted")}
                            >
                              {actionLoading === t.id + "active" ? "…" : "✓ Accept"}
                            </button>
                            <button
                              className="bg-white border border-red-500 text-red-500 px-3 py-1.5 rounded text-xs font-bold font-nunito hover:bg-red-50 transition shadow-sm flex-1 md:w-full"
                              disabled={actionLoading === t.id + "pending"}
                              onClick={() => handleAction(t.id, "pending", "rejected")}
                            >
                              {actionLoading === t.id + "pending" ? "…" : "✕ Pass"}
                            </button>
                          </div>
                        )}

                        {t.status === "active" && (
                          <button
                            className="bg-blue-600 text-white px-4 py-2 mt-auto rounded text-xs font-bold font-nunito hover:bg-blue-500 transition shadow-sm w-full"
                            disabled={actionLoading === t.id + "completed"}
                            onClick={() => handleAction(t.id, "completed", "completed")}
                          >
                            {actionLoading === t.id + "completed" ? "…" : "✅ Validate Done"}
                          </button>
                        )}
                      </div>

                    </div>
                ))}
              </div>
            )}
          </div>

          {/* Completed History Feed side by side on desktop */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-5 border-b border-gray-100 pb-3">
              <h3 className="text-lg font-extrabold font-nunito text-gray-800">📜 Delivered / Complete</h3>
              <span className="bg-green-100 text-green-800 font-bold px-3 py-1 rounded-full text-xs">{doneTasks.length}</span>
            </div>
            
            {doneTasks.length === 0 ? (
              <p className="py-6 text-center text-gray-500 text-sm bg-gray-50 rounded-lg">Logistics history clear.</p>
            ) : (
              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      <th className="px-3 py-2 font-extrabold font-nunito text-gray-600 uppercase tracking-widest text-[10px]">Operation</th>
                      <th className="px-3 py-2 font-extrabold font-nunito text-gray-600 uppercase tracking-widest text-[10px]">Context</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {doneTasks.map((t) => (
                      <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-3 max-w-[180px]">
                          <div className="font-bold text-gray-800 truncate" title={t.title}>{t.title}</div>
                        </td>
                        <td className="px-3 py-3">
                           <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-nunito uppercase ${getPriorityClass(t.priority)} mr-2`}>
                            {t.priority}
                          </span>
                          <span className="text-gray-500 text-xs">{t.category}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
        </div>
      )}
    </div>
  );
}
