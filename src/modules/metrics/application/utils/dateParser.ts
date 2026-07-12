export function parseDateRange(range: string): { start: Date; end: Date } {
  const now = new Date();
  
  // Adjust to Ecuador Time (UTC-5)
  const ecuadorNow = new Date(now.getTime() - 5 * 60 * 60 * 1000);
  
  // Set to midnight in Ecuador Time
  const ecuadorMidnight = new Date(ecuadorNow);
  ecuadorMidnight.setUTCHours(0, 0, 0, 0);
  
  // Convert back to real UTC for Prisma querying
  const realUtcMidnight = new Date(ecuadorMidnight.getTime() + 5 * 60 * 60 * 1000);

  let start = realUtcMidnight;

  if (range === "7d") {
    start = new Date(realUtcMidnight.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (range === "30d") {
    start = new Date(realUtcMidnight.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  return { start, end: now };
}
