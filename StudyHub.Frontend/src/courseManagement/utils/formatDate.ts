import { format } from "date-fns";

export function formatDate(d?: string | null): string {
  if (!d) return "—";
  try {
    return format(new Date(d), "dd/MM/yyyy");
  } catch {
    return String(d);
  }
}

export function formatDateTime(d?: string | null): string {
  if (!d) return "—";
  try {
    return format(new Date(d), "dd/MM/yyyy HH:mm:ss");
  } catch {
    return String(d);
  }
}
