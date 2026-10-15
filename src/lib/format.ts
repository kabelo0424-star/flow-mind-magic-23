import type { Priority } from "./store";

export function daysUntil(date: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date + "T00:00:00");
  return Math.round((d.getTime() - today.getTime()) / 86400000);
}

export function dueLabel(date: string) {
  const n = daysUntil(date);
  if (n === 0) return "Today";
  if (n === 1) return "Tomorrow";
  if (n === -1) return "Yesterday";
  return n < 0 ? `${-n}d overdue` : `In ${n}d`;
}

export function priorityClass(p: Priority) {
  return p === "high"
    ? "border-destructive/40 text-destructive"
    : p === "medium"
      ? "border-warning/50 text-warning"
      : "border-success/40 text-success";
}
