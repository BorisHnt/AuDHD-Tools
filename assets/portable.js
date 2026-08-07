const ITERATIONS = 600_000;
const toArrayBuffer = (bytes) => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
const bytesToBase64 = (bytes) => {
    let binary = "";
    for (const byte of bytes)
        binary += String.fromCharCode(byte);
    return btoa(binary);
};
const base64ToBytes = (value) => {
    const binary = atob(value);
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
};
const deriveKey = async (password, salt, iterations) => {
    const material = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
    return crypto.subtle.deriveKey({ name: "PBKDF2", salt: toArrayBuffer(salt), iterations, hash: "SHA-256" }, material, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
};
export const createPortableFile = async (state, password) => {
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
export const readPortableFile = async (text, password) => {
    const file = JSON.parse(text);
    if (file.format !== "AuDHD" || file.version !== 1)
        throw new Error("Ce fichier n’est pas un fichier AuDHD compatible.");
    if (!file.encrypted)
        return file.data;
    if (!password)
        throw new Error("PASSWORD_REQUIRED");
    if (!file.encryption || typeof file.data !== "string")
        throw new Error("Fichier chiffré incomplet.");
    const salt = base64ToBytes(file.encryption.salt);
    const iv = base64ToBytes(file.encryption.iv);
    const key = await deriveKey(password, salt, file.encryption.iterations);
    try {
        const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: toArrayBuffer(iv) }, key, toArrayBuffer(base64ToBytes(file.data)));
        return JSON.parse(new TextDecoder().decode(decrypted));
    }
    catch {
        throw new Error("Mot de passe incorrect ou fichier endommagé.");
    }
};
export const downloadText = (content, filename, type = "application/json") => {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
};
