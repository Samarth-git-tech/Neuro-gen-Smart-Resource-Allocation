import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../services/api";
import Toast from "../components/Toast";

export default function AIBoardPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [text, setText] = useState("");
  const [lastResult, setLastResult] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const [error, setError] = useState(null);

  const loadHistory = useCallback(async () => {
    setError(null);
    try {
      const data = await apiRequest("/api/ai-history");
      setHistory(data);
    } catch (err) {
      setError(err.message || "Failed to load AI history.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(loadHistory, 5000);
    return () => clearInterval(interval);
  }, [loadHistory]);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!text.trim()) { showToast("Please enter some text to analyze.", "error"); return; }
    if (text.length > 1500) { showToast("Text exceeds 1500 character limit.", "error"); return; }
    setSubmitting(true);
    setLastResult(null);
    try {
      const res = await apiRequest("/api/ai-process", {
        method: "POST",
        body: JSON.stringify({ text }),
      });
      if (res.success) {
        setLastResult(res.data);
        showToast("✅ AI analysis complete!");
        setText("");
        await loadHistory();
      } else {
        showToast(res.error || "AI processing failed.", "error");
      }
    } catch (err) {
      showToast(err.message || "Failed to process.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const CATEGORY_COLORS = {
    health: "bg-red-100 text-red-700",
    food: "bg-orange-100 text-orange-700",
    shelter: "bg-blue-100 text-blue-700",
    education: "bg-purple-100 text-purple-700",
    logistics: "bg-teal-100 text-teal-700",
    security: "bg-gray-200 text-gray-800",
    sanitation: "bg-green-100 text-green-700",
    other: "bg-indigo-100 text-indigo-700",
  };

  const PRIORITY_COLORS = {
    high: "bg-red-100 text-red-700",
    medium: "bg-yellow-100 text-yellow-700",
    low: "bg-green-100 text-green-700",
  };

  return (
    <div className="min-h-[calc(100vh-60px)] bg-indigo-50/40 p-6 md:p-10 animate-fade-in w-full max-w-[1100px] mx-auto pb-20">
      {toast && <Toast message={toast.msg} type={toast.type} />}

      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-100 to-purple-50 border border-indigo-200 rounded-2xl p-6 md:p-8 mb-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Powered by Gemini AI 🤖</div>
          <h1 className="text-3xl font-extrabold font-nunito text-gray-800 mb-1">AI Processing Board</h1>
          <p className="text-sm text-gray-600">Paste any text to instantly classify category, priority, required skills and resources using Gemini AI.</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link to="/tasks" className="px-4 py-2.5 bg-red-500 text-white rounded-lg text-sm font-bold font-nunito hover:bg-red-600 transition">+ Create Task</Link>
          <Link to="/inputs" className="px-4 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-bold font-nunito hover:bg-teal-700 transition">📢 Community Input</Link>
          <Link to="/dashboard" className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-bold font-nunito hover:bg-gray-50 transition">← Dashboard</Link>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 mb-6 flex justify-between items-center">
          <p className="text-red-700 font-bold font-nunito text-sm">⚠️ {error}</p>
          <button onClick={loadHistory} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-bold font-nunito hover:bg-red-600 transition">Retry</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">

        {/* Input Panel */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-extrabold font-nunito text-gray-800 mb-4 flex items-center gap-2">
              ⚡ Quick Analyze
            </h2>
            <form onSubmit={handleAnalyze} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-bold text-gray-800 font-nunito">Input Text</label>
                <textarea rows={6} required value={text} onChange={(e) => setText(e.target.value)}
                  maxLength={1500}
                  placeholder="Paste any situation report, community need, or task description here..."
                  className="px-4 py-3 border-2 border-gray-300 rounded-lg text-sm focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition outline-none resize-none"
                />
                <span className="text-xs text-gray-400 text-right">{text.length}/1500</span>
              </div>

              <button type="submit" disabled={submitting}
                className="w-full bg-indigo-700 text-white py-3 rounded-lg text-sm font-bold font-nunito hover:bg-indigo-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {submitting ? (
                  <><svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Analyzing...</>
                ) : "🔍 Analyze with Gemini"}
              </button>
            </form>
          </div>

          {/* Live Result Box — Full AI Output */}
          {lastResult && (
            <div className="bg-white rounded-2xl shadow-sm border-2 border-indigo-300 p-6 animate-slide-up">
              <h3 className="text-base font-extrabold font-nunito text-indigo-800 mb-4">🤖 AI Analysis Result</h3>
              <div className="flex flex-col gap-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-600">Category</span>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold font-nunito uppercase ${CATEGORY_COLORS[lastResult.category] || "bg-gray-100 text-gray-700"}`}>{lastResult.category}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-gray-600">Priority</span>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold font-nunito uppercase ${PRIORITY_COLORS[lastResult.priority] || "bg-gray-100 text-gray-700"}`}>{lastResult.priority}</span>
                </div>
                {lastResult.problem && (
                  <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Problem Summary</p>
                    <p className="text-gray-700 italic text-xs leading-relaxed">{lastResult.problem}</p>
                  </div>
                )}
                {lastResult.skills_required && (() => { try { const s = JSON.parse(lastResult.skills_required || "[]"); return s.length > 0 ? (<div><p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Required Skills</p><div className="flex flex-wrap gap-1">{s.map((sk, i) => <span key={i} className="bg-blue-100 text-blue-700 text-[11px] font-bold px-2 py-0.5 rounded-full">{sk}</span>)}</div></div>) : null; } catch { return null; } })()}
                {lastResult.resources_required && (() => { try { const r = JSON.parse(lastResult.resources_required || "[]"); return r.length > 0 ? (<div><p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Resources Needed</p><div className="flex flex-wrap gap-1">{r.map((res, i) => <span key={i} className="bg-orange-100 text-orange-700 text-[11px] font-bold px-2 py-0.5 rounded-full">{res}</span>)}</div></div>) : null; } catch { return null; } })()}
                <div className="pt-3 border-t border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Input Analyzed</p>
                  <p className="text-gray-600 text-xs italic line-clamp-3">{lastResult.input}</p>
                </div>
                <Link to="/tasks" className="block text-center bg-red-500 text-white py-2 rounded-lg text-sm font-bold font-nunito hover:bg-red-600 transition mt-1">→ Create Task from this</Link>
              </div>
            </div>
          )}
        </div>

        {/* History Panel */}
        <div className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-center mb-5 border-b border-gray-100 pb-3">
            <h2 className="text-lg font-extrabold font-nunito text-gray-800">🕒 AI Analysis History</h2>
            <span className="bg-indigo-100 text-indigo-800 font-bold px-3 py-1 rounded-full text-xs">{history.length}</span>
          </div>

          {loading ? (
            <div className="text-center py-10 text-gray-500">⏳ Loading history…</div>
          ) : history.length === 0 ? (
            <div className="py-10 text-center text-gray-400 bg-gray-50 rounded-lg">
              <div className="text-3xl mb-2">🤖</div>
              <p className="text-sm">No AI analyses yet. Run your first one!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-h-[540px] overflow-y-auto pr-1">
              {history.map((h) => (
                <div key={h.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50 flex flex-col gap-2 hover:shadow-sm transition">
                  <div className="flex gap-2 flex-wrap items-center">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold font-nunito uppercase ${CATEGORY_COLORS[h.category] || "bg-gray-100 text-gray-700"}`}>
                      {h.category}
                    </span>
                    <span className="text-xs text-gray-400 ml-auto">
                      {h.created_at ? new Date(h.created_at).toLocaleString() : "—"}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">{h.input_text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
