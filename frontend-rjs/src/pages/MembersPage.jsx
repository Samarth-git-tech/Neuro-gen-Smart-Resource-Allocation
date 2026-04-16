import { useState, useEffect, useCallback } from "react";
import { apiRequest } from "../services/api";
import Toast from "../components/Toast";

const ROLE_BADGE = {
  admin: "bg-green-100 text-green-800",
  volunteer: "bg-blue-100 text-blue-800",
  helper: "bg-orange-100 text-orange-800",
};

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [deletingId, setDeletingId] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadMembers = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/api/users/");
      setMembers(data);
    } catch (err) {
      showToast(err.message || "Failed to load members.", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMembers(); }, [loadMembers]);

  const handleDelete = async (userId, userName) => {
    if (!window.confirm(`Remove ${userName} from the platform?`)) return;
    setDeletingId(userId);
    try {
      await apiRequest(`/api/users/${userId}`, { method: "DELETE" });
      showToast(`${userName} removed ✓`);
      await loadMembers();
    } catch (err) {
      showToast(err.message || "Delete failed.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = members.filter((m) => {
    const matchRole = roleFilter === "all" || m.role === roleFilter;
    const matchSearch = !search || m.name?.toLowerCase().includes(search.toLowerCase()) || m.email?.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  return (
    <div className="min-h-[calc(100vh-60px)] bg-rose-50/30 p-6 md:p-10 animate-fade-in w-full max-w-[1100px] mx-auto pb-20">
      {toast && <Toast message={toast.msg} type={toast.type} />}

      {/* Header */}
      <div className="bg-gradient-to-r from-rose-100 to-pink-50 border border-rose-200 rounded-2xl p-6 md:p-8 mb-8 shadow-sm">
        <div className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Platform Admin 👥</div>
        <h1 className="text-3xl font-extrabold font-nunito text-gray-800 mb-1">Members Management</h1>
        <p className="text-sm text-gray-600">View, search and manage all registered users on the platform.</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total", count: members.length, colorClass: "bg-slate-100" },
          { label: "Admins", count: members.filter(m => m.role === "admin").length, colorClass: "bg-green-100" },
          { label: "Volunteers", count: members.filter(m => m.role === "volunteer").length, colorClass: "bg-blue-100" },
          { label: "Helpers", count: members.filter(m => m.role === "helper").length, colorClass: "bg-orange-100" },
        ].map((s) => (
          <div key={s.label} className={`${s.colorClass} rounded-xl p-5 text-center shadow-sm`}>
            <div className="text-3xl font-extrabold font-nunito text-gray-900">{s.count}</div>
            <div className="text-xs font-bold text-gray-600 mt-1 uppercase tracking-wide">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-6 flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="flex-1 px-4 py-2.5 border-2 border-gray-200 rounded-lg text-sm focus:border-rose-400 focus:ring-4 focus:ring-rose-100 outline-none transition"
        />
        <div className="flex gap-2">
          {["all", "admin", "volunteer", "helper"].map((r) => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold font-nunito transition border-2 capitalize ${roleFilter === r ? "bg-rose-700 text-white border-rose-700" : "text-gray-600 border-gray-200 hover:border-rose-400"}`}>
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-extrabold font-nunito text-gray-800">All Members</h2>
          <span className="bg-rose-100 text-rose-800 font-bold px-3 py-1 rounded-full text-xs">{filtered.length} shown</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 border-b-2 border-gray-200">
              <tr>
                {["ID", "Name", "Email", "Role", "Skills", "City", "Availability", "Action"].map((h) => (
                  <th key={h} className="px-5 py-3 font-extrabold font-nunito text-gray-600 uppercase tracking-widest text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={8} className="py-8 text-center text-gray-500">⏳ Loading members…</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="py-8 text-center text-gray-400">
                  <div className="text-2xl mb-2">🔍</div>
                  <p>No members found.</p>
                </td></tr>
              ) : filtered.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 text-gray-400 text-xs">#{m.id}</td>
                  <td className="px-5 py-4 font-bold text-gray-800">{m.name || "—"}</td>
                  <td className="px-5 py-4 text-gray-600 max-w-[180px] truncate">{m.email}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold font-nunito uppercase tracking-wide ${ROLE_BADGE[m.role] || "bg-gray-100 text-gray-700"}`}>
                      {m.role}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-600 max-w-[160px] truncate" title={m.skills}>{m.skills || "—"}</td>
                  <td className="px-5 py-4 text-gray-600 capitalize">{m.city || "—"}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold font-nunito uppercase inline-flex items-center gap-1 ${m.availability === true || m.availability === "true" || m.availability === "Available" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                      {m.availability === true || m.availability === "true" || m.availability === "Available" ? "✓ Available" : "✗ Busy"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <button onClick={() => handleDelete(m.id, m.name || m.email)} disabled={deletingId === m.id}
                      className="px-3 py-1.5 text-xs font-bold font-nunito border border-red-300 text-red-600 rounded hover:bg-red-50 transition disabled:opacity-50">
                      {deletingId === m.id ? "…" : "Remove"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
