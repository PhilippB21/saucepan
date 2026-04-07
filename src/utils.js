export const DAYS = ["Samstag", "Sonntag", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag"];

// Stable, deterministic ID from recipe name (safe Firebase key)
export function nameToId(name) {
  return "r_" + name.toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "").slice(0, 40);
}

export function getWeekKey(date) {
  const d = new Date(date);
  const diff = (d.getDay() + 1) % 7; // days since Saturday
  const saturday = new Date(d);
  saturday.setDate(d.getDate() - diff);
  return saturday.toISOString().split("T")[0];
}

export function getKW(dateStr) {
  // Use the Monday of the week (Saturday + 2 days) as the reference for ISO week number
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 2); // Saturday → Monday
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7) + 1;
}

export function getWeekDates(saturdayKey) {
  const sat = new Date(saturdayKey + "T12:00:00");
  return DAYS.map((_, i) => {
    const d = new Date(sat);
    d.setDate(sat.getDate() + i);
    return d;
  });
}

export function formatDate(d) {
  return `${d.getDate()}.${d.getMonth() + 1}.`;
}

export function isToday(date) {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
}
