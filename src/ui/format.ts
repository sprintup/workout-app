import { dateFromKey } from "../entities/dates";


export function formatDueDate(key) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(dateFromKey(key));
}


export function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Starting today";
  return `Started ${new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(date)}`;
}
