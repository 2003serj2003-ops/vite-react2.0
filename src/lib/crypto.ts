/**
 * Client-side encryption utilities using WebCrypto API
 * 
 * Security model:
 * - PBKDF2(SHA-256) with 200k iterations for key derivation from PIN
 * - AES-GCM-256 for encryption (authenticated encryption)
 * - Random salt (16 bytes) and IV (12 bytes) per encryption
 * - Token never stored in plaintext, never logged
 */

const PBKDF2_ITERATIONS = 200000;
const SALT_LENGTH = 16; // bytes
const IV_LENGTH = 12; // bytes for AES-GCM

/**
 * Convert string to ArrayBuffer
 */
function str2buf(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/**
 * Convert ArrayBuffer to string
 */
function buf2str(buffer: ArrayBuffer): string {
  return new TextDecoder().decode(buffer);
}

/**
 * Convert ArrayBuffer to base64 string
 */
function buf2base64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * Convert base64 string to ArrayBuffer
 */
function base642buf(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Generate random bytes
 */
function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Derive AES-GCM key from PIN using PBKDF2
 */
async function deriveKey(pin: string, salt: Uint8Array): Promise<CryptoKey> {
  // Import PIN as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    str2buf(pin).buffer as ArrayBuffer,
    'PBKDF2',
    false,
    ['deriveKey']
  );

  // Derive AES-GCM key
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt token with PIN
 * Returns: { cipher, iv, salt } all as base64
 */
export async function encryptToken(
  token: string,
  pin: string
): Promise<{
  cipher: string;
  iv: string;
  salt: string;
}> {
  console.log('[encryptToken] Starting encryption...');
  console.log('[encryptToken] Token length:', token?.length);
  console.log('[encryptToken] PIN length:', pin?.length);
  
  if (!token || token.trim().length === 0) {
    console.error('[encryptToken] Token is empty');
    throw new Error('Токен не может быть пустым');
  }
  if (!pin || pin.length < 6 || pin.length > 10) {
    console.error('[encryptToken] Invalid PIN length:', pin?.length);
    throw new Error('PIN должен быть от 6 до 10 символов');
  }

  try {
    // Generate random salt and IV
    console.log('[encryptToken] Generating salt and IV...');
    const salt = randomBytes(SALT_LENGTH);
    const iv = randomBytes(IV_LENGTH);

    // Derive key from PIN
    console.log('[encryptToken] Deriving key from PIN...');
    const key = await deriveKey(pin, salt);

    // Encrypt token
    console.log('[encryptToken] Encrypting token...');
    const cipherBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv.buffer as ArrayBuffer
      },
      key,
      str2buf(token).buffer as ArrayBuffer
    );

    console.log('[encryptToken] Encryption successful');
    
    const result = {
      cipher: buf2base64(cipherBuffer),
      iv: buf2base64(iv.buffer as ArrayBuffer),
      salt: buf2base64(salt.buffer as ArrayBuffer)
    };
    
    console.log('[encryptToken] Result prepared');
    return result;
  } catch (error) {
    console.error('[encryptToken] Encryption failed:', error);
    throw error;
  }
}

/**
 * Decrypt token with PIN
 * Returns: decrypted token string
 * Throws: if PIN is wrong or data is corrupted
 */
export async function decryptToken(
  cipher: string,
  iv: string,
  salt: string,
  pin: string
): Promise<string> {
  if (!cipher || !iv || !salt) {
    throw new Error('Отсутствуют данные шифрования');
  }
  if (!pin || pin.length < 6 || pin.length > 10) {
    throw new Error('PIN должен быть от 6 до 10 символов');
  }

  try {
    // Convert from base64
    const cipherBuffer = base642buf(cipher);
    const ivBuffer = base642buf(iv);
    const saltBuffer = new Uint8Array(base642buf(salt));

    // Derive key from PIN
    const key = await deriveKey(pin, saltBuffer);

    // Decrypt
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBuffer
      },
      key,
      cipherBuffer
    );

    return buf2str(decryptedBuffer);
  } catch (error) {
    // Decryption failed = wrong PIN or corrupted data
    throw new Error('Decryption failed: wrong PIN or corrupted data');
  }
}

/**
 * Validate PIN format
 */
export function validatePin(pin: string): { valid: boolean; error?: string } {
  if (!pin) {
    return { valid: false, error: 'PIN не может быть пустым' };
  }
  if (pin.length < 6) {
    return { valid: false, error: 'PIN должен быть минимум 6 символов' };
  }
  if (pin.length > 10) {
    return { valid: false, error: 'PIN должен быть максимум 10 символов' };
  }
  if (!/^[0-9a-zA-Z]+$/.test(pin)) {
    return { valid: false, error: 'PIN может содержать только буквы и цифры' };
  }
  return { valid: true };
}

/**
 * Check if WebCrypto API is available
 */
export function isCryptoAvailable(): boolean {
  return typeof crypto !== 'undefined' && 
         typeof crypto.subtle !== 'undefined' &&
         typeof crypto.getRandomValues !== 'undefined';
}

/**
 * Get master key for PIN encryption from environment
 * In production, this should come from KMS/Vault
 */
function getMasterKey(): string {
  // Используем фиксированный ключ для разработки
  // В продакшене это должно быть из безопасного хранилища (KMS, Vault)
  const masterKey = import.meta.env.VITE_MASTER_KEY || 'DEFAULT_MASTER_KEY_CHANGE_IN_PRODUCTION';
  return masterKey;
}

/**
 * Encrypt PIN with master key (for persistent storage in DB)
 * Returns: { cipher, iv, salt } all as base64
 */
export async function encryptPIN(
  pin: string
): Promise<{
  cipher: string;
  iv: string;
  salt: string;
}> {
  console.log('[encryptPIN] Starting PIN encryption...');
  const masterKey = getMasterKey();
  console.log('[encryptPIN] Master key obtained, length:', masterKey.length);
  
  try {
    const result = await encryptToken(pin, masterKey);
    console.log('[encryptPIN] PIN encryption successful');
    return result;
  } catch (error) {
    console.error('[encryptPIN] PIN encryption failed:', error);
    throw error;
  }
}

/**
 * Decrypt PIN with master key (from DB)
 * Returns: decrypted PIN string
 */
export async function decryptPIN(
  cipher: string,
  iv: string,
  salt: string
): Promise<string> {
  const masterKey = getMasterKey();
  return decryptToken(cipher, iv, salt, masterKey);
}
