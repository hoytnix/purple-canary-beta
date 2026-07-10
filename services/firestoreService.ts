import { db } from './firebase';
import { collection, addDoc, getDocs, query, where, setDoc, doc, getDoc, onSnapshot, limit } from 'firebase/firestore';
import { ScanRecord } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null, clientEmail?: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: clientEmail || null,
      email: clientEmail || null,
      emailVerified: false,
      isAnonymous: true,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Save a new scan record to Firestore
export async function saveScanRecord(publicKey: string, scan: Omit<ScanRecord, 'id'>) {
  try {
    const scansRef = collection(db, 'scans');
    const dataToSave = {
      ...scan,
      publicKey,
      createdAt: new Date().toISOString()
    };
    console.log("Saving scan record:", dataToSave);
    const docRef = await addDoc(scansRef, dataToSave);
    return docRef.id;
  } catch (e) {
    console.error("Firestore Save Error Details:", e);
    handleFirestoreError(e, OperationType.WRITE, 'scans', publicKey);
    return null;
  }
}

// Fetch scan records for a publicKey from Firestore
export async function getScanRecords(publicKey: string): Promise<ScanRecord[]> {
  try {
    const scansRef = collection(db, 'scans');
    const q = query(scansRef, where('publicKey', '==', publicKey));
    const querySnapshot = await getDocs(q);
    const records: ScanRecord[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      records.push({
        id: doc.id.substring(0, 10).toUpperCase(), // readable ID from doc ID
        date: data.date,
        location: data.location,
        verdict: data.verdict,
        matrix: data.matrix,
        detections: data.detections || [],
        createdAt: data.createdAt || data.date
      } as any);
    });

    // Sort client side to avoid missing index exceptions
    records.sort((a: any, b: any) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return records;
  } catch (e) {
    handleFirestoreError(e, OperationType.GET, 'scans', publicKey);
    return [];
  }
}

// Live subscriber for scan records (real-time updates)
export function subscribeScanRecords(publicKey: string, callback: (records: ScanRecord[]) => void) {
  const scansRef = collection(db, 'scans');
  const q = query(scansRef, where('publicKey', '==', publicKey));
  
  return onSnapshot(q, (snapshot) => {
    const records: ScanRecord[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      records.push({
        id: doc.id.substring(0, 10).toUpperCase(),
        date: data.date,
        location: data.location,
        verdict: data.verdict,
        matrix: data.matrix,
        detections: data.detections || [],
        createdAt: data.createdAt || data.date
      } as any);
    });

    // Sort client side
    records.sort((a: any, b: any) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    callback(records);
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'scans', publicKey);
  });
}

// Live subscriber for ALL latest scan records across the system (for live network activity)
export function subscribeAllLatestScanRecords(callback: (data: { items: any[], totalScans: number, uniquePublicKeys: number }) => void, limitCount: number = 30) {
  const scansRef = collection(db, 'scans');
  
  return onSnapshot(scansRef, (snapshot) => {
    const records: any[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      records.push({
        id: doc.id.substring(0, 10).toUpperCase(),
        date: data.date,
        location: data.location || 'Unknown Field Lab',
        verdict: data.verdict || 'CLEAN',
        matrix: data.matrix || 'Unknown Matrix',
        detections: data.detections || [],
        createdAt: data.createdAt || data.date || new Date().toISOString(),
        email: data.email || '0xanonymous'
      });
    });

    // Sort client side by createdAt descending
    records.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    const uniqueKeys = new Set(records.map(r => r.email));

    callback({
      items: records.slice(0, limitCount),
      totalScans: records.length,
      uniquePublicKeys: uniqueKeys.size || 1 // fallback to at least 1 if empty
    });
  }, (error) => {
    handleFirestoreError(error, OperationType.GET, 'scans', null);
  });
}

// Profile schemas and functions
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

export async function saveUserProfile(profile: UserProfile) {
  try {
    const userRef = doc(db, 'users', profile.publicKey);
    await setDoc(userRef, profile, { merge: true });
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, `users/${profile.publicKey}`, profile.publicKey);
  }
}

export async function getUserProfile(publicKey: string): Promise<UserProfile | null> {
  try {
    const userRef = doc(db, 'users', publicKey);
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (e) {
    handleFirestoreError(e, OperationType.GET, `users/${publicKey}`, publicKey);
    return null;
  }
}

export async function seedScansIfEmpty() {
  try {
    const scansRef = collection(db, 'scans');
    const q = query(scansRef, limit(1));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      console.log('Seeding initial scans in Firestore...');
      const seeds = [
        {
          publicKey: '0x99aabbccddeeff11',
          date: new Date(Date.now() - 3 * 60000).toISOString().split('T')[0],
          location: 'Berlin Harm Reduction Center',
          matrix: 'SOLID_CRYSTAL',
          verdict: 'CLEAN',
          detections: [
            { name: 'MDMA', hazard: 'SAFE', rf: 0.25, hex: '#FFBF00' },
            { name: 'Caffeine', hazard: 'SAFE', rf: 0.50, hex: '#E0FFFF' }
          ]
        },
        {
          publicKey: '0x8f00ff00ffff99aa',
          date: new Date(Date.now() - 15 * 60000).toISOString().split('T')[0],
          location: 'Boston Analyst Hub',
          matrix: 'LIQUID_VAPE',
          verdict: 'HIGH RISK',
          detections: [
            { name: 'Cocaine', hazard: 'HIGH', rf: 0.65, hex: '#FFFFFF' },
            { name: 'Levamisole', hazard: 'CRITICAL', rf: 0.12, hex: '#00FFFF' }
          ]
        },
        {
          publicKey: '0x3a2b4c5d6e7f8901',
          date: new Date(Date.now() - 35 * 60000).toISOString().split('T')[0],
          location: 'Tokyo Testing Facility',
          matrix: 'SOLID_CRYSTAL',
          verdict: 'LETHAL',
          detections: [
            { name: 'Fentanyl (HCl)', hazard: 'LETHAL', rf: 0.55, hex: '#FCF8E3' },
            { name: 'Xylazine', hazard: 'HIGH', rf: 0.38, hex: '#FF4500' }
          ]
        },
        {
          publicKey: '0x1122334455667788',
          date: new Date(Date.now() - 60 * 60000).toISOString().split('T')[0],
          location: 'London Field Unit',
          matrix: 'SOLID_CRYSTAL',
          verdict: 'CLEAN',
          detections: [
            { name: 'Ketamine', hazard: 'SAFE', rf: 0.42, hex: '#E0FFFF' }
          ]
        },
        {
          publicKey: '0x55aa55aa55aa55aa',
          date: new Date(Date.now() - 120 * 60000).toISOString().split('T')[0],
          location: 'Sydney Mobile Lab',
          matrix: 'SOLID_CRYSTAL',
          verdict: 'HIGH RISK',
          detections: [
            { name: 'THC', hazard: 'SAFE', rf: 0.82, hex: '#00FF00' },
            { name: 'Synthetic Cannabinoid AM-2201', hazard: 'HIGH', rf: 0.68, hex: '#FF4500' }
          ]
        },
        {
          publicKey: '0x77bb88cc99ddaaee',
          date: new Date(Date.now() - 180 * 60000).toISOString().split('T')[0],
          location: 'Paris Lab A',
          matrix: 'SOLID_CRYSTAL',
          verdict: 'CLEAN',
          detections: [
            { name: 'LSD', hazard: 'SAFE', rf: 0.15, hex: '#FF00FF' }
          ]
        },
        {
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
      ];

      for (const item of seeds) {
        const idx = seeds.indexOf(item);
        const createdAt = new Date(Date.now() - idx * 15 * 60000).toISOString();
        await addDoc(scansRef, {
          ...item,
          createdAt
        });
      }
      console.log('Successfully seeded scans.');
    }
  } catch (error) {
    console.error('Failed to seed scans:', error);
  }
}
