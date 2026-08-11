// Lists show month and year; the post itself shows the day. A list is scanned
// for roughly when something landed, and a run of full dates turns into noise;
// on the post, the exact day is part of reading it as a record.
export function formatPostMonth(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatPostDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

// The machine-readable half of <time>. Rendered from the UTC parts so the
// attribute agrees with the text beside it rather than drifting a day in a
// westward timezone.
export function toDateAttribute(date: Date) {
  return date.toISOString().slice(0, 10);
}
