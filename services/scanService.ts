import { ScanRecord } from '../types';

export interface UserProfile {
  publicKey: string;
  username: string;
  tier: string;
  access: string;
  shippingName?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingZip?: string;
}

/**
 * Saves a new scan record to TursoDB via API.
 */
export async function saveScanRecord(publicKey: string, scan: Omit<ScanRecord, 'id'>): Promise<string | null> {
  try {
    const scanId = 'scan_' + Math.random().toString(36).substring(2, 9);
    const res = await fetch('/api/scans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: scanId,
        userId: publicKey,
        substanceName: scan.verdict,
        resultData: {
          ...scan,
          publicKey,
          createdAt: new Date().toISOString(),
        },
      }),
    });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return scanId;
  } catch (e) {
    console.error('Failed to save scan record to TursoDB:', e);
    return null;
  }
}

/**
 * Fetches scan records for a publicKey from TursoDB.
 */
export async function getScanRecords(publicKey: string): Promise<ScanRecord[]> {
  try {
    const res = await fetch(`/api/scans?userId=${encodeURIComponent(publicKey)}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.items || [];
  } catch (e) {
    console.error('Failed to get scan records from TursoDB:', e);
    return [];
  }
}

/**
 * Fetches scan records once on mount (no periodic polling).
 */
export function subscribeScanRecords(publicKey: string, callback: (records: ScanRecord[]) => void): () => void {
  let isSubscribed = true;

  const fetchRecords = async () => {
    if (!isSubscribed) return;
    try {
      const records = await getScanRecords(publicKey);
      if (isSubscribed) {
        callback(records);
      }
    } catch (e) {
      console.error('Error fetching scan records:', e);
    }
  };

  fetchRecords();

  return () => {
    isSubscribed = false;
  };
}

/**
 * Fetches latest scan records across the network once per page load (no periodic polling).
 */
export function subscribeAllLatestScanRecords(
  callback: (data: { items: any[]; totalScans: number; uniquePublicKeys: number }) => void,
  limitCount: number = 30
): () => void {
  let isSubscribed = true;

  const fetchLatest = async () => {
    if (!isSubscribed) return;
    try {
      const res = await fetch(`/api/scans?limit=${limitCount}`);
      if (res.ok && isSubscribed) {
        const data = await res.json();
        callback(data);
      }
    } catch (e) {
      console.error('Error fetching latest scans feed:', e);
    }
  };

  fetchLatest();

  return () => {
    isSubscribed = false;
  };
}

/**
 * Fetches user profile from TursoDB without inserting uncommitted rows.
 */
export async function getUserProfile(publicKey: string): Promise<UserProfile | null> {
  try {
    const res = await fetch(`/api/users/${encodeURIComponent(publicKey)}`);
    if (!res.ok) return null;
    const user = await res.json();
    return {
      publicKey: user.id || user.publicKey,
      username: user.username || 'Shaggy',
      tier: user.tier || 'free',
      access: user.access || 'Alpha',
      shippingName: user.shippingName,
      shippingAddress: user.shippingAddress,
      shippingCity: user.shippingCity,
      shippingZip: user.shippingZip,
    };
  } catch (e) {
    console.error('Failed to get user profile:', e);
    return null;
  }
}

/**
 * Seeds demo scans if none exist.
 */
export async function seedScansIfEmpty(): Promise<void> {
  try {
    await fetch('/api/scans/seed', { method: 'POST' });
  } catch (e) {
    console.error('Failed to seed scans:', e);
  }
}
