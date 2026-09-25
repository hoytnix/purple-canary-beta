const STORAGE_PUB_KEY = 'pc_public_key';
const STORAGE_PRIV_KEY = 'pc_private_key';

export interface KeyPairStrings {
  publicKey: string;
  privateKey: string;
}

// Convert ArrayBuffer to Base64
export function bufferToBase64(buffer: ArrayBuffer): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(buffer).toString('base64');
  }
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert Base64 to ArrayBuffer
export function base64ToBuffer(base64: string): ArrayBuffer {
  if (typeof Buffer !== 'undefined') {
    const buf = Buffer.from(base64, 'base64');
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Returns stored public key synchronously if available.
 */
export function getStoredPublicKey(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_PUB_KEY);
}

/**
 * Returns stored private key synchronously if available.
 */
export function getStoredPrivateKey(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_PRIV_KEY);
}

/**
 * Backward compatibility sync helper for components needing instant key string.
 */
export function getPublicKeySync(): string {
  return getStoredPublicKey() || '';
}

/**
 * Generates a legacy hex format address for fallback / mocks if WebCrypto is unavailable.
 */
export function generatePublicKey(): string {
  const hexChars = '0123456789abcdef';
  let address = '0x';
  for (let i = 0; i < 40; i++) {
    address += hexChars[Math.floor(Math.random() * 16)];
  }
  return address;
}

/**
 * Cryptographically verifies that a private key matches a given public key using ECDSA P-256.
 * Returns true if public key exists, private key exists, and private key successfully signs
 * a test payload that is verified by the public key.
 */
export async function validateKeyPair(publicKeyB64: string, privateKeyB64: string): Promise<boolean> {
  if (!publicKeyB64 || !privateKeyB64) return false;
  const pubStr = publicKeyB64.trim();
  const privStr = privateKeyB64.trim();
  if (!pubStr || !privStr) return false;

  try {
    const cryptoSubtle =
      typeof window !== 'undefined' && window.crypto?.subtle
        ? window.crypto.subtle
        : globalThis.crypto?.subtle;

    if (!cryptoSubtle) {
      return false;
    }

    const privBuffer = base64ToBuffer(privStr);
    const privKey = await cryptoSubtle.importKey(
      'pkcs8',
      privBuffer,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['sign']
    );

    const pubBuffer = base64ToBuffer(pubStr);
    const pubKey = await cryptoSubtle.importKey(
      'spki',
      pubBuffer,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['verify']
    );

    const testPayload = new TextEncoder().encode(`verify-pair:${Date.now()}`);
    const signature = await cryptoSubtle.sign(
      { name: 'ECDSA', hash: { name: 'SHA-256' } },
      privKey,
      testPayload
    );

    const isValid = await cryptoSubtle.verify(
      { name: 'ECDSA', hash: { name: 'SHA-256' } },
      pubKey,
      signature,
      testPayload
    );

    return isValid;
  } catch {
    return false;
  }
}

// In-flight singleton lock to prevent race conditions during concurrent key generation
let inFlightGenerationPromise: Promise<KeyPairStrings> | null = null;

/**
 * Initializes or retrieves existing ECDSA P-256 keypair from localStorage.
 * Ensures the stored keypair mathematically matches, auto-repairing if corrupted or mismatched.
 */
export async function getOrCreateIdentity(): Promise<KeyPairStrings> {
  if (typeof window === 'undefined') {
    return { publicKey: '', privateKey: '' };
  }

  const existingPub = localStorage.getItem(STORAGE_PUB_KEY);
  const existingPriv = localStorage.getItem(STORAGE_PRIV_KEY);

  if (existingPub && existingPriv) {
    const isValid = await validateKeyPair(existingPub, existingPriv);
    if (isValid) {
      return { publicKey: existingPub, privateKey: existingPriv };
    }
    // Mismatched or corrupted keys in localStorage - clean and auto-regenerate
    console.warn('Mismatched keypair detected in localStorage. Re-generating consistent identity.');
    localStorage.removeItem(STORAGE_PUB_KEY);
    localStorage.removeItem(STORAGE_PRIV_KEY);
  }

  return generateAndPersistKeypair();
}

/**
 * Generates a new ECDSA P-256 keypair and persists it to localStorage.
 * Uses a singleton promise to avoid multiple simultaneous calls generating divergent keys.
 */
export async function generateAndPersistKeypair(): Promise<KeyPairStrings> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    // Server-side or non-browser fallback
    const mockPub = generatePublicKey();
    return { publicKey: mockPub, privateKey: '' };
  }

  if (inFlightGenerationPromise) {
    return inFlightGenerationPromise;
  }

  inFlightGenerationPromise = (async () => {
    try {
      // Generate ECDSA P-256 keypair
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: 'ECDSA',
          namedCurve: 'P-256',
        },
        true,
        ['sign', 'verify']
      );

      // Export keys as raw SPKI (public) and PKCS8 (private) strings
      const pubRaw = await window.crypto.subtle.exportKey('spki', keyPair.publicKey);
      const privRaw = await window.crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

      const pubB64 = bufferToBase64(pubRaw);
      const privB64 = bufferToBase64(privRaw);

      localStorage.setItem(STORAGE_PUB_KEY, pubB64);
      localStorage.setItem(STORAGE_PRIV_KEY, privB64);
      window.dispatchEvent(new Event('storage'));

      return { publicKey: pubB64, privateKey: privB64 };
    } finally {
      inFlightGenerationPromise = null;
    }
  })();

  return inFlightGenerationPromise;
}

/**
 * Explicitly rotate client identity with a fresh cryptographic keypair.
 */
export async function rotateIdentity(): Promise<KeyPairStrings> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_PUB_KEY);
    localStorage.removeItem(STORAGE_PRIV_KEY);
  }
  return generateAndPersistKeypair();
}

/**
 * Signs a message string with the stored private key using ECDSA SHA-256.
 */
export async function signPayload(message: string, privateKeyB64: string): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    throw new Error('Web Crypto API is only available in browser environments.');
  }

  const privBuffer = base64ToBuffer(privateKeyB64);
  const privateKey = await window.crypto.subtle.importKey(
    'pkcs8',
    privBuffer,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  const encoder = new TextEncoder();
  const signature = await window.crypto.subtle.sign(
    { name: 'ECDSA', hash: { name: 'SHA-256' } },
    privateKey,
    encoder.encode(message)
  );

  return bufferToBase64(signature);
}

/**
 * Cryptographically authenticates identity with the backend server.
 * Does NOT insert into users table unless registerIfMissing is explicitly true.
 */
export async function syncIdentityToServer(
  identityParam?: KeyPairStrings,
  options?: {
    registerIfMissing?: boolean;
    username?: string;
    tier?: string;
    access?: string;
    shippingName?: string;
    shippingAddress?: string;
    shippingCity?: string;
    shippingZip?: string;
  }
): Promise<{ success: boolean; exists?: boolean; user?: any; error?: string }> {
  try {
    const identity = identityParam || (await getOrCreateIdentity());
    if (!identity.publicKey || !identity.privateKey) {
      return { success: false, error: 'Incomplete keypair.' };
    }

    const timestamp = Date.now().toString();
    const signature = await signPayload(`auth:${identity.publicKey}:${timestamp}`, identity.privateKey);

    const res = await fetch('/api/auth/sync-identity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        publicKey: identity.publicKey,
        privateKey: identity.privateKey,
        signature,
        timestamp,
        registerIfMissing: options?.registerIfMissing ?? false,
        username: options?.username,
        tier: options?.tier,
        access: options?.access,
        shippingName: options?.shippingName,
        shippingAddress: options?.shippingAddress,
        shippingCity: options?.shippingCity,
        shippingZip: options?.shippingZip,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || `HTTP ${res.status}` };
    }

    return { success: true, exists: data.exists, user: data.user };
  } catch (err: any) {
    console.error('Failed to sync identity to server:', err);
    return { success: false, error: err.message };
  }
}


