// Helpers and types for DOB (date of birth) formatting and validation
export type DisplayDob = string; // dd/MM/yyyy displayed to user
export type IsoDob = string; // yyyy-MM-dd sent to backend

// Validate display format dd/MM/yyyy or accept ISO yyyy-MM-dd
export function isValidDisplayDob(s?: string | null): boolean {
  if (!s) return false;
  const v = String(s).trim();
  // dd/MM/yyyy
  const ddmmyyyy = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/(\d{4})$/;
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  if (ddmmyyyy.test(v)) {
    const parts = v.split("/");
    const d = Number(parts[0]);
    const m = Number(parts[1]);
    const y = Number(parts[2]);
    const dt = new Date(y, m - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
  }
  if (iso.test(v)) {
    const parts = v.split("-");
    const y = Number(parts[0]);
    const m = Number(parts[1]);
    const d = Number(parts[2]);
    const dt = new Date(y, m - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
  }
  return false;
}

// Convert display dd/MM/yyyy to ISO yyyy-MM-dd. If input already ISO, returns it.
export function displayToIso(s?: string | null): IsoDob | null {
  if (!s) return null;
  const v = String(s).trim();
  const ddmmyyyy = /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[0-2])\/(\d{4})$/;
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  if (iso.test(v)) return v;
  if (ddmmyyyy.test(v)) {
    const [d, m, y] = v.split("/");
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return null;
}

// Convert ISO yyyy-MM-dd to display dd/MM/yyyy
export function isoToDisplay(s?: string | null): DisplayDob | null {
  if (!s) return null;
  const v = String(s).trim();
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  if (!iso.test(v)) return null;
  const [y, m, d] = v.split("-");
  return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
}

export default {
  isValidDisplayDob,
  displayToIso,
  isoToDisplay,
};
