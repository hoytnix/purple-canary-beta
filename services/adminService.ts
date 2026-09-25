import { getOrCreateIdentity, signPayload } from './identity';

export interface AdminUserRecord {
  publicKey: string;
  username: string;
  tier: string;
  access: string;
  shippingName?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingZip?: string;
  createdAt?: string;
  lastLogin?: string;
  hasPrivateKeyRegistered?: boolean;
}

export interface AdminStats {
  users: {
    total: number;
    admin: number;
    unlimited: number;
    pro: number;
    free: number;
  };
  scans: {
    total: number;
    clean: number;
    warning: number;
    highRisk: number;
    lethal: number;
  };
  transactions: {
    total: number;
    grossVolume: number;
  };
  recentActivity: Array<{
    id: string;
    userId: string;
    substance: string;
    verdict: string;
    location: string;
    createdAt: string;
  }>;
}

export interface AdminScanRecord {
  id: string;
  shortId: string;
  userId: string;
  substanceName: string;
  date: string;
  location: string;
  verdict: string;
  matrix: string;
  detections: Array<{
    name: string;
    hazard: string;
    rf: number;
    hex: string;
  }>;
  createdAt: string;
  shortDescription?: string;
  longDescription?: string;
  rawResult?: any;
}

export interface AdminTransactionRecord {
  id: string;
  userId: string;
  stripeSessionId: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
}

async function getAdminHeaders(): Promise<HeadersInit> {
  const identity = await getOrCreateIdentity();
  if (!identity.publicKey || !identity.privateKey) {
    throw new Error('No cryptographic identity keypair found on this device.');
  }

  const timestamp = Date.now().toString();
  const challenge = `admin-auth:${identity.publicKey}:${timestamp}`;
  const signature = await signPayload(challenge, identity.privateKey);

  return {
    'Content-Type': 'application/json',
    'x-public-key': identity.publicKey,
    'x-timestamp': timestamp,
    'x-signature': signature,
  };
}

export const adminService = {
  /**
   * Checks whether the current client keypair has 'admin' tier clearance.
   */
  async checkAdminAccess(): Promise<{
    authorized: boolean;
    user?: any;
    currentTier?: string;
    error?: string;
  }> {
    try {
      const headers = await getAdminHeaders();
      const res = await fetch('/api/admin/auth-check', {
        method: 'GET',
        headers,
      });

      const data = await res.json();
      if (!res.ok) {
        return {
          authorized: false,
          currentTier: data.currentTier,
          error: data.error || `HTTP ${res.status}`,
        };
      }

      return {
        authorized: true,
        user: data.user,
      };
    } catch (err: any) {
      return {
        authorized: false,
        error: err.message || 'Failed to authenticate administrative clearance.',
      };
    }
  },

  /**
   * Fetches high-level executive telemetry and stats.
   */
  async getStats(): Promise<AdminStats> {
    const headers = await getAdminHeaders();
    const res = await fetch('/api/admin/stats', {
      method: 'GET',
      headers,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch admin stats (HTTP ${res.status})`);
    }
    const data = await res.json();
    return data.stats;
  },

  /**
   * Fetches all registered users from TursoDB.
   */
  async getUsers(): Promise<AdminUserRecord[]> {
    const headers = await getAdminHeaders();
    const res = await fetch('/api/admin/users', {
      method: 'GET',
      headers,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch users (HTTP ${res.status})`);
    }
    const data = await res.json();
    return data.users;
  },

  /**
   * Updates a user's tier in TursoDB.
   */
  async updateUserTier(targetPublicKey: string, tier: string): Promise<AdminUserRecord> {
    const headers = await getAdminHeaders();
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ targetPublicKey, tier }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to update user tier (HTTP ${res.status})`);
    }
    const data = await res.json();
    return data.user;
  },

  /**
   * Updates user details (username, access, shipping info).
   */
  async updateUserDetails(targetPublicKey: string, fields: Partial<AdminUserRecord>): Promise<AdminUserRecord> {
    const headers = await getAdminHeaders();
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ targetPublicKey, ...fields }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to update user (HTTP ${res.status})`);
    }
    const data = await res.json();
    return data.user;
  },

  /**
   * Fetches scans across the entire network ledger.
   */
  async getScans(limit: number = 50, offset: number = 0): Promise<{ scans: AdminScanRecord[]; totalCount: number }> {
    const headers = await getAdminHeaders();
    const res = await fetch(`/api/admin/scans?limit=${limit}&offset=${offset}`, {
      method: 'GET',
      headers,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch scans (HTTP ${res.status})`);
    }
    const data = await res.json();
    return { scans: data.scans, totalCount: data.totalCount };
  },

  /**
   * Fetches Stripe transactions recorded in TursoDB.
   */
  async getTransactions(limit: number = 50): Promise<AdminTransactionRecord[]> {
    const headers = await getAdminHeaders();
    const res = await fetch(`/api/admin/transactions?limit=${limit}`, {
      method: 'GET',
      headers,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Failed to fetch transactions (HTTP ${res.status})`);
    }
    const data = await res.json();
    return data.transactions;
  },
};
