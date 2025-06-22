
'use client'; // For Web Crypto API if used client-side, though hashing can be server-side too

/**
 * Generates a SHA-256 hash for a given object.
 * The object is stringified, then encoded to UTF-8, then hashed.
 * @param data The object to hash.
 * @returns A Promise that resolves to the hex string of the hash.
 */
export async function generateSha256Hash(data: object): Promise<string> {
  try {
    // Stable stringify (sort keys) is important for consistent hashes if object key order might vary
    const jsonString = JSON.stringify(data, Object.keys(data).sort());
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(jsonString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  } catch (error) {
    console.error("Error generating SHA-256 hash:", error);
    throw new Error("Could not generate hash.");
  }
}
