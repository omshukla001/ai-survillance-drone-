const STORAGE_KEY = 'drone_video_urls';

export function saveVideoUrl(droneId: string, url: string): void {
  if (typeof window === 'undefined') return;
  const urls = getStoredUrls();
  urls[droneId] = url;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(urls));
}

export function getVideoUrl(droneId: string): string | null {
  if (typeof window === 'undefined') return null;
  const urls = getStoredUrls();
  return urls[droneId] || null;
}

function getStoredUrls(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : {};
}
