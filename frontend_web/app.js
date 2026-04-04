/* ═══════════════════════════════════════════════════
   ⚡ DIGI-SAHAAY — app.js
   Frontend Logic + Backend API Stubs
   All API calls are ready to connect — just replace
   BASE_URL with your actual server address.
═══════════════════════════════════════════════════ */

/* ─────────────────────────────────────────────────
   🔧 CONFIG — set your backend URL here
   ───────────────────────────────────────────────── */
const CONFIG = {
  BASE_URL: "http://localhost:5000/api",  // ✅ Change to your server URL
  HEADERS: { "Content-Type": "application/json" }
};

/* ─────────────────────────────────────────────────
   🗃️ APP STATE — central store (like a mini Redux)
   All data lives here and syncs to the backend
   ───────────────────────────────────────────────── */
let appState = {
  location: null,         // { city, area }
  groupType: null,        // e.g. "health"
  group: null,            // full group object from backend
  members: [],            // list of added members
  tasks: []               // list of created tasks
};

/* ─────────────────────────────────────────────────
   🧭 PAGE NAVIGATION
   Each "page" is a <section> with an id like page-xxx
   ───────────────────────────────────────────────── */

/**
 * goToPage(name) — switch visible page
 * @param {string} name  e.g. 'landing', 'location', 'dashboard'
 */
function goToPage(name) {
  // Hide all pages
  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));

  // Show the target page
  const target = document.getElementById(`page-${name}`);
  if (target) target.classList.add("active");

  // Toggle navbar: hidden on landing, visible on others
  const navbar = document.getElementById("navbar");
  if (name === "landing") {
    navbar.classList.add("hidden");
  } else {
    navbar.classList.remove("hidden");
    updateNavSteps(name);       // update the step indicators
  }

  // Scroll to top on page change
  window.scrollTo({ top: 0, behavior: "smooth" });

  // Run page-specific setup
  if (name === "register")  prefillRegisterForm();
  if (name === "dashboard") loadDashboard();
  if (name === "members")   renderMemberList();
}

/* ─────────────────────────────────────────────────
   🪧 NAV STEP INDICATORS — highlights current step
   ───────────────────────────────────────────────── */
const PAGE_ORDER = ["location", "grouptype", "register", "members", "dashboard", "tasks"];

function updateNavSteps(currentPage) {
  const container = document.getElementById("navSteps");
  const labels    = ["Location", "Group Type", "Register", "Members", "Dashboard", "Tasks"];
  const currentIdx = PAGE_ORDER.indexOf(currentPage);

  container.innerHTML = PAGE_ORDER.map((page, i) => {
    let cls = "";
    if (i < currentIdx)  cls = "done";
    if (i === currentIdx) cls = "active";
    return `<span class="nav-step ${cls}">${labels[i]}</span>`;
  }).join("");
}

/* ═══════════════════════════════════════════════════
   📍 PAGE 1 — LOCATION
═══════════════════════════════════════════════════ */

/**
 * handleLocation() — validates and saves location, moves to next step
 * Backend stub: could POST /api/location/validate
 */
function handleLocation() {
  const city = document.getElementById("citySelect").value;
  const area = document.getElementById("areaInput").value.trim();

  // ✅ Simple validation
  if (!city) { showToast("⚠️ Please select a city first."); return; }

  // ✅ Save to state
  appState.location = { city, area };
  showToast(`📍 Location set: ${capitalize(city)}`);

  // 🔌 BACKEND STUB — fetch groups/needs for this location
  // fetchGroupsByLocation(city);

  goToPage("grouptype");
}

/* ═══════════════════════════════════════════════════
   🏷️ PAGE 2 — GROUP TYPE
═══════════════════════════════════════════════════ */

/**
 * selectCategory(el) — toggles selected state on category cards
 */
function selectCategory(el) {
  // Remove selected from all cards
  document.querySelectorAll(".category-card").forEach(c => c.classList.remove("selected"));
  // Add to clicked card
  el.classList.add("selected");
  // Save to state
  appState.groupType = el.dataset.type;
}

/**
 * handleGroupType() — validates selection, moves to registration
 */
function handleGroupType() {
  if (!appState.groupType) {
    showToast("⚠️ Please select a group type.");
    return;
  }
  showToast(`✅ Group type: ${capitalize(appState.groupType)}`);
  goToPage("register");
}

/* ═══════════════════════════════════════════════════
   📋 PAGE 3 — GROUP REGISTRATION
═══════════════════════════════════════════════════ */

/**
 * prefillRegisterForm() — auto-fills location & type from state
 * Called when navigating to the register page
 */
function prefillRegisterForm() {
  const loc = appState.location;
  const typ = appState.groupType;

  // Auto-fill read-only fields
  document.getElementById("autoLocation").value =
    loc ? `${capitalize(loc.city)}${loc.area ? " · " + loc.area : ""}` : "";
  document.getElementById("autoType").value =
    typ ? capitalize(typ) : "";
}

/**
 * handleGroupRegister(event) — submits group registration
 * 🔌 Backend: POST /api/groups
 */
async function handleGroupRegister(event) {
  event.preventDefault();  // prevent default HTML form submission

  // Collect form data
  const payload = {
    name:      document.getElementById("groupName").value.trim(),
    admin:     document.getElementById("adminName").value.trim(),
    phone:     document.getElementById("contactPhone").value.trim(),
    email:     document.getElementById("contactEmail").value.trim(),
    city:      appState.location?.city,
    area:      appState.location?.area,
    groupType: appState.groupType
  };

  // ✅ Save to local state immediately (optimistic)
  appState.group = payload;

  /* 🔌 BACKEND — uncomment to connect:
  try {
    const res = await fetch(`${CONFIG.BASE_URL}/groups`, {
      method: "POST",
      headers: CONFIG.HEADERS,
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    appState.group = data;           // store backend response (includes ID)
  } catch (err) {
    showToast("❌ Registration failed. Check your connection.");
    return;
  }
  */

  showToast("✅ Group registered successfully!");
  goToPage("members");
}

/* ═══════════════════════════════════════════════════
   👥 PAGE 4 — MEMBER / VOLUNTEER REGISTRATION
═══════════════════════════════════════════════════ */

/**
 * handleAddMember(event) — adds a member to state + optional backend
 * 🔌 Backend: POST /api/members
 */
async function handleAddMember(event) {
  event.preventDefault();

  const member = {
    id:           Date.now(),   // temporary ID; backend will assign real ID
    name:         document.getElementById("memName").value.trim(),
    role:         document.getElementById("memRole").value,
    skills:       document.getElementById("memSkills").value.trim(),
    availability: document.getElementById("memAvail").value,
    contact:      document.getElementById("memContact").value.trim()
  };

  // ✅ Add to local state
  appState.members.push(member);

  /* 🔌 BACKEND — uncomment to connect:
  await fetch(`${CONFIG.BASE_URL}/members`, {
    method: "POST",
    headers: CONFIG.HEADERS,
    body: JSON.stringify({ ...member, groupId: appState.group?.id })
  });
  */

  // Update stats
  updateStats();

  // Clear form fields
  document.getElementById("memberForm").reset();
  renderMemberList();
  showToast(`✅ ${member.name} added as ${member.role}`);
}

/**
 * renderMemberList() — renders the live member list on Page 4
 */
function renderMemberList() {
  const container = document.getElementById("memberList");
  if (!appState.members.length) {
    container.innerHTML = `<p class="empty-note">No members added yet. Use the form above ↑</p>`;
    return;
  }

  // Map each member to a card HTML string
  container.innerHTML = appState.members.map(m => `
    <div class="member-item">
      <div>
        <div class="mem-name">${escapeHtml(m.name)}</div>
        <small style="color:var(--gray-600)">${escapeHtml(m.skills || "—")}</small>
      </div>
      <span class="mem-role">${capitalize(m.role)}</span>
    </div>
  `).join("");
}

/* ═══════════════════════════════════════════════════
   📊 PAGE 5 — DASHBOARD
═══════════════════════════════════════════════════ */

/**
 * loadDashboard() — populates dashboard with current state
 * 🔌 Backend: GET /api/groups/:id/stats
 */
async function loadDashboard() {
  // ─── Group Header ───
  const grp = appState.group;
  document.getElementById("dashGroupName").textContent =
    grp?.name || "Your Group Dashboard";
  document.getElementById("dashMeta").textContent =
    `${capitalize(grp?.city || "—")} · ${capitalize(grp?.groupType || "—")}`;

  // ─── Stats ───
  updateStats();

  // ─── Member list in dashboard ───
  renderDashMemberList();

  // ─── Task list in dashboard ───
  renderDashTaskList();

  /* 🔌 BACKEND — fetch live stats:
  try {
    const res  = await fetch(`${CONFIG.BASE_URL}/groups/${appState.group?.id}/stats`);
    const data = await res.json();
    document.getElementById("statMembers").textContent   = data.totalMembers;
    document.getElementById("statTasks").textContent     = data.activeTasks;
    document.getElementById("statVolunteers").textContent = data.volunteers;
    document.getElementById("statDone").textContent      = data.completedTasks;
  } catch(e) { console.error("Stats load failed", e); }
  */
}

/**
 * updateStats() — recomputes stats from local state
 */
function updateStats() {
  const volunteers = appState.members.filter(m => m.role === "volunteer").length;
  const done       = appState.tasks.filter(t => t.status === "done").length;

  document.getElementById("statMembers").textContent    = appState.members.length;
  document.getElementById("statTasks").textContent      = appState.tasks.length;
  document.getElementById("statVolunteers").textContent = volunteers;
  document.getElementById("statDone").textContent       = done;
}

/**
 * renderDashMemberList() — shows members in dashboard panel
 */
function renderDashMemberList() {
  const container = document.getElementById("dashMemberList");
  if (!appState.members.length) {
    container.innerHTML = `<p class="empty-note">No members yet.</p>`;
    return;
  }
  container.innerHTML = appState.members.slice(0, 5).map(m => `
    <div class="member-item">
      <span class="mem-name">${escapeHtml(m.name)}</span>
      <span class="mem-role">${capitalize(m.role)}</span>
    </div>
  `).join("");
}

/**
 * renderDashTaskList() — shows tasks in dashboard panel
 */
function renderDashTaskList() {
  const container = document.getElementById("dashTaskList");
  if (!appState.tasks.length) {
    container.innerHTML = `<p class="empty-note">No tasks yet. Create your first task!</p>`;
    return;
  }
  container.innerHTML = appState.tasks.slice(0, 4).map(t => `
    <div class="task-item">
      <span class="task-title-text">${escapeHtml(t.title)}</span>
      <span class="task-priority">${priorityEmoji(t.priority)} ${capitalize(t.priority)}</span>
    </div>
  `).join("");
}

/* ═══════════════════════════════════════════════════
   📋 PAGE 6 — TASK & COORDINATION
═══════════════════════════════════════════════════ */

/**
 * toggleAssign(el) — toggle volunteer chip assigned state
 */
function toggleAssign(el) {
  el.classList.toggle("assigned");
}

/**
 * handleCreateTask(event) — creates and saves a task
 * 🔌 Backend: POST /api/tasks
 */
async function handleCreateTask(event) {
  event.preventDefault();

  // Collect assigned volunteer names
  const assigned = [...document.querySelectorAll(".vol-chip.assigned")]
    .map(el => el.textContent.trim());

  const task = {
    id:         Date.now(),
    title:      document.getElementById("taskTitle").value.trim(),
    category:   document.getElementById("taskCategory").value,
    priority:   document.getElementById("taskPriority").value,
    dueDate:    document.getElementById("taskDate").value,
    volunteers: document.getElementById("taskVolunteers").value,
    desc:       document.getElementById("taskDesc").value.trim(),
    assigned,
    status:     "active",
    createdAt:  new Date().toLocaleDateString()
  };

  // ✅ Add to local state
  appState.tasks.push(task);

  /* 🔌 BACKEND — uncomment to connect:
  await fetch(`${CONFIG.BASE_URL}/tasks`, {
    method: "POST",
    headers: CONFIG.HEADERS,
    body: JSON.stringify({ ...task, groupId: appState.group?.id })
  });
  */

  // Reset assigned chips
  document.querySelectorAll(".vol-chip.assigned").forEach(c => c.classList.remove("assigned"));

  document.getElementById("taskForm").reset();
  updateStats();
  renderAllTasksList();
  showToast(`✅ Task "${task.title}" created!`);
}

/**
 * renderAllTasksList() — shows all tasks in Page 6
 */
function renderAllTasksList() {
  const container = document.getElementById("allTasksList");
  if (!appState.tasks.length) {
    container.innerHTML = `<p class="empty-note">No tasks created yet.</p>`;
    return;
  }
  container.innerHTML = appState.tasks.map(t => `
    <div class="task-item">
      <div>
        <div class="task-title-text">${escapeHtml(t.title)}</div>
        <div class="task-progress">${t.category} · Due ${t.dueDate || "—"} · ${t.assigned.length} volunteers</div>
      </div>
      <span class="task-priority">${priorityEmoji(t.priority)} ${capitalize(t.priority)}</span>
    </div>
  `).join("");
}

/* ═══════════════════════════════════════════════════
   🔌 BACKEND API HELPERS — ready to use
   Uncomment and call these from the handlers above
═══════════════════════════════════════════════════ */

/* ─── Generic GET helper ─── */
async function apiGet(endpoint) {
  const res = await fetch(`${CONFIG.BASE_URL}${endpoint}`, {
    method: "GET",
    headers: CONFIG.HEADERS
  });
  if (!res.ok) throw new Error(`GET ${endpoint} failed: ${res.status}`);
  return res.json();
}

/* ─── Generic POST helper ─── */
async function apiPost(endpoint, data) {
  const res = await fetch(`${CONFIG.BASE_URL}${endpoint}`, {
    method: "POST",
    headers: CONFIG.HEADERS,
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error(`POST ${endpoint} failed: ${res.status}`);
  return res.json();
}

/* ─── Fetch cities list from backend ─── */
// async function fetchCities() {
//   const cities = await apiGet("/locations/cities");
//   const sel = document.getElementById("citySelect");
//   cities.forEach(c => {
//     const opt = document.createElement("option");
//     opt.value = c.id; opt.textContent = c.name;
//     sel.appendChild(opt);
//   });
// }

/* ─── Fetch groups by location ─── */
// async function fetchGroupsByLocation(city) {
//   const groups = await apiGet(`/groups?city=${city}`);
//   console.log("Groups in this location:", groups);
// }

/* ─── Fetch volunteers by skill ─── */
// async function fetchVolunteersBySkill(skill) {
//   const vols = await apiGet(`/volunteers?skill=${skill}&available=true`);
//   renderVolunteerChips(vols);
// }

/* ═══════════════════════════════════════════════════
   🛠️ UTILITY FUNCTIONS
═══════════════════════════════════════════════════ */

/** capitalize("hello") → "Hello" */
function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Prevent XSS — escape HTML in user input before rendering */
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

/** Map priority string to emoji */
function priorityEmoji(priority) {
  return { high: "🔴", medium: "🟡", low: "🟢" }[priority] || "⚪";
}

/**
 * showToast(msg) — shows a brief notification at the bottom
 * @param {string} msg — message to show
 */
function showToast(msg) {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2800);
}

/* ─────────────────────────────────────────────────
   🚀 INIT — runs when the page loads
   ───────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  goToPage("landing");   // always start on the landing page

  // 🔌 BACKEND: could call fetchCities() here to load live city options
  // fetchCities();
});
