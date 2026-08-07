import type { AppState } from "./types";

const ITERATIONS = 600_000;

const toArrayBuffer = (bytes: Uint8Array) =>
  bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;

const bytesToBase64 = (bytes: Uint8Array) => {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
};

const base64ToBytes = (value: string) => {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
};

const deriveKey = async (password: string, salt: Uint8Array, iterations: number) => {
  const material = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: toArrayBuffer(salt), iterations, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
};

export const createPortableFile = async (state: AppState, password?: string) => {
  if (!password) {
    return JSON.stringify({ format: "AuDHD", version: 1, encrypted: false, data: state }, null, 2);
  }
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt, ITERATIONS);
  const plaintext = new TextEncoder().encode(JSON.stringify(state));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv: toArrayBuffer(iv) }, key, plaintext);
  return JSON.stringify({
    format: "AuDHD",
    version: 1,
    encrypted: true,
    encryption: {
      algorithm: "AES-256-GCM",
      keyDerivation: "PBKDF2-HMAC-SHA-256",
      iterations: ITERATIONS,
      salt: bytesToBase64(salt),
      iv: bytesToBase64(iv)
    },
    data: bytesToBase64(new Uint8Array(encrypted))
  }, null, 2);
};

export const readPortableFile = async (text: string, password?: string): Promise<AppState> => {
  const file = JSON.parse(text) as {
    format: string;
    version: number;
    encrypted: boolean;
    encryption?: { iterations: number; salt: string; iv: string };
    data: AppState | string;
  };
  if (file.format !== "AuDHD" || file.version !== 1) throw new Error("Ce fichier n’est pas un fichier AuDHD compatible.");
  if (!file.encrypted) return file.data as AppState;
  if (!password) throw new Error("PASSWORD_REQUIRED");
  if (!file.encryption || typeof file.data !== "string") throw new Error("Fichier chiffré incomplet.");
  const salt = base64ToBytes(file.encryption.salt);
  const iv = base64ToBytes(file.encryption.iv);
  const key = await deriveKey(password, salt, file.encryption.iterations);
  try {
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: toArrayBuffer(iv) }, key, toArrayBuffer(base64ToBytes(file.data)));
    return JSON.parse(new TextDecoder().decode(decrypted)) as AppState;
  } catch {
    throw new Error("Mot de passe incorrect ou fichier endommagé.");
  }
};

export const downloadText = (content: string, filename: string, type = "application/json") => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
