/**
 * Device-Based Identity Manager
 *
 * Provides a unique, persistent device identity (UUID) stored in a secure cookie
 * and localStorage, completely eliminating the friction of email/password registration
 * while ensuring all user positions and alerts are scoped to their specific device.
 */

const DEVICE_ID_KEY = 'cpm_device_id';

export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') {
    return 'server-placeholder';
  }

  // 1. Check localStorage
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);

  // 2. If not in localStorage, check cookie
  if (!deviceId) {
    const match = document.cookie.match(new RegExp('(^| )' + DEVICE_ID_KEY + '=([^;]+)'));
    if (match) {
      deviceId = decodeURIComponent(match[2]);
    }
  }

  // 3. Generate a new cryptographically secure UUID if not found
  if (!deviceId) {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      deviceId = `dev_${crypto.randomUUID()}`;
    } else {
      deviceId = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }
  }

  // 4. Persist in both localStorage and long-lived cookie (10 years)
  try {
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
    // 3650 days cookie (~10 years)
    const expires = new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${DEVICE_ID_KEY}=${encodeURIComponent(
      deviceId
    )}; expires=${expires}; path=/; SameSite=Lax`;
  } catch (e) {
    console.warn('Could not persist device ID', e);
  }

  return deviceId;
}

/**
 * Returns a human-friendly short identifier for UI display
 * e.g., "Device #4a8f"
 */
export function formatDeviceShortName(deviceId: string): string {
  if (!deviceId || deviceId === 'server-placeholder') return 'This Device';
  const clean = deviceId.replace(/^dev_/, '');
  const shortCode = clean.substring(0, 4).toUpperCase();
  return `Device #${shortCode}`;
}
