import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { fetchMyProfile, fetchMyTasks, updateTaskStatus } from "../../services/api";
import { getVolunteerLevel, getDeadlineDisplay } from "../../utils/helpers";

function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
      <p className="text-sm font-nunito font-bold text-gray-500">Loading your tasks…</p>
    </div>
  );
}

// AI Fields shown on each task card
function AITaskCard({ task, onAccept, onReject, onComplete, actionLoading }) {
  let skills = [];
  let resources = [];
  try { skills = JSON.parse(task.skills_required || "[]"); } catch { skills = []; }
  try { resources = JSON.parse(task.resources_required || "[]"); } catch { resources = []; }

  const priorityBorder = task.priority === "high" ? "border-red-400" : task.priority === "medium" ? "border-orange-400" : "border-green-400";
  const isAssigned = task.status === "assigned";
  const isActive = task.status === "active";
  const deadlineInfo = getDeadlineDisplay(task.deadline);

  return (
    <div className={`bg-white border-2 ${priorityBorder} rounded-xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition`}>
      {/* Badges row */}
      <div className="flex flex-wrap gap-2">
        {task.is_emergency === "true" && (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold font-nunito uppercase bg-red-600 text-white animate-pulse">
            🚨 Emergency Task
          </span>
        )}
        {task.priority && (
          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold font-nunito uppercase ${task.priority === "high" ? "bg-red-100 text-red-700" : task.priority === "medium" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"}`}>
            {task.priority}
          </span>
        )}
        {task.category && (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold font-nunito uppercase bg-gray-100 text-gray-700">{task.category}</span>
        )}
        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold font-nunito uppercase inline-flex items-center gap-1 ml-auto ${isAssigned ? "bg-purple-100 text-purple-700" : isActive ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
          {isAssigned ? "📌 Awaiting Response" : isActive ? "🔄 In Progress" : "✅ Completed"}
        </span>
      </div>

      {/* Title */}
      <h3 className="text-base font-extrabold font-nunito text-gray-800">{task.title}</h3>
      
      {/* Deadline Info */}
      {deadlineInfo && (isActive || isAssigned) && (
        <div className={`text-xs font-bold font-nunito flex items-center gap-1 ${deadlineInfo.isOverdue ? "text-red-600" : "text-gray-500"}`}>
          {deadlineInfo.isOverdue ? "⚠️ " : "⏰ "}
          {deadlineInfo.text}
        </div>
      )}

      {/* Assignment reason from Backend */}
      {task.assignment_reason && (
        <div className="px-3 py-2 bg-green-50 border border-green-100 rounded-lg text-[11px] text-green-800 font-bold font-nunito flex flex-wrap gap-2 items-center">
          <span className="w-full sm:w-auto">💡 {task.assignment_reason}</span>
        </div>
      )}

      {/* Problem summary */}
      {task.problem && (
        <p className="text-sm text-gray-600 italic bg-gray-50 border border-gray-100 rounded-lg p-2">📎 {task.problem}</p>
      )}

      {task.desc && <p className="text-sm text-gray-700">{task.desc}</p>}

      {/* AI Analysis Section */}
      {(skills.length > 0 || resources.length > 0) && (
        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex flex-col gap-2">
          <p className="text-[10px] font-extrabold font-nunito text-indigo-600 uppercase tracking-wider">🤖 AI Analysis</p>
          {skills.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Required Skills</p>
              <div className="flex flex-wrap gap-1">
                {skills.map((s, i) => <span key={i} className="bg-blue-100 text-blue-700 text-[11px] font-bold px-2 py-0.5 rounded-full">{s}</span>)}
              </div>
            </div>
          )}
          {resources.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Resources Needed</p>
              <div className="flex flex-wrap gap-1">
                {resources.map((r, i) => <span key={i} className="bg-orange-100 text-orange-700 text-[11px] font-bold px-2 py-0.5 rounded-full">{r}</span>)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      {isAssigned && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100">
          <button onClick={onAccept} disabled={actionLoading}
            className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm font-bold font-nunito hover:bg-green-500 transition disabled:opacity-50 text-center">
            {actionLoading === `${task.id}active` ? "…" : "✓ Accept Mission"}
          </button>
          <button onClick={onReject} disabled={actionLoading}
            className="flex-1 bg-white border-2 border-red-500 text-red-500 py-2 rounded-lg text-sm font-bold font-nunito hover:bg-red-50 transition disabled:opacity-50 text-center">
            {actionLoading === `${task.id}pending` ? "…" : "✕ Reject / Pass"}
          </button>
        </div>
      )}

      {isActive && (
        <div className="pt-2 border-t border-gray-100">
          <button onClick={onComplete} disabled={actionLoading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-bold font-nunito hover:bg-blue-500 transition disabled:opacity-50">
            {actionLoading === `${task.id}completed` ? "…" : "✅ Mark as Complete"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function VolunteerDashboard() {
  const { user } = useAuth();
  const userName = localStorage.getItem("userName") || user?.email?.split("@")[0] || "Volunteer";

  const [profile, setProfile] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);

  const score = 175;
  const levelInfo = getVolunteerLevel(score);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const myProfile = await fetchMyProfile();
      setProfile(myProfile);
      const myTasks = await fetchMyTasks(myProfile.id);
      setTasks(myTasks);
    } catch (err) {
      setError(err.message || "Could not load your tasks.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // Auto-refresh every 5s
  useEffect(() => {
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [loadData]);

  const handleAction = async (taskId, newStatus, label) => {
    setActionLoading(`${taskId}${newStatus}`);
    try {
      await updateTaskStatus(taskId, newStatus);
      if (newStatus === "completed") {
        showToast(`🎉 Feedback logged: Task completed successfully!`);
      } else {
        showToast(`Task ${label} ✓`);
      }
      await loadData();
    } catch (err) {
      showToast(err.message || "Action failed", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const assignedTasks = tasks.filter((t) => t.status === "assigned");
  const activeTasks   = tasks.filter((t) => t.status === "active");
  const doneTasks     = tasks.filter((t) => ["completed", "done"].includes(t.status));

  return (
    <div className="min-h-[calc(100vh-60px)] bg-blue-50/40 p-6 md:p-10 animate-fade-in w-full pb-20 max-w-[1000px] mx-auto">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 px-7 py-3 rounded-full font-nunito font-bold text-sm shadow-xl z-50 animate-fade-in ${toast.type === "success" ? "bg-green-700 text-white" : "bg-red-600 text-white"}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-gradient-to-r from-blue-100 to-indigo-50 border border-blue-200 p-6 md:p-8 rounded-2xl mb-6 shadow-sm gap-4">
        <div>
          <div className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Your Volunteer Profile 🙋</div>
          <h2 className="text-3xl font-extrabold font-nunito text-gray-800 mb-1">{userName}</h2>
          <p className="text-sm text-gray-600">Every task brings impact. Keep it up!</p>
          {profile?.skills && (
            <div className="flex flex-wrap gap-1 mt-2">
              {profile.skills.split(",").map((s, i) => (
                <span key={i} className="bg-blue-100 text-blue-700 text-[11px] font-bold px-2 py-0.5 rounded-full">{s.trim()}</span>
              ))}
            </div>
          )}
        </div>
        {/* CTA Buttons */}
        <div className="flex flex-col gap-2 shrink-0">
          <Link to="/inputs" className="px-5 py-2.5 bg-red-500 text-white rounded-lg text-sm font-bold font-nunito hover:bg-red-600 transition shadow-sm text-center">
            📢 Add Community Input
          </Link>
          <Link to="/ai-board" className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-bold font-nunito hover:bg-indigo-700 transition shadow-sm text-center">
            🤖 View AI Board
          </Link>
          <div className="bg-white p-3 rounded-xl shadow-sm border border-blue-100 text-center">
            <div className="text-2xl font-extrabold font-nunito text-blue-700">{score}</div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Points · {levelInfo.level}</div>
          </div>
        </div>
      </div>

      {/* Level Bar */}
      <div className="mb-6">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 transition-all duration-700" style={{ width: `${levelInfo.progress}%` }} />
        </div>
        <span className="text-xs font-bold text-gray-500 mt-1 block">Progress to next level: {levelInfo.progress}%</span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-orange-100 p-5 rounded-xl text-center shadow-sm"><div className="text-3xl font-extrabold font-nunito text-orange-900">{assignedTasks.length}</div><div className="text-xs font-bold text-orange-700 mt-1 uppercase tracking-wide">New Assignments</div></div>
        <div className="bg-blue-100 p-5 rounded-xl text-center shadow-sm"><div className="text-3xl font-extrabold font-nunito text-blue-900">{activeTasks.length}</div><div className="text-xs font-bold text-blue-700 mt-1 uppercase tracking-wide">In Progress</div></div>
        <div className="bg-green-100 p-5 rounded-xl text-center shadow-sm"><div className="text-3xl font-extrabold font-nunito text-green-900">{doneTasks.length}</div><div className="text-xs font-bold text-green-700 mt-1 uppercase tracking-wide">Completed</div></div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6 flex justify-between items-center">
          <p className="text-red-700 font-bold font-nunito text-sm">⚠️ {error}</p>
          <button onClick={loadData} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-bold font-nunito hover:bg-red-600 transition">Retry</button>
        </div>
      )}

      {loading ? <Spinner /> : (
        <div className="flex flex-col gap-8">

          {/* New Assignments */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-5 border-b border-gray-100 pb-3">
              <h3 className="text-lg font-extrabold font-nunito text-gray-800">📌 New Assignments</h3>
              <span className="bg-orange-100 text-orange-800 font-bold px-3 py-1 rounded-full text-xs">{assignedTasks.length}</span>
            </div>
            {assignedTasks.length === 0 ? (
              <div className="py-8 text-center bg-gray-50 rounded-lg">
                <div className="text-3xl mb-2">🎉</div>
                <p className="text-gray-500 text-sm">No new assignments right now. Check back soon!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {assignedTasks.map((t) => (
                  <AITaskCard key={t.id} task={t}
                    actionLoading={actionLoading}
                    onAccept={() => handleAction(t.id, "active", "accepted")}
                    onReject={() => handleAction(t.id, "pending", "rejected")}
                    onComplete={() => handleAction(t.id, "completed", "completed")}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Active Tasks */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-5 border-b border-gray-100 pb-3">
              <h3 className="text-lg font-extrabold font-nunito text-gray-800">🔄 Active Tasks</h3>
              <span className="bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-full text-xs">{activeTasks.length}</span>
            </div>
            {activeTasks.length === 0 ? (
              <div className="py-8 text-center bg-gray-50 rounded-lg">
                <p className="text-gray-500 text-sm">No tasks in progress. Accept an assignment above!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {activeTasks.map((t) => (
                  <AITaskCard key={t.id} task={t}
                    actionLoading={actionLoading}
                    onAccept={() => {}}
                    onReject={() => {}}
                    onComplete={() => handleAction(t.id, "completed", "completed")}
                  />
                ))}
              </div>
            )}
          </div>

          {/* History */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-center mb-5 border-b border-gray-100 pb-3">
              <h3 className="text-lg font-extrabold font-nunito text-gray-800">📜 Completed History</h3>
              <span className="bg-green-100 text-green-800 font-bold px-3 py-1 rounded-full text-xs">{doneTasks.length}</span>
            </div>
            {doneTasks.length === 0 ? (
              <div className="py-8 text-center bg-gray-50 rounded-lg">
                <div className="text-3xl mb-2">💪</div>
                <p className="text-gray-500 text-sm">No completed tasks yet — go crush it!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-gray-50 border-b-2 border-gray-200">
                    <tr>
                      {["Task", "Category", "Priority", "Status"].map((h) => (
                        <th key={h} className="px-4 py-3 font-extrabold font-nunito text-gray-600 uppercase tracking-widest text-xs">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {doneTasks.map((t) => (
                      <tr key={t.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-bold text-gray-800 max-w-[200px] truncate">{t.title}</td>
                        <td className="px-4 py-3 text-gray-600">{t.category}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${t.priority === "high" ? "bg-red-100 text-red-700" : t.priority === "medium" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>{t.priority}</span></td>
                        <td className="px-4 py-3"><span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-[11px] font-bold font-nunito uppercase">✅ completed</span></td>
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
