import { Link } from "react-router-dom";
import MapView from "../components/MapView";

export default function MapPage() {
  return (
    <div className="min-h-[calc(100vh-60px)] bg-gray-50 p-6 md:p-10 animate-fade-in w-full max-w-[1200px] mx-auto pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-100 to-teal-50 border border-emerald-200 rounded-2xl p-6 md:p-8 mb-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">
            Real-Time Visualization 🗺️
          </div>
          <h1 className="text-3xl font-extrabold font-nunito text-gray-800 mb-1">
            Live Task Map
          </h1>
          <p className="text-sm text-gray-600">
            Visualize active tasks and available volunteers across locations for
            better coordination and faster response.
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <Link
            to="/tasks"
            className="px-4 py-2.5 bg-red-500 text-white rounded-lg text-sm font-bold font-nunito hover:bg-red-600 transition"
          >
            + Create Task
          </Link>
          <Link
            to="/dashboard"
            className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-bold font-nunito hover:bg-gray-50 transition"
          >
            ← Dashboard
          </Link>
        </div>
      </div>

      {/* Map */}
      <MapView />
    </div>
  );
}
