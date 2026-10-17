// Deterministic date labels - no Intl, so server and client always agree.

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAY_MS = 86_400_000;

export function formatCardDate(ts: number): string {
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return "";
  const days = Math.floor((Date.now() - ts) / DAY_MS);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return `${date.getDate()} ${MONTHS_SHORT[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatSpreadDate(ts: number): string {
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getDate()} ${MONTHS_LONG[date.getMonth()]} ${date.getFullYear()}`;
}
