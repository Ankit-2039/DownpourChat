/**
 * All crypto ops use Web Crypto API (native browser, no external deps)
 * AES-256-CBC with PBKDF2 key derivation
 */

const PBKDF2_ITERATIONS = 100000;
const KEY_LENGTH = 256;
const HASH = 'SHA-256';

/**
 * Derive AES-256 key from passphrase + roomId (used as salt)
 * @param {string} passphrase
 * @param {string} roomId
 * @returns {Promise<CryptoKey>}
 */
export async function deriveKey(passphrase, roomId) {
  const enc = new TextEncoder();

  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: enc.encode(roomId),
      iterations: PBKDF2_ITERATIONS,
      hash: HASH,
    },
    keyMaterial,
    { name: 'AES-CBC', length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypt plaintext with derived AES-256-CBC key
 * @param {string} plaintext
 * @param {CryptoKey} key
 * @returns {Promise<{ ciphertext: string, iv: string }>} base64 encoded
 */
export async function encryptMessage(plaintext, key) {
  const enc = new TextEncoder();
  const iv = crypto.getRandomValues(new Uint8Array(16));

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-CBC', iv },
    key,
    enc.encode(plaintext)
  );

  return {
    ciphertext: bufToBase64(encrypted),
    iv: bufToBase64(iv),
  };
}

/**
 * Decrypt ciphertext with derived AES-256-CBC key
 * @param {string} ciphertext - base64
 * @param {string} iv - base64
 * @param {CryptoKey} key
 * @returns {Promise<string>} plaintext
 */
export async function decryptMessage(ciphertext, iv, key) {
  const dec = new TextDecoder();

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-CBC', iv: base64ToBuf(iv) },
    key,
    base64ToBuf(ciphertext)
  );

  return dec.decode(decrypted);
}

// --- Helpers ---

function bufToBase64(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function base64ToBuf(base64) {
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}
