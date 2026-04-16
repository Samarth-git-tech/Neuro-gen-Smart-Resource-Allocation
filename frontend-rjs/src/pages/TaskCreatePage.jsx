import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiRequest } from "../services/api";
import Toast from "../components/Toast";
import { useNavigate, Link } from "react-router-dom";

const CATEGORIES = ["health", "food", "shelter", "education", "logistics", "security", "sanitation", "other"];
const PRIORITIES  = ["low", "medium", "high"];

export default function TaskCreatePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [aiResult, setAiResult] = useState(null); // show AI output after creation

  const [form, setForm] = useState({ title: "", desc: "", category: "", priority: "", dueDate: "" });

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleChange = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { showToast("Title is required.", "error"); return; }
    setLoading(true);
    setAiResult(null);
    try {
      const result = await apiRequest("/api/tasks/", {
        method: "POST",
        body: JSON.stringify({
          title: form.title,
          desc: form.desc,
          category: form.category || null,
          priority: form.priority || null,
          dueDate: form.dueDate || null,
          status: "pending",
          createdBy: user?.email || "admin",
        }),
      });
      // Show AI analysis result
      setAiResult(result);
      showToast("✅ Task created and AI-assigned!");
      setForm({ title: "", desc: "", category: "", priority: "", dueDate: "" });
    } catch (err) {
      showToast(err.message || "Failed to create task.", "error");
    } finally {
      setLoading(false);
    }
  };

  const parseSafe = (val) => { try { return JSON.parse(val || "[]"); } catch { return []; } };

  return (
    <div className="min-h-[calc(100vh-60px)] bg-gray-100 p-6 md:p-10 animate-fade-in">
      {toast && <Toast message={toast.msg} type={toast.type} />}

      <div className="max-w-[900px] mx-auto flex flex-col gap-6">
        {/* Header with nav CTAs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="inline-block bg-green-100 text-green-800 text-xs font-bold font-nunito px-3 py-1 rounded-full mb-2">
              🤖 AI-Powered Task Engine
            </span>
            <h1 className="text-2xl font-extrabold font-nunito text-gray-800 mb-1">Create New Task</h1>
            <p className="text-sm text-gray-600">Gemini AI auto-classifies category, priority, skills, and assigns the best volunteer.</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <Link to="/ai-board" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold font-nunito hover:bg-indigo-700 transition">
              🤖 AI Board
            </Link>
            <Link to="/inputs" className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-bold font-nunito hover:bg-teal-700 transition">
              📢 Community Input
            </Link>
            <Link to="/dashboard" className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-bold font-nunito hover:bg-gray-50 transition">
              ← Dashboard
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Form Panel */}
          <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8">
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-gray-800 font-nunito">Task Title <span className="text-red-500">*</span></label>
                <input type="text" required value={form.title} onChange={handleChange("title")}
                  placeholder="e.g. Distribute food packets at Sector 5"
                  className="px-4 py-3 border-2 border-gray-300 rounded-lg text-sm focus:border-green-500 focus:ring-4 focus:ring-green-100 transition outline-none" />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-gray-800 font-nunito">
                  Description <span className="text-gray-400 font-normal">(more detail = better AI output)</span>
                </label>
                <textarea value={form.desc} onChange={handleChange("desc")} rows={5}
                  placeholder="Describe the situation, location, number of people affected, urgency..."
                  className="px-4 py-3 border-2 border-gray-300 rounded-lg text-sm focus:border-green-500 focus:ring-4 focus:ring-green-100 transition outline-none resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-gray-800 font-nunito">Category</label>
                  <select value={form.category} onChange={handleChange("category")}
                    className="px-4 py-3 border-2 border-gray-300 rounded-lg text-sm focus:border-green-500 focus:ring-4 focus:ring-green-100 transition outline-none bg-white">
                    <option value="">🤖 Auto-detect by AI</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-bold text-gray-800 font-nunito">Priority</label>
                  <select value={form.priority} onChange={handleChange("priority")}
                    className="px-4 py-3 border-2 border-gray-300 rounded-lg text-sm focus:border-green-500 focus:ring-4 focus:ring-green-100 transition outline-none bg-white">
                    <option value="">🤖 Auto-detect by AI</option>
                    {PRIORITIES.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-gray-800 font-nunito">Due Date <span className="text-gray-400 font-normal">(optional)</span></label>
                <input type="date" value={form.dueDate} onChange={handleChange("dueDate")}
                  className="px-4 py-3 border-2 border-gray-300 rounded-lg text-sm focus:border-green-500 focus:ring-4 focus:ring-green-100 transition outline-none" />
              </div>

              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => navigate("/dashboard")}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg text-sm font-bold font-nunito hover:bg-gray-50 transition">
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 bg-red-500 text-white py-3 rounded-lg text-sm font-bold font-nunito hover:bg-red-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {loading ? (
                    <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Creating + AI Analyzing...</>
                  ) : "🚀 Create Task"}
                </button>
              </div>
            </form>
          </div>

          {/* Right-side AI info + Result panel */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* What AI does box */}
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-5">
              <p className="text-sm font-extrabold font-nunito text-indigo-800 mb-3 flex items-center gap-2">🤖 Gemini AI will:</p>
              <ul className="space-y-2 text-sm text-indigo-700">
                {[
                  "Classify the task category",
                  "Determine priority level",
                  "Extract a problem summary",
                  "Identify required skills",
                  "List needed resources",
                  "Auto-assign best volunteer",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-indigo-200 rounded-full flex items-center justify-center text-indigo-700 font-bold text-[10px] shrink-0">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* AI Result after creation */}
            {aiResult && (
              <div className="bg-white border-2 border-green-300 rounded-xl p-5 animate-slide-up">
                <p className="text-sm font-extrabold font-nunito text-green-800 mb-4 flex items-center gap-2">
                  ✅ AI Analysis Result
                </p>
                <div className="flex flex-col gap-3 text-sm">
                  <div className="flex justify-between"><span className="font-bold text-gray-600">Category</span><span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-bold font-nunito uppercase">{aiResult.category}</span></div>
                  <div className="flex justify-between"><span className="font-bold text-gray-600">Priority</span><span className={`px-2 py-0.5 rounded-full text-xs font-bold font-nunito uppercase ${aiResult.priority === "high" ? "bg-red-100 text-red-700" : aiResult.priority === "medium" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>{aiResult.priority}</span></div>
                  <div className="flex justify-between"><span className="font-bold text-gray-600">Status</span><span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-bold font-nunito uppercase">{aiResult.status}</span></div>

                  {aiResult.problem && (
                    <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Problem Summary</p>
                      <p className="text-gray-700 italic text-xs">{aiResult.problem}</p>
                    </div>
                  )}

                  {parseSafe(aiResult.skills_required).length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Required Skills</p>
                      <div className="flex flex-wrap gap-1">
                        {parseSafe(aiResult.skills_required).map((s, i) => <span key={i} className="bg-blue-100 text-blue-700 text-[11px] font-bold px-2 py-0.5 rounded-full">{s}</span>)}
                      </div>
                    </div>
                  )}

                  {parseSafe(aiResult.resources_required).length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Resources Needed</p>
                      <div className="flex flex-wrap gap-1">
                        {parseSafe(aiResult.resources_required).map((r, i) => <span key={i} className="bg-orange-100 text-orange-700 text-[11px] font-bold px-2 py-0.5 rounded-full">{r}</span>)}
                      </div>
                    </div>
                  )}

                  {aiResult.assignedVolunteers && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Assigned To</p>
                      <p className="text-green-800 font-bold font-nunito">👤 {aiResult.assignedVolunteers}</p>
                    </div>
                  )}

                  <Link to="/dashboard" className="text-center bg-red-500 text-white py-2 rounded-lg text-sm font-bold font-nunito hover:bg-red-600 transition mt-2 block">
                    View in Dashboard →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
