import { db, initDatabase } from './turso';
import { users, scans, transactions, subscriptions } from './schema';
import { eq, desc, sql } from 'drizzle-orm';

export interface UserRecord {
  id: string;
  email?: string;
  stripeCustomerId?: string;
  subscriptionStatus: string;
  credits: number;
  username?: string;
  tier?: string;
  access?: string;
  shippingName?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingZip?: string;
}

export const dbService = {
  async init(): Promise<void> {
    await initDatabase();
  },

  async getUser(id: string): Promise<UserRecord | null> {
    await initDatabase();
    const rows = await db.select().from(users).where(eq(users.id, id)).limit(1);
    if (rows.length === 0) return null;
    const row = rows[0];
    return {
      id: row.id,
      email: row.email ?? undefined,
      stripeCustomerId: row.stripeCustomerId ?? undefined,
      subscriptionStatus: row.subscriptionStatus ?? 'inactive',
      credits: Number(row.credits ?? 0),
      username: row.username ?? 'Shaggy',
      tier: row.tier ?? 'free',
      access: row.access ?? 'Alpha',
      shippingName: row.shippingName ?? undefined,
      shippingAddress: row.shippingAddress ?? undefined,
      shippingCity: row.shippingCity ?? undefined,
      shippingZip: row.shippingZip ?? undefined,
    };
  },

  async upsertUser(user: Partial<UserRecord> & { id: string }): Promise<void> {
    await initDatabase();
    await db
      .insert(users)
      .values({
        id: user.id,
        email: user.email ?? null,
        stripeCustomerId: user.stripeCustomerId ?? null,
        subscriptionStatus: user.subscriptionStatus ?? 'inactive',
        credits: user.credits ?? 0,
        username: user.username ?? 'Shaggy',
        tier: user.tier ?? 'free',
        access: user.access ?? 'Alpha',
        shippingName: user.shippingName ?? null,
        shippingAddress: user.shippingAddress ?? null,
        shippingCity: user.shippingCity ?? null,
        shippingZip: user.shippingZip ?? null,
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...(user.email !== undefined && { email: user.email }),
          ...(user.stripeCustomerId !== undefined && { stripeCustomerId: user.stripeCustomerId }),
          ...(user.subscriptionStatus !== undefined && { subscriptionStatus: user.subscriptionStatus }),
          ...(user.credits !== undefined && { credits: user.credits }),
          ...(user.username !== undefined && { username: user.username }),
          ...(user.tier !== undefined && { tier: user.tier }),
          ...(user.access !== undefined && { access: user.access }),
          ...(user.shippingName !== undefined && { shippingName: user.shippingName }),
          ...(user.shippingAddress !== undefined && { shippingAddress: user.shippingAddress }),
          ...(user.shippingCity !== undefined && { shippingCity: user.shippingCity }),
          ...(user.shippingZip !== undefined && { shippingZip: user.shippingZip }),
        },
      });
  },

  async recordScan(scan: { id: string; userId: string; substanceName?: string; resultData: any }): Promise<void> {
    await initDatabase();
    // Ensure parent user exists
    await db
      .insert(users)
      .values({
        id: scan.userId,
        email: scan.userId.includes('@') ? scan.userId : null,
      })
      .onConflictDoNothing();

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
        email: r.userId || '0xanonymous',
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
    await db
      .insert(users)
      .values({
        id: tx.userId,
        email: tx.userId.includes('@') ? tx.userId : null,
      })
      .onConflictDoNothing();

    await db.insert(transactions).values({
      id: tx.id,
      userId: tx.userId,
      stripeSessionId: tx.stripeSessionId,
      amount: tx.amount,
      currency: 'usd',
      status: tx.status,
    });
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

    for (const seed of seeds) {
      await dbService.recordScan(seed);
    }
  }
};
