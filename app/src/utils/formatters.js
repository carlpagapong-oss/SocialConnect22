// "42m", "3h", "2d", or "now" — the compact style used on post cards.
export function timeAgo(dateInput) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(dateInput).getTime()) / 1000));
  if (seconds < 60) return "now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return new Date(dateInput).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function formatPostDate(dateInput) {
  if (!dateInput) return "";
  return new Date(dateInput).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatCount(n = 0) {
  return Number(n).toLocaleString();
}

export function formatBirthday(dateInput) {
  if (!dateInput) return "";
  return new Date(dateInput).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function ageFromBirthday(dateInput) {
  if (!dateInput) return null;
  const birth = new Date(dateInput);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const hadBirthday =
    now.getMonth() > birth.getMonth() ||
    (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate());
  if (!hadBirthday) age -= 1;
  return age;
}
