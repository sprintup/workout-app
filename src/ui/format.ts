import { dateFromKey } from "../entities/dates";


export function formatDueDate(key) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(dateFromKey(key));
}
