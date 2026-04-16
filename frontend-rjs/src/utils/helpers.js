/**
 * Utility helpers for the Digi-Sahaay application.
 */

/** Role metadata — icons, labels, descriptions */
export const ROLES = {
  admin: {
    icon: "🛡️",
    label: "Admin",
    desc: "Group leader. Manage members, approve tasks, view all stats.",
    badge: "Full Access",
  },
  volunteer: {
    icon: "🙋",
    label: "Volunteer",
    desc: "Field volunteer. Track your tasks, earn points, view badges.",
    badge: "Task + Score",
  },
  helper: {
    icon: "🔧",
    label: "Helper / Staff",
    desc: "Support staff. Manage logistics, supplies and on-ground ops.",
    badge: "Logistics Access",
  },
};

/** Social cause categories */
export const CATEGORIES = [
  { type: "health",      icon: "🏥", label: "Health" },
  { type: "food",        icon: "🍱", label: "Food Relief" },
  { type: "education",   icon: "📚", label: "Education" },
  { type: "environment", icon: "🌿", label: "Environment" },
  { type: "justice",     icon: "⚖️", label: "Social Justice" },
  { type: "women",       icon: "👩", label: "Women Empowerment" },
  { type: "youth",       icon: "🧒", label: "Youth Development" },
  { type: "other",       icon: "🤲", label: "Other" },
];

/** Available cities */
export const CITIES = [
  { value: "prayagraj", label: "Prayagraj" },
  { value: "lucknow",   label: "Lucknow" },
  { value: "varanasi",  label: "Varanasi" },
  { value: "kanpur",    label: "Kanpur" },
  { value: "agra",      label: "Agra" },
  { value: "mathura",   label: "Mathura" },
  { value: "meerut",    label: "Meerut" },
  { value: "gorakhpur", label: "Gorakhpur" },
];

/** Volunteer level calculation */
export function getVolunteerLevel(score) {
  if (score >= 500) return { level: "🌳 Mighty Oak", progress: 100 };
  if (score >= 300) return { level: "🌲 Strong Pine", progress: Math.round(((score - 300) / 200) * 100) };
  if (score >= 150) return { level: "🌿 Growing Fern", progress: Math.round(((score - 150) / 150) * 100) };
  if (score >= 50)  return { level: "🌱 Sapling", progress: Math.round(((score - 50) / 100) * 100) };
  return { level: "🌱 Seedling", progress: Math.round((score / 50) * 100) };
}

/** Capitalize first letter */
export function capitalize(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/** Calculate deadline string */
export function getDeadlineDisplay(deadlineStr) {
  if (!deadlineStr) return null;
  const deadline = new Date(deadlineStr);
  const now = new Date();
  
  // Use UTC to match the python utcnow
  const diffMs = deadline.getTime() - now.getTime();
  
  if (diffMs <= 0) {
    return { text: "Overdue", isOverdue: true };
  }
  
  const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffHrs > 24) {
    const days = Math.floor(diffHrs / 24);
    return { text: `Due in ${days} day${days !== 1 ? 's' : ''}`, isOverdue: false };
  }
  
  if (diffHrs > 0) {
    return { text: `Due in ${diffHrs} hr ${diffMins} min`, isOverdue: false };
  }
  
  return { text: `Due in ${diffMins} min`, isOverdue: false };
}
