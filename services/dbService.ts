import { db, initDatabase } from './turso';
import { users, scans, transactions } from './schema';
import { eq, desc, sql, inArray } from 'drizzle-orm';

export interface UserRecord {
  publicKey: string;
  id?: string;
  privateKeyHash?: string;
  nonce?: number;
  stripeCustomerId?: string;
  username?: string;
  tier?: string;
  access?: string;
  shippingName?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingZip?: string;
  createdAt?: string;
  lastLogin?: string;
}

export const dbService = {
  async init(): Promise<void> {
    await initDatabase();
  },

  async getUser(publicKeyOrId: string): Promise<UserRecord | null> {
    await initDatabase();
    const rows = await db.select().from(users).where(eq(users.publicKey, publicKeyOrId)).limit(1);
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      publicKey: row.publicKey,
      id: row.publicKey,
      privateKeyHash: row.privateKeyHash ?? undefined,
      nonce: Number(row.nonce ?? 0),
      stripeCustomerId: row.stripeCustomerId ?? undefined,
      username: row.username ?? 'Shaggy',
      tier: row.tier ?? 'free',
      access: row.access ?? 'Alpha',
      shippingName: row.shippingName ?? undefined,
      shippingAddress: row.shippingAddress ?? undefined,
      shippingCity: row.shippingCity ?? undefined,
      shippingZip: row.shippingZip ?? undefined,
      createdAt: row.createdAt ?? undefined,
      lastLogin: row.lastLogin ?? undefined,
    };
  },

  async upsertUser(user: Partial<UserRecord> & { publicKey?: string; id?: string }): Promise<void> {
    await initDatabase();
    const key = user.publicKey || user.id;
    if (!key) throw new Error('Missing publicKey or id for user');
    await db
      .insert(users)
      .values({
        publicKey: key,
        privateKeyHash: user.privateKeyHash ?? null,
        nonce: user.nonce ?? 0,
        stripeCustomerId: user.stripeCustomerId ?? null,
        username: user.username ?? 'Shaggy',
        tier: user.tier ?? 'free',
        access: user.access ?? 'Alpha',
        shippingName: user.shippingName ?? null,
        shippingAddress: user.shippingAddress ?? null,
        shippingCity: user.shippingCity ?? null,
        shippingZip: user.shippingZip ?? null,
      })
      .onConflictDoUpdate({
        target: users.publicKey,
        set: {
          ...(user.privateKeyHash !== undefined && { privateKeyHash: user.privateKeyHash }),
          ...(user.nonce !== undefined && { nonce: user.nonce }),
          ...(user.stripeCustomerId !== undefined && { stripeCustomerId: user.stripeCustomerId }),
          ...(user.username !== undefined && { username: user.username }),
          ...(user.tier !== undefined && { tier: user.tier }),
          ...(user.access !== undefined && { access: user.access }),
          ...(user.shippingName !== undefined && { shippingName: user.shippingName }),
          ...(user.shippingAddress !== undefined && { shippingAddress: user.shippingAddress }),
          ...(user.shippingCity !== undefined && { shippingCity: user.shippingCity }),
          ...(user.shippingZip !== undefined && { shippingZip: user.shippingZip }),
          ...(user.lastLogin !== undefined && { lastLogin: user.lastLogin }),
        },
      });
  },

  async recordScan(scan: { id: string; userId: string; substanceName?: string; resultData: any }): Promise<void> {
    await initDatabase();
    await db.insert(scans).values({
      id: scan.id,
      userId: scan.userId,
      substanceName: scan.substanceName || null,
      resultData: typeof scan.resultData === 'string' ? scan.resultData : JSON.stringify(scan.resultData),
    });
  },

  async getScansForUser(userId: string): Promise<any[]> {
    await initDatabase();
    const rows = await db
      .select()
      .from(scans)
      .where(eq(scans.userId, userId))
      .orderBy(desc(scans.createdAt));

    return rows.map((r) => {
      let parsedData: any = {};
      try {
        parsedData = r.resultData ? JSON.parse(r.resultData) : {};
      } catch {
        parsedData = {};
      }
      return {
        id: r.id.substring(0, 10).toUpperCase(),
        date: parsedData.date || r.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
        location: parsedData.location || 'Unknown Field Lab',
        verdict: parsedData.verdict || 'CLEAN',
        matrix: parsedData.matrix || 'SOLID_CRYSTAL',
        detections: parsedData.detections || [],
        createdAt: r.createdAt || parsedData.createdAt || new Date().toISOString(),
        shortDescription: parsedData.shortDescription,
        longDescription: parsedData.longDescription,
      };
    });
  },

  async getAllLatestScans(limitCount = 30): Promise<{ items: any[]; totalScans: number; uniquePublicKeys: number }> {
    await initDatabase();
    await this.seedScansIfEmpty();
    const allRows = await db
      .select()
      .from(scans)
      .orderBy(desc(scans.createdAt));

    const items = allRows.slice(0, limitCount).map((r) => {
      let parsedData: any = {};
      try {
        parsedData = r.resultData ? JSON.parse(r.resultData) : {};
      } catch {
        parsedData = {};
      }
      return {
        id: r.id.substring(0, 10).toUpperCase(),
        date: parsedData.date || r.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
        location: parsedData.location || 'Berlin Harm Reduction Center',
        verdict: parsedData.verdict || 'CLEAN',
        matrix: parsedData.matrix || 'SOLID_CRYSTAL',
        detections: parsedData.detections || [],
        createdAt: r.createdAt || parsedData.createdAt || new Date().toISOString(),
        publicKey: r.userId || '0xanonymous',
        shortDescription: parsedData.shortDescription,
        longDescription: parsedData.longDescription,
      };
    });

    const uniqueUsers = new Set(allRows.map((r) => r.userId));

    return {
      items,
      totalScans: allRows.length,
      uniquePublicKeys: uniqueUsers.size || 1,
    };
  },

  async recordTransaction(tx: { id: string; userId: string; stripeSessionId: string; amount: number; status: string }): Promise<void> {
    await initDatabase();
    await db.insert(transactions).values({
      id: tx.id,
      userId: tx.userId,
      stripeSessionId: tx.stripeSessionId,
      amount: tx.amount,
      currency: 'usd',
      status: tx.status,
    }).onConflictDoNothing();
  },

  async seedScansIfEmpty(): Promise<void> {
    await initDatabase();
    const existing = await db.select({ count: sql<number>`count(*)` }).from(scans);
    const scanCount = Number(existing[0]?.count || 0);
    if (scanCount > 0) return;

    const seeds = [
      {
        id: 'seed-1',
        userId: '0x99aabbccddeeff11',
        substanceName: 'MDMA',
        resultData: {
          publicKey: '0x99aabbccddeeff11',
          date: new Date(Date.now() - 3 * 60000).toISOString().split('T')[0],
          location: 'Berlin Harm Reduction Center',
          matrix: 'SOLID_CRYSTAL',
          verdict: 'CLEAN',
          detections: [
            { name: 'MDMA', hazard: 'SAFE', rf: 0.25, hex: '#FFBF00' },
            { name: 'Caffeine', hazard: 'SAFE', rf: 0.50, hex: '#E0FFFF' }
          ]
        }
      },
      {
        id: 'seed-2',
        userId: '0x8f00ff00ffff99aa',
        substanceName: 'Cocaine',
        resultData: {
          publicKey: '0x8f00ff00ffff99aa',
          date: new Date(Date.now() - 15 * 60000).toISOString().split('T')[0],
          location: 'Boston Analyst Hub',
          matrix: 'LIQUID_VAPE',
          verdict: 'HIGH RISK',
          detections: [
            { name: 'Cocaine', hazard: 'HIGH', rf: 0.65, hex: '#FFFFFF' },
            { name: 'Levamisole', hazard: 'CRITICAL', rf: 0.12, hex: '#00FFFF' }
          ]
        }
      },
      {
        id: 'seed-3',
        userId: '0x3a2b4c5d6e7f8901',
        substanceName: 'Fentanyl (HCl)',
        resultData: {
          publicKey: '0x3a2b4c5d6e7f8901',
          date: new Date(Date.now() - 35 * 60000).toISOString().split('T')[0],
          location: 'Tokyo Testing Facility',
          matrix: 'SOLID_CRYSTAL',
          verdict: 'LETHAL',
          detections: [
            { name: 'Fentanyl (HCl)', hazard: 'LETHAL', rf: 0.55, hex: '#FCF8E3' },
            { name: 'Xylazine', hazard: 'HIGH', rf: 0.38, hex: '#FF4500' }
          ]
        }
      },
      {
        id: 'seed-4',
        userId: '0x1122334455667788',
        substanceName: 'Ketamine',
        resultData: {
          publicKey: '0x1122334455667788',
          date: new Date(Date.now() - 60 * 60000).toISOString().split('T')[0],
          location: 'London Field Unit',
          matrix: 'SOLID_CRYSTAL',
          verdict: 'CLEAN',
          detections: [
            { name: 'Ketamine', hazard: 'SAFE', rf: 0.42, hex: '#E0FFFF' }
          ]
        }
      },
      {
        id: 'seed-5',
        userId: '0x55aa55aa55aa55aa',
        substanceName: 'Synthetic Cannabinoid AM-2201',
        resultData: {
          publicKey: '0x55aa55aa55aa55aa',
          date: new Date(Date.now() - 120 * 60000).toISOString().split('T')[0],
          location: 'Sydney Mobile Lab',
          matrix: 'SOLID_CRYSTAL',
          verdict: 'HIGH RISK',
          detections: [
            { name: 'THC', hazard: 'SAFE', rf: 0.82, hex: '#00FF00' },
            { name: 'Synthetic Cannabinoid AM-2201', hazard: 'HIGH', rf: 0.68, hex: '#FF4500' }
          ]
        }
      },
      {
        id: 'seed-6',
        userId: '0x77bb88cc99ddaaee',
        substanceName: 'LSD',
        resultData: {
          publicKey: '0x77bb88cc99ddaaee',
          date: new Date(Date.now() - 180 * 60000).toISOString().split('T')[0],
          location: 'Paris Lab A',
          matrix: 'SOLID_CRYSTAL',
          verdict: 'CLEAN',
          detections: [
            { name: 'LSD', hazard: 'SAFE', rf: 0.15, hex: '#FF00FF' }
          ]
        }
      },
      {
        id: 'seed-7',
        userId: '0x44332211eeddccbb',
        substanceName: 'Methamphetamine',
        resultData: {
          publicKey: '0x44332211eeddccbb',
          date: new Date(Date.now() - 240 * 60000).toISOString().split('T')[0],
          location: 'South America Mobile 02',
          matrix: 'SOLID_CRYSTAL',
          verdict: 'HIGH RISK',
          detections: [
            { name: 'Amphetamine', hazard: 'SAFE', rf: 0.35, hex: '#FFFF00' },
            { name: 'Methamphetamine', hazard: 'HIGH', rf: 0.48, hex: '#FF8000' }
          ]
        }
      }
    ];

    // Purge legacy dummy seed keys accidentally placed in users table
    const dummySeedKeys = [
      '0x99aabbccddeeff11',
      '0x8f00ff00ffff99aa',
      '0x3a2b4c5d6e7f8901',
      '0x1122334455667788',
      '0x55aa55aa55aa55aa',
      '0x77bb88cc99ddaaee',
      '0x44332211eeddccbb',
    ];
    try {
      await db.delete(users).where(inArray(users.publicKey, dummySeedKeys));
    } catch {
      // Ignore if table does not exist yet
    }

    for (const seed of seeds) {
      await db.insert(scans).values({
        id: seed.id,
        userId: seed.userId,
        substanceName: seed.substanceName || null,
        resultData: typeof seed.resultData === 'string' ? seed.resultData : JSON.stringify(seed.resultData),
      });
    }
  },

  async getAllUsers(): Promise<UserRecord[]> {
    await initDatabase();
    const rows = await db.select().from(users).orderBy(desc(users.createdAt));
    return rows.map((row) => ({
      publicKey: row.publicKey,
      id: row.publicKey,
      privateKeyHash: row.privateKeyHash ?? undefined,
      nonce: Number(row.nonce ?? 0),
      stripeCustomerId: row.stripeCustomerId ?? undefined,
      username: row.username ?? 'Shaggy',
      tier: row.tier ?? 'free',
      access: row.access ?? 'Alpha',
      shippingName: row.shippingName ?? undefined,
      shippingAddress: row.shippingAddress ?? undefined,
      shippingCity: row.shippingCity ?? undefined,
      shippingZip: row.shippingZip ?? undefined,
      createdAt: row.createdAt ?? undefined,
      lastLogin: row.lastLogin ?? undefined,
    }));
  },

  async updateUserTier(publicKey: string, tier: string): Promise<void> {
    await initDatabase();
    await db.update(users).set({ tier }).where(eq(users.publicKey, publicKey));
  },

  async updateUser(publicKey: string, updates: Partial<UserRecord>): Promise<void> {
    await initDatabase();
    const setValues: any = {};
    if (updates.tier !== undefined) setValues.tier = updates.tier;
    if (updates.username !== undefined) setValues.username = updates.username;
    if (updates.access !== undefined) setValues.access = updates.access;
    if (updates.shippingName !== undefined) setValues.shippingName = updates.shippingName;
    if (updates.shippingAddress !== undefined) setValues.shippingAddress = updates.shippingAddress;
    if (updates.shippingCity !== undefined) setValues.shippingCity = updates.shippingCity;
    if (updates.shippingZip !== undefined) setValues.shippingZip = updates.shippingZip;
    if (Object.keys(setValues).length > 0) {
      await db.update(users).set(setValues).where(eq(users.publicKey, publicKey));
    }
  },

  async getAllScansDetailed(limitCount = 100, offset = 0): Promise<{ items: any[]; totalCount: number }> {
    await initDatabase();
    const countRes = await db.select({ count: sql<number>`count(*)` }).from(scans);
    const totalCount = Number(countRes[0]?.count || 0);

    const rows = await db
      .select()
      .from(scans)
      .orderBy(desc(scans.createdAt))
      .limit(limitCount)
      .offset(offset);

    const items = rows.map((r) => {
      let parsedData: any = {};
      try {
        parsedData = r.resultData ? JSON.parse(r.resultData) : {};
      } catch {
        parsedData = {};
      }
      return {
        id: r.id,
        shortId: r.id.substring(0, 10).toUpperCase(),
        userId: r.userId,
        substanceName: r.substanceName || parsedData.verdict || 'Unknown',
        date: parsedData.date || r.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0],
        location: parsedData.location || 'Unknown Field Lab',
        verdict: parsedData.verdict || 'CLEAN',
        matrix: parsedData.matrix || 'SOLID_CRYSTAL',
        detections: parsedData.detections || [],
        createdAt: r.createdAt || parsedData.createdAt || new Date().toISOString(),
        shortDescription: parsedData.shortDescription,
        longDescription: parsedData.longDescription,
        rawResult: parsedData,
      };
    });

    return { items, totalCount };
  },

  async getAllTransactions(limitCount = 100): Promise<any[]> {
    await initDatabase();
    const rows = await db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.createdAt))
      .limit(limitCount);
    return rows;
  },

  async getAdminStats(): Promise<{
    users: { total: number; admin: number; unlimited: number; pro: number; free: number };
    scans: { total: number; clean: number; warning: number; highRisk: number; lethal: number };
    transactions: { total: number; grossVolume: number };
    recentActivity: any[];
  }> {
    await initDatabase();
    const allUsers = await db.select().from(users);
    const allScans = await db.select().from(scans).orderBy(desc(scans.createdAt));
    const allTx = await db.select().from(transactions);

    const userStats = {
      total: allUsers.length,
      admin: allUsers.filter((u) => u.tier === 'admin').length,
      unlimited: allUsers.filter((u) => u.tier === 'unlimited').length,
      pro: allUsers.filter((u) => u.tier === 'pro').length,
      free: allUsers.filter((u) => !u.tier || u.tier === 'free').length,
    };

    let cleanCount = 0;
    let warningCount = 0;
    let highRiskCount = 0;
    let lethalCount = 0;

    for (const s of allScans) {
      let data: any = {};
      try {
        data = s.resultData ? JSON.parse(s.resultData) : {};
      } catch {}
      const v = (data.verdict || s.substanceName || '').toUpperCase();
      if (v.includes('LETHAL') || v.includes('CRITICAL')) lethalCount++;
      else if (v.includes('HIGH') || v.includes('RISK')) highRiskCount++;
      else if (v.includes('WARN')) warningCount++;
      else cleanCount++;
    }

    const txStats = {
      total: allTx.length,
      grossVolume: allTx.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0) / 100,
    };

    const recentActivity = allScans.slice(0, 10).map((r) => {
      let parsedData: any = {};
      try {
        parsedData = r.resultData ? JSON.parse(r.resultData) : {};
      } catch {}
      return {
        id: r.id,
        userId: r.userId,
        substance: r.substanceName || parsedData.verdict || 'Sample',
        verdict: parsedData.verdict || 'CLEAN',
        location: parsedData.location || 'Field Lab',
        createdAt: r.createdAt,
      };
    });

    return {
      users: userStats,
      scans: {
        total: allScans.length,
        clean: cleanCount,
        warning: warningCount,
        highRisk: highRiskCount,
        lethal: lethalCount,
      },
      transactions: txStats,
      recentActivity,
    };
  }
};
