/**
 * Utilidades de encriptación y seguridad para datos sensibles
 * Utiliza Web Crypto API para encriptación AES-GCM
 */

// Generar clave de encriptación desde una contraseña
async function generateKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  const importedKey = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    importedKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encripta datos usando AES-GCM
 */
export async function encryptData(data: string, password: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);

    // Generar salt e IV aleatorios
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Generar clave de encriptación
    const key = await generateKey(password, salt);

    // Encriptar
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      dataBuffer
    );

    // Combinar salt + iv + datos encriptados
    const combined = new Uint8Array(
      salt.length + iv.length + encryptedBuffer.byteLength
    );
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encryptedBuffer), salt.length + iv.length);

    // Convertir a base64
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('Encryption failed:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Desencripta datos usando AES-GCM
 */
export async function decryptData(
  encryptedData: string,
  password: string
): Promise<string> {
  try {
    // Decodificar de base64
    const combined = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0));

    // Extraer salt, iv y datos encriptados
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const data = combined.slice(28);

    // Generar clave de desencriptación
    const key = await generateKey(password, salt);

    // Desencriptar
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      data
    );

    // Convertir de buffer a string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error('Decryption failed:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Genera un hash SHA-256 de un string
 */
export async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Genera un token aleatorio seguro
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Ofusca strings sensibles (tarjetas, emails, etc)
 */
export function obfuscateString(str: string, visibleChars: number = 4): string {
  if (!str || str.length <= visibleChars) return str;
  const visible = str.slice(-visibleChars);
  const hidden = '*'.repeat(str.length - visibleChars);
  return hidden + visible;
}

/**
 * Sanitiza input para prevenir XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitiza texto enriquecido (HTML) permitiendo algunas etiquetas seguras
 */
export function sanitizeRichText(html: string): string {
  if (!html) return '';
  // Eliminamos etiquetas script y onclick por seguridad
  return html
    .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, '')
    .replace(/on\w+\s*=\s*"[^"]*"/gim, '')
    .replace(/on\w+\s*=\s*'[^']*'/gim, '')
    .replace(/javascript:/gim, '');
}

/**
 * Valida si un string contiene caracteres sospechosos
 */
export function containsSuspiciousContent(input: string): boolean {
  const suspiciousPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /eval\(/gi,
    /expression\(/gi,
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/gi,
  ];

  return suspiciousPatterns.some((pattern) => pattern.test(input));
}

/**
 * Genera una clave de API segura
 */
export function generateAPIKey(): string {
  const prefix = 'urbancdg';
  const token = generateSecureToken(32);
  return `${prefix}_${token}`;
}

/**
 * Encripta datos para localStorage de forma segura
 */
export async function setSecureStorage(
  key: string,
  value: any,
  password: string
): Promise<void> {
  try {
    const jsonValue = JSON.stringify(value);
    const encrypted = await encryptData(jsonValue, password);
    localStorage.setItem(key, encrypted);
  } catch (error) {
    console.error('Failed to set secure storage:', error);
    throw error;
  }
}

/**
 * Desencripta datos de localStorage
 */
export async function getSecureStorage<T>(
  key: string,
  password: string
): Promise<T | null> {
  try {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;

    const decrypted = await decryptData(encrypted, password);
    return JSON.parse(decrypted) as T;
  } catch (error) {
    console.error('Failed to get secure storage:', error);
    return null;
  }
}

/**
 * Limpia localStorage de datos sensibles
 */
export function clearSecureStorage(): void {
  const sensitiveKeys = ['auth-token', 'user-data', 'cart-data'];
  sensitiveKeys.forEach((key) => localStorage.removeItem(key));
}

/**
 * Verifica la integridad de datos usando hash
 */
export async function verifyDataIntegrity(
  data: string,
  expectedHash: string
): Promise<boolean> {
  const actualHash = await hashData(data);
  return actualHash === expectedHash;
}
