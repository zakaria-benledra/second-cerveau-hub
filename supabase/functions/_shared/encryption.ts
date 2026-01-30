/**
 * Token Encryption Module - Production-Grade
 * 
 * Features:
 * - AES-256-GCM encryption
 * - NO DEFAULT KEY FALLBACK (fails if not configured)
 * - Encryption versioning for key rotation
 * - Migration support for plaintext tokens
 */

const CURRENT_ENCRYPTION_VERSION = 2;

interface EncryptedToken {
  ciphertext: string;
  version: number;
}

/**
 * Get encryption key from environment.
 * FAILS if not configured - no default fallback.
 */
async function getEncryptionKey(version: number = CURRENT_ENCRYPTION_VERSION): Promise<CryptoKey> {
  const keyEnvName = version === 1 
    ? 'TOKEN_ENCRYPTION_KEY_V1' 
    : 'TOKEN_ENCRYPTION_KEY';
  
  const secret = Deno.env.get(keyEnvName);
  
  if (!secret || secret.length < 32) {
    throw new Error(`Encryption key ${keyEnvName} not configured or too short. Must be at least 32 characters.`);
  }
  
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret.slice(0, 32));
  
  return crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt a token with current encryption version.
 */
export async function encryptToken(token: string): Promise<EncryptedToken> {
  const key = await getEncryptionKey();
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  
  // Combine IV + ciphertext
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return {
    ciphertext: btoa(String.fromCharCode(...combined)),
    version: CURRENT_ENCRYPTION_VERSION
  };
}

/**
 * Decrypt a token, supporting multiple versions for rotation.
 */
export async function decryptToken(
  encrypted: string, 
  version: number = CURRENT_ENCRYPTION_VERSION
): Promise<string> {
  const key = await getEncryptionKey(version);
  const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
  
  return new TextDecoder().decode(decrypted);
}

/**
 * Migrate a plaintext token to encrypted format.
 */
export async function migrateToken(plaintext: string): Promise<EncryptedToken> {
  return encryptToken(plaintext);
}

/**
 * Check if encryption is properly configured.
 */
export function isEncryptionConfigured(): boolean {
  const key = Deno.env.get('TOKEN_ENCRYPTION_KEY');
  return !!key && key.length >= 32;
}

export { CURRENT_ENCRYPTION_VERSION };
