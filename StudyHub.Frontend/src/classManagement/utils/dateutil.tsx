// src/lib/dateUtils.ts
export function isPastDeadline(iso?: string | null): boolean {
  if (!iso) return false;
  try {
    return new Date() > new Date(iso);
  } catch {
    return false;
  }
}