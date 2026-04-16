import { useState, useEffect, useCallback } from "react";
import { apiRequest } from "../services/api";
import Toast from "../components/Toast";
import { useNavigate } from "react-router-dom";

const STATUS_COLORS = {
  new: "bg-blue-100 text-blue-700",
  reviewed: "bg-yellow-100 text-yellow-700",
  addressed: "bg-green-100 text-green-700",
};

const URGENCY_OPTS = ["low", "medium", "high", "critical"];
const AREA_OPTS = ["prayagraj", "varanasi", "lucknow", "kanpur", "agra", "other"];

export default function CommunityInputPage() {
  const navigate = useNavigate();
  const [needs, setNeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);

  const [form, setForm] = useState({ text: "", area: "", urgency: "medium" });

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadNeeds = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/api/inputs/");
      setNeeds(data);
    } catch (err) {
      showToast("Failed to load community inputs.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadNeeds(); }, [loadNeeds]);

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.text.trim()) { showToast("Please describe the need.", "error"); return; }
    setSubmitting(true);
    try {
      await apiRequest("/api/inputs/", {
        method: "POST",
        body: JSON.stringify({ text: form.text, area: form.area, urgency: form.urgency }),
      });
      showToast("✅ Input submitted! AI is processing...");
      setForm({ text: "", area: "", urgency: "medium" });
      await loadNeeds();
    } catch (err) {
      showToast(err.message || "Submission failed.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusUpdate = async (needId, newStatus) => {
    setActionLoading(needId + newStatus);
    try {
      await apiRequest(`/api/inputs/${needId}/status?new_status=${newStatus}`, { method: "PATCH" });
      showToast(`Status updated to "${newStatus}" ✓`);
      await loadNeeds();
    } catch (err) {
      showToast(err.message || "Status update failed.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-[calc(100vh-60px)] bg-teal-50/40 p-6 md:p-10 animate-fade-in w-full max-w-[1100px] mx-auto pb-20">
      {toast && <Toast message={toast.msg} type={toast.type} />}

      {/* Header */}
      <div className="bg-gradient-to-r from-teal-100 to-cyan-50 border border-teal-200 rounded-2xl p-6 md:p-8 mb-8 shadow-sm">
        <div className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Community Voice 📢</div>
        <h1 className="text-3xl font-extrabold font-nunito text-gray-800 mb-1">Community Inputs</h1>
        <p className="text-sm text-gray-600">Submit on-ground observations. Gemini AI instantly categorizes and creates smart alerts.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

        {/* Submit Form */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-extrabold font-nunito text-gray-800 mb-5 flex items-center gap-2">
            📝 Report a Need
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-gray-800 font-nunito">Describe the Situation <span className="text-red-500">*</span></label>
              <textarea
                required
                rows={5}
                value={form.text}
                onChange={handleChange("text")}
                placeholder="e.g. Flood-affected families in sector 3 need food and blankets urgently..."
                maxLength={1500}
                className="px-4 py-3 border-2 border-gray-300 rounded-lg text-sm focus:border-teal-500 focus:ring-4 focus:ring-teal-100 transition outline-none resize-none"
              />
              <span className="text-xs text-gray-400 text-right">{form.text.length}/1500</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-gray-800 font-nunito">Area / Location</label>
              <select value={form.area} onChange={handleChange("area")}
                className="px-4 py-3 border-2 border-gray-300 rounded-lg text-sm focus:border-teal-500 focus:ring-4 focus:ring-teal-100 transition outline-none bg-white">
                <option value="">Select area...</option>
                {AREA_OPTS.map((a) => <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>)}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-bold text-gray-800 font-nunito">Urgency Level</label>
              <div className="flex gap-2">
                {URGENCY_OPTS.map((u) => (
                  <button key={u} type="button" onClick={() => setForm(p => ({...p, urgency: u}))}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold font-nunito transition border-2 ${form.urgency === u ? "bg-teal-700 text-white border-teal-700" : "text-gray-600 border-gray-200 hover:border-teal-400"}`}>
                    {u}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
              🤖 AI will auto-detect category and suggest action
            </div>

            <button type="submit" disabled={submitting}
              className="w-full bg-teal-700 text-white py-3 rounded-lg text-sm font-bold font-nunito hover:bg-teal-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {submitting ? (
                <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Submitting...</>
              ) : "📢 Submit Report"}
            </button>
          </form>
        </div>

        {/* Reports Feed */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-5 border-b border-gray-100 pb-3">
            <h2 className="text-lg font-extrabold font-nunito text-gray-800">📋 All Reports</h2>
            <span className="bg-teal-100 text-teal-800 font-bold px-3 py-1 rounded-full text-xs">{needs.length}</span>
          </div>

          {loading ? (
            <div className="text-center py-10 text-gray-500">⏳ Loading reports...</div>
          ) : needs.length === 0 ? (
            <div className="py-10 text-center text-gray-400 bg-gray-50 rounded-lg">
              <div className="text-3xl mb-2">📭</div>
              <p className="text-sm">No community reports yet.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4 max-h-[600px] overflow-y-auto pr-1">
              {needs.map((n) => (
                <div key={n.id} className="border border-gray-200 rounded-xl p-4 bg-gray-50 flex flex-col gap-3 hover:shadow-sm transition">
                  <div className="flex flex-wrap gap-2 justify-between items-start">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold font-nunito uppercase ${STATUS_COLORS[n.status] || "bg-gray-100 text-gray-700"}`}>
                      {n.status}
                    </span>
                    <div className="flex gap-2">
                      {n.category && (
                        <span className="bg-purple-100 text-purple-700 px-2.5 py-1 rounded-full text-[11px] font-bold font-nunito uppercase">{n.category}</span>
                      )}
                      {n.urgency && (
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold font-nunito uppercase ${n.urgency === "high" || n.urgency === "critical" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{n.urgency}</span>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-gray-800 leading-relaxed">{n.text}</p>

                  {n.ai_message && (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-800">
                      🤖 <strong>AI:</strong> {n.ai_message}
                    </div>
                  )}

                  {n.area && <p className="text-xs text-gray-500">📍 {n.area}</p>}

                  {/* Status Actions */}
                  <div className="flex gap-2 flex-wrap pt-2 border-t border-gray-100">
                    {n.status === "new" && (
                      <button onClick={() => handleStatusUpdate(n.id, "reviewed")} disabled={actionLoading === n.id + "reviewed"}
                        className="px-3 py-1.5 text-xs font-bold font-nunito bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 transition disabled:opacity-50">
                        {actionLoading === n.id + "reviewed" ? "…" : "Mark Reviewed"}
                      </button>
                    )}
                    {n.status === "reviewed" && (
                      <button onClick={() => handleStatusUpdate(n.id, "addressed")} disabled={actionLoading === n.id + "addressed"}
                        className="px-3 py-1.5 text-xs font-bold font-nunito bg-green-100 text-green-700 rounded hover:bg-green-200 transition disabled:opacity-50">
                        {actionLoading === n.id + "addressed" ? "…" : "Mark Addressed"}
                      </button>
                    )}
                    {n.status === "addressed" && (
                      <span className="text-xs text-green-600 font-bold">✅ Addressed</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
