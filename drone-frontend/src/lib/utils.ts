/**
 * Utility Functions for Frontend
 */

/**
 * Format timestamp to relative time (e.g., "5m ago")
 */
export function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  const diff = Date.now() - date.getTime();

  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Format coordinates to fixed decimal places
 */
export function formatCoords(lat: number, lng: number): string {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

/**
 * Get color based on people count
 */
export function getColorByPeopleCount(count: number): {
  bg: string;
  text: string;
  hex: string;
} {
  if (count <= 3) {
    return { bg: 'bg-success/20', text: 'text-success', hex: '#22c55e' };
  } else if (count <= 10) {
    return { bg: 'bg-warning/20', text: 'text-warning', hex: '#f59e0b' };
  } else {
    return { bg: 'bg-destructive/20', text: 'text-destructive', hex: '#ef4444' };
  }
}

/**
 * Filter detections by time range
 */
export function filterByTimeRange(
  detections: any[],
  timeRange: '10min' | '1hr' | '24hr' | 'all'
): any[] {
  if (timeRange === 'all') return detections;

  const now = Date.now();
  const timeRanges: Record<string, number> = {
    '10min': 10 * 60 * 1000,
    '1hr': 60 * 60 * 1000,
    '24hr': 24 * 60 * 60 * 1000,
  };

  const cutoff = now - timeRanges[timeRange];
  return detections.filter(d => new Date(d.timestamp).getTime() > cutoff);
}

/**
 * Calculate statistics from detections
 */
export function calculateStats(detections: any[]) {
  const totalPeople = detections.reduce((sum, d) => sum + d.peopleCount, 0);
  const mostRecent = detections.length > 0
    ? new Date(Math.max(...detections.map(d => new Date(d.timestamp).getTime())))
    : null;

  return {
    totalDetections: detections.length,
    totalPeople,
    mostRecent,
    averagePeople: detections.length > 0 ? Math.round(totalPeople / detections.length) : 0,
  };
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Combine class names
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
