import crypto from 'crypto';

/**
 * Generates a cryptographically random salt (16 bytes hex).
 */
export function generateSalt(bytes: number = 16): string {
  return crypto.randomBytes(bytes).toString('hex');
}

/**
 * Creates a salted PBKDF2 hash of the private key using SHA-512 with 100,000 iterations.
 * Format: `${salt}:${hash}`
 */
export function hashPrivateKey(privateKey: string, existingSalt?: string): string {
  const salt = existingSalt || generateSalt();
  const hash = crypto
    .pbkdf2Sync(privateKey.trim(), salt, 100000, 64, 'sha512')
    .toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Cryptographically verifies a private key against a stored salted hash (`${salt}:${hash}`).
 * Uses timingSafeEqual to protect against side-channel timing attacks.
 */
export function verifyPrivateKeyHash(privateKey: string, storedSaltedHash: string): boolean {
  if (!privateKey || !storedSaltedHash) return false;
  const parts = storedSaltedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, expectedHash] = parts;
  if (!salt || !expectedHash) return false;

  const computedHash = crypto
    .pbkdf2Sync(privateKey.trim(), salt, 100000, 64, 'sha512')
    .toString('hex');

  const expectedBuf = Buffer.from(expectedHash, 'hex');
  const computedBuf = Buffer.from(computedHash, 'hex');

  if (expectedBuf.length !== computedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, computedBuf);
}
