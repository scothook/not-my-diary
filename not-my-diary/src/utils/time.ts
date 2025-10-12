export function dateToTimestampString(date: Date) {
  return date.toISOString().replace("T", " ");
};

export function timestampStringToLocalTime(utcString: string) {
  return new Date(utcString).toLocaleString([], {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",      
  });
};
