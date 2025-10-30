export type CoarseRole = "student" | "teacher";


export function mapToCoarseRole(rawRoles?: string[] | string | null | undefined): CoarseRole {
  if (!rawRoles) return "teacher";

  const list = Array.isArray(rawRoles) ? rawRoles : [rawRoles];
  for (const r of list) {
    const s = String(r ?? "").toLowerCase();
    if (s.includes("student")) return "student";
  }
  // fallback: everything else considered teacher
  return "teacher";
}