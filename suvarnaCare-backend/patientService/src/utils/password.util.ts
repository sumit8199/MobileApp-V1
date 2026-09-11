import crypto from 'crypto';

const SALT_BYTE_LENGTH = 16;
const HASH_ITERATIONS = 100000;
const KEY_LENGTH = 64;
const DIGEST = 'sha512';

/**
 * Hashes a plain-text password using cryptographically secure PBKDF2 with salt.
 * Returns the hash in the standard format `salt:hash` (hex encoded).
 */
export function hashPassword(password: string): string {
  if (!password) {
    throw new Error('Password cannot be empty.');
  }
  const salt = crypto.randomBytes(SALT_BYTE_LENGTH).toString('hex');
  const derivedKey = crypto.pbkdf2Sync(password, salt, HASH_ITERATIONS, KEY_LENGTH, DIGEST);
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Verifies a plain-text password against a stored `salt:hash` string.
 * Also supports graceful fallback for existing test passwords if needed.
 */
export function verifyPassword(password: string, storedHash?: string): boolean {
  if (!password || !storedHash) {
    return false;
  }

  // Handle standard salt:hash format
  if (storedHash.includes(':')) {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) {
      return false;
    }
    const derivedKey = crypto.pbkdf2Sync(password, salt, HASH_ITERATIONS, KEY_LENGTH, DIGEST);
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedBuffer = derivedKey;
    if (keyBuffer.length !== derivedBuffer.length) {
      return false;
    }
    return crypto.timingSafeEqual(keyBuffer, derivedBuffer);
  }

  // Fallback for legacy plain text passwords in dev mode
  return storedHash === password;
}
