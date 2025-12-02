/**
 * Format seconds into a time string (MM:SS format)
 * @param seconds - Time in seconds
 * @returns Formatted time string
 */
export const formatTime = (seconds: number): string => {
  if (seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

/**
 * Format timestamp into a readable date string
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Formatted date string
 */
export const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Calculate workout duration from start and end times
 * @param start - Start timestamp in milliseconds
 * @param end - End timestamp in milliseconds (optional)
 * @returns Duration string in minutes
 */
export const getDuration = (start: number, end?: number): string => {
  if (!end) return '--';
  const minutes = Math.floor((end - start) / 60000);
  return `${minutes} MIN`;
};
