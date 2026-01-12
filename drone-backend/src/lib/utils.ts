/**
 * Utility Functions for Frontend
 * Copy this to your frontend at: src/lib/utils.ts
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
  timeRange: 'all' | '1h' | '24h' | '7d'
): any[] {
  if (timeRange === 'all') return detections;

  const now = Date.now();
  const timeRanges: Record<string, number> = {
    '1h': 3600000,
    '24h': 86400000,
    '7d': 604800000,
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
 * Group detections by source
 */
export function groupBySource(detections: any[]): Record<string, any[]> {
  return detections.reduce((acc, detection) => {
    if (!acc[detection.source]) {
      acc[detection.source] = [];
    }
    acc[detection.source].push(detection);
    return acc;
  }, {} as Record<string, any[]>);
}

/**
 * Get bounds for map from detections
 */
export function getBoundsFromDetections(detections: any[]) {
  if (detections.length === 0) {
    return { center: [40.7128, -74.0060] as [number, number], zoom: 12 };
  }

  const lats = detections.map(d => d.latitude);
  const lngs = detections.map(d => d.longitude);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;

  return {
    center: [centerLat, centerLng] as [number, number],
    bounds: [[minLat, minLng], [maxLat, maxLng]] as [[number, number], [number, number]],
  };
}

/**
 * Export detections as CSV
 */
export function exportAsCSV(detections: any[]): void {
  const headers = ['ID', 'Latitude', 'Longitude', 'People Count', 'Timestamp', 'Source'];
  const rows = detections.map(d => [
    d.id,
    d.latitude,
    d.longitude,
    d.peopleCount,
    d.timestamp,
    d.source,
  ]);

  const csv = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `detections-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
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
