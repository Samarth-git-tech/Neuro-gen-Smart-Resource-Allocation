import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { apiRequest } from "../services/api";

export default function StatsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiRequest("/api/stats/");
        setStats(data);
      } catch (err) {
        console.error("Failed to load stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
    // Refresh every 10 seconds
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-[calc(100vh-60px)] bg-gray-50 p-6 md:p-10 animate-fade-in w-full pb-20 max-w-[1200px] mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 md:p-8 mb-6 flex flex-col md:flex-row justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold font-nunito text-gray-800">System Health & Metrics</h1>
          <p className="text-sm text-gray-600 mt-1">Real-time AI assignment performance & task execution analytics.</p>
        </div>
        <Link to="/dashboard" className="mt-4 md:mt-0 px-5 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-bold font-nunito hover:bg-indigo-700 transition">
          Back to Dashboard
        </Link>
      </div>

      {loading ? (
        <div className="text-center py-20 text-gray-400 font-bold font-nunito animate-pulse">Loading system metrics...</div>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-green-200 p-6 relative overflow-hidden">
            <div className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">AI Success Rate</div>
            <div className="text-5xl font-extrabold font-nunito text-green-600">{stats.success_rate}%</div>
            <div className="text-xs text-gray-500 mt-2">Based on tasks successfully completed by AI-assigned volunteers.</div>
            <div className="absolute -right-4 -bottom-4 text-7xl opacity-5">🎯</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-6 relative overflow-hidden">
            <div className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Avg Completion Time</div>
            <div className="text-5xl font-extrabold font-nunito text-blue-600">{stats.avg_completion_time}</div>
            <div className="text-xs text-gray-500 mt-2">Time from task creation to volunteer marking as done.</div>
            <div className="absolute -right-4 -bottom-4 text-7xl opacity-5">⏱️</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6 relative overflow-hidden">
            <div className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Emergencies Handled</div>
            <div className="text-5xl font-extrabold font-nunito text-red-600">{stats.total_emergency}</div>
            <div className="text-xs text-gray-500 mt-2">High-priority tasks auto-assigned bypassing normal constraints.</div>
            <div className="absolute -right-4 -bottom-4 text-7xl opacity-5">🚨</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-purple-200 p-6 relative overflow-hidden">
            <div className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Total Completed</div>
            <div className="text-5xl font-extrabold font-nunito text-purple-600">{stats.total_tasks_completed}</div>
            <div className="text-xs text-gray-500 mt-2">Overall impact volume driven by the platform.</div>
            <div className="absolute -right-4 -bottom-4 text-7xl opacity-5">🏆</div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 text-red-500 font-bold">Failed to load metrics.</div>
      )}
    </div>
  );
}
