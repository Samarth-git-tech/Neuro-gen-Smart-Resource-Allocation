import { useEffect, useState, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { apiRequest } from "../services/api";

/* ─────────────────────────────────────────────────────────
   City → lat/lng lookup for the project's CITIES list.
   Used when tasks have a city-name location instead of coords.
   ───────────────────────────────────────────────────────── */
const CITY_COORDS = {
  prayagraj:  [25.4358, 81.8463],
  lucknow:    [26.8467, 80.9462],
  varanasi:   [25.3176, 82.9739],
  kanpur:     [26.4499, 80.3319],
  agra:       [27.1767, 78.0081],
  mathura:    [27.4924, 77.6737],
  meerut:     [28.9845, 77.7064],
  gorakhpur:  [26.7606, 83.3732],
  delhi:      [28.6139, 77.2090],
  mumbai:     [19.0760, 72.8777],
  kolkata:    [22.5726, 88.3639],
  chennai:    [13.0827, 80.2707],
  hyderabad:  [17.3850, 78.4867],
  bangalore:  [12.9716, 77.5946],
  jaipur:     [26.9124, 75.7873],
  patna:      [25.6093, 85.1376],
};

/* ── Resolve a location string to [lat, lng] ── */
function resolveCoords(location) {
  if (!location) return null;

  const loc = location.trim().toLowerCase();

  // Direct city match
  if (CITY_COORDS[loc]) return CITY_COORDS[loc];

  // Fuzzy: check if any city name is contained in the string
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    if (loc.includes(city)) return coords;
  }

  return null;
}

/* ── Small jitter so overlapping markers don't stack ── */
function jitter(coords, idx) {
  const offset = (idx % 7) * 0.008;
  const angle  = (idx * 137.5) % 360;
  return [
    coords[0] + offset * Math.cos((angle * Math.PI) / 180),
    coords[1] + offset * Math.sin((angle * Math.PI) / 180),
  ];
}

/* ─────────────────────────────────────────────────────────
   Custom SVG marker icons (no external image files needed)
   ───────────────────────────────────────────────────────── */
function svgIcon(color, glyph = "") {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="40" viewBox="0 0 28 40">
      <path d="M14 0 C6 0 0 6.5 0 14.5 C0 25 14 40 14 40 S28 25 28 14.5 C28 6.5 22 0 14 0Z"
            fill="${color}" stroke="#fff" stroke-width="1.5"/>
      <circle cx="14" cy="14" r="6" fill="#fff" opacity="0.9"/>
      <text x="14" y="17.5" text-anchor="middle" font-size="10" fill="${color}" font-weight="bold">${glyph}</text>
    </svg>`;
  return L.divIcon({
    html: svg,
    className: "",
    iconSize: [28, 40],
    iconAnchor: [14, 40],
    popupAnchor: [0, -36],
  });
}

const PRIORITY_ICON = {
  high:   svgIcon("#dc2626", "!"),   // red
  medium: svgIcon("#d97706", "~"),   // amber
  low:    svgIcon("#16a34a", "✓"),   // green
};
const DEFAULT_TASK_ICON = svgIcon("#6366f1", "?"); // indigo fallback
const VOLUNTEER_ICON    = svgIcon("#2563eb", "V"); // blue

const PRIORITY_LABEL = {
  high:   { text: "HIGH",   cls: "bg-red-100 text-red-700"    },
  medium: { text: "MEDIUM", cls: "bg-yellow-100 text-yellow-700" },
  low:    { text: "LOW",    cls: "bg-green-100 text-green-700" },
};

/* ── Auto-fit bounds once data loads ── */
function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
    }
  }, [positions, map]);
  return null;
}

/* ═══════════════════════════════════════════════════════════
   MapView — Main Map Component
   ═══════════════════════════════════════════════════════════ */
export default function MapView() {
  const [tasks, setTasks]           = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [showTasks, setShowTasks]         = useState(true);
  const [showVolunteers, setShowVolunteers] = useState(true);

  useEffect(() => {
    async function load() {
      setError(null);
      try {
        const [taskData, userData] = await Promise.all([
          apiRequest("/api/tasks"),
          apiRequest("/api/users/").catch(() => []),   // may 403 for non-admins
        ]);
        setTasks(taskData || []);
        setVolunteers(
          (userData || []).filter(
            (u) => u.role === "volunteer" || u.role === "helper"
          )
        );
      } catch (err) {
        setError(err.message || "Failed to load map data.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  /* ── Resolve task markers ── */
  const taskMarkers = useMemo(() => {
    return tasks
      .map((t, idx) => {
        const coords = resolveCoords(t.location);
        if (!coords) return null;
        return { ...t, coords: jitter(coords, idx) };
      })
      .filter(Boolean);
  }, [tasks]);

  /* ── Resolve volunteer markers ── */
  const volMarkers = useMemo(() => {
    return volunteers
      .map((v, idx) => {
        // Try user.location or user.city
        const coords = resolveCoords(v.location || v.city);
        if (!coords) return null;
        return { ...v, coords: jitter(coords, idx + 100) };
      })
      .filter(Boolean);
  }, [volunteers]);

  /* ── All positions for auto-fit ── */
  const allPositions = useMemo(() => {
    const pts = [];
    if (showTasks)      taskMarkers.forEach((m) => pts.push(m.coords));
    if (showVolunteers) volMarkers.forEach((m) => pts.push(m.coords));
    return pts;
  }, [taskMarkers, volMarkers, showTasks, showVolunteers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[500px] text-gray-400">
        <svg className="animate-spin h-6 w-6 mr-3 text-green-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        Loading map data…
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm font-bold">
          ⚠️ {error}
        </div>
      )}

      {/* ── Legend + Filters ── */}
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <button
          onClick={() => setShowTasks(!showTasks)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold font-nunito text-xs border transition ${
            showTasks
              ? "bg-indigo-100 text-indigo-800 border-indigo-300"
              : "bg-gray-100 text-gray-400 border-gray-200"
          }`}
        >
          📌 Tasks ({taskMarkers.length})
        </button>
        <button
          onClick={() => setShowVolunteers(!showVolunteers)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold font-nunito text-xs border transition ${
            showVolunteers
              ? "bg-blue-100 text-blue-800 border-blue-300"
              : "bg-gray-100 text-gray-400 border-gray-200"
          }`}
        >
          👤 Volunteers ({volMarkers.length})
        </button>

        <div className="hidden sm:flex items-center gap-2 ml-auto text-xs text-gray-500 font-nunito">
          <span className="inline-block w-3 h-3 rounded-full bg-red-500" /> High
          <span className="inline-block w-3 h-3 rounded-full bg-amber-500" /> Medium
          <span className="inline-block w-3 h-3 rounded-full bg-green-500" /> Low
          <span className="inline-block w-3 h-3 rounded-full bg-blue-500 ml-2" /> Volunteer
        </div>
      </div>

      {/* ── Map ── */}
      <div className="rounded-2xl overflow-hidden border-2 border-gray-200 shadow-sm" style={{ height: "520px" }}>
        <MapContainer
          center={[22.5, 80.0]}
          zoom={5}
          scrollWheelZoom={true}
          className="h-full w-full z-0"
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <FitBounds positions={allPositions} />

          {/* Task markers */}
          {showTasks &&
            taskMarkers.map((t) => (
              <Marker
                key={`task-${t.id}`}
                position={t.coords}
                icon={PRIORITY_ICON[t.priority] || DEFAULT_TASK_ICON}
              >
                <Popup maxWidth={280}>
                  <div className="font-nunito text-sm leading-relaxed p-1">
                    <p className="font-extrabold text-gray-800 text-base mb-1">{t.title}</p>
                    <div className="flex gap-1.5 flex-wrap mb-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 uppercase">
                        {t.category}
                      </span>
                      {PRIORITY_LABEL[t.priority] && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${PRIORITY_LABEL[t.priority].cls}`}>
                          {PRIORITY_LABEL[t.priority].text}
                        </span>
                      )}
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        t.status === "completed" ? "bg-green-100 text-green-700" :
                        t.status === "assigned"  ? "bg-blue-100 text-blue-700"  :
                        t.status === "active"    ? "bg-teal-100 text-teal-700"  :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {t.status}
                      </span>
                    </div>
                    {t.desc && (
                      <p className="text-gray-600 text-xs mb-1.5 line-clamp-2">{t.desc}</p>
                    )}
                    {t.assignedVolunteers && (
                      <p className="text-xs text-gray-600">
                        <strong>Assigned:</strong> {t.assignedVolunteers}
                      </p>
                    )}
                    {t.assignment_reason && (
                      <p className="text-xs text-gray-500 italic mt-1 border-t border-gray-100 pt-1">
                        💡 {t.assignment_reason}
                      </p>
                    )}
                    {t.location && (
                      <p className="text-[10px] text-gray-400 mt-1">📍 {t.location}</p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}

          {/* Volunteer markers */}
          {showVolunteers &&
            volMarkers.map((v) => (
              <Marker
                key={`vol-${v.id}`}
                position={v.coords}
                icon={VOLUNTEER_ICON}
              >
                <Popup maxWidth={240}>
                  <div className="font-nunito text-sm leading-relaxed p-1">
                    <p className="font-extrabold text-blue-800 text-base mb-1">{v.name}</p>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 uppercase">
                      {v.role}
                    </span>
                    {v.skills && (
                      <div className="mt-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Skills</p>
                        <div className="flex flex-wrap gap-1">
                          {v.skills.split(",").map((sk, i) => (
                            <span key={i} className="bg-blue-50 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                              {sk.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {v.email && (
                      <p className="text-[10px] text-gray-400 mt-1.5">✉️ {v.email}</p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
        </MapContainer>
      </div>

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-extrabold text-gray-800 font-nunito">{tasks.length}</div>
          <div className="text-xs text-gray-500 font-bold">Total Tasks</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-extrabold text-red-600 font-nunito">
            {tasks.filter((t) => t.priority === "high").length}
          </div>
          <div className="text-xs text-gray-500 font-bold">High Priority</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-extrabold text-blue-600 font-nunito">{volunteers.length}</div>
          <div className="text-xs text-gray-500 font-bold">Volunteers</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
          <div className="text-2xl font-extrabold text-green-600 font-nunito">
            {taskMarkers.length + volMarkers.length}
          </div>
          <div className="text-xs text-gray-500 font-bold">Map Pins</div>
        </div>
      </div>
    </div>
  );
}
