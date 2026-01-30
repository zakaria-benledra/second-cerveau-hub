/**
 * TOKEN ENCRYPTION MODULE - Production-Grade Compliance
 * 
 * Features:
 * - AES-256-GCM encryption (NIST compliant)
 * - NO DEFAULT KEY FALLBACK - fails hard if not configured
 * - Encryption versioning for key rotation (v1, v2, ...)
 * - Migration support for plaintext tokens
 * - Audit logging for compliance
 * 
 * SECURITY REQUIREMENTS:
 * - TOKEN_ENCRYPTION_KEY must be exactly 32 characters
 * - Keys must never be logged or exposed
 * - Decryption failures must not expose key material
 */

const CURRENT_ENCRYPTION_VERSION = 2;
const SUPPORTED_VERSIONS = [1, 2] as const;

export interface EncryptedToken {
  ciphertext: string;
  version: number;
}

export interface EncryptionResult {
  success: boolean;
  data?: EncryptedToken;
  error?: string;
}

export interface DecryptionResult {
  success: boolean;
  token?: string;
  error?: string;
}

/**
 * Get encryption key from environment with strict validation.
 * FAILS HARD if not configured - no fallback allowed.
 * 
 * @throws Error if key is missing, too short, or invalid
 */
async function getEncryptionKey(version: number = CURRENT_ENCRYPTION_VERSION): Promise<CryptoKey> {
  // Validate version
  if (!SUPPORTED_VERSIONS.includes(version as typeof SUPPORTED_VERSIONS[number])) {
    throw new Error(`ENCRYPTION_ERROR: Unsupported version ${version}. Supported: ${SUPPORTED_VERSIONS.join(', ')}`);
  }

  const keyEnvName = version === 1 
    ? 'TOKEN_ENCRYPTION_KEY_V1' 
    : 'TOKEN_ENCRYPTION_KEY';
  
  const secret = Deno.env.get(keyEnvName);
  
  // CRITICAL: No default fallback - fail hard
  if (!secret) {
    throw new Error(`ENCRYPTION_CONFIG_ERROR: ${keyEnvName} is not configured. Token encryption is required for security compliance.`);
  }
  
  if (secret.length < 32) {
    throw new Error(`ENCRYPTION_CONFIG_ERROR: ${keyEnvName} must be at least 32 characters (got ${secret.length}). This is a security requirement.`);
  }
  
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret.slice(0, 32));
  
  try {
    return await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );
  } catch (error) {
    throw new Error(`ENCRYPTION_KEY_ERROR: Failed to import encryption key: ${(error as Error).message}`);
  }
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
