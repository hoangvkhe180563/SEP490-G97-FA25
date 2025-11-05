export function calculateFinishTime(): Date {
  const now = new Date();
  const twentyMinutesInMilliseconds = 20 * 60 * 1000;
  const futureDate = new Date(now.getTime() + twentyMinutesInMilliseconds);
  return futureDate;
}