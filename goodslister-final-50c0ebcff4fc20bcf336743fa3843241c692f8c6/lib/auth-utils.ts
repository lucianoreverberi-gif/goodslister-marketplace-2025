
import crypto from 'crypto';

/**
 * Creates a secure hash + salt for a password.
 */
export function hashPassword(password: string): { salt: string; hash: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
    .toString('hex');
  return { salt, hash };
}

/**
 * Verifies a password against a stored salt and hash.
 */
export function verifyPassword(password: string, salt: string, storedHash: string): boolean {
  const hash = crypto
    .pbkdf2Sync(password, salt, 1000, 64, 'sha512')
    .toString('hex');
  return hash === storedHash;
}
