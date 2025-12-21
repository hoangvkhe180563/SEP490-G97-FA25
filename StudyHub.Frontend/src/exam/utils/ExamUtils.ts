export function calculateFinishTime(duration: number): Date {
  const now = new Date();
  const minutesInMilliseconds = duration * 60 * 1000;
  const futureDate = new Date(now.getTime() + minutesInMilliseconds);
  return futureDate;
}

export function getFormattedDateTime (dateInput: Date | string) {
  if (!dateInput) return '';
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput as any);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

export function isTimeSpanInvalid(openTime: Date, closeTime: Date, durationInMinutes: number): boolean {
  if (openTime > closeTime) {
    return false;
  }
  const differenceInMilliseconds = Math.abs(closeTime.getTime() - openTime.getTime());
  const differenceInMinutes = differenceInMilliseconds / (1000 * 60);
  return differenceInMinutes < durationInMinutes;
}