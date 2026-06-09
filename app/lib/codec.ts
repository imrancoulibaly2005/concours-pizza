// Clé de chiffrement partagée client/serveur
const K = [0x4f,0x3a,0x7c,0x2e,0x91,0xb3,0x55,0x18,0x6d,0xa2,0x33,0x5f,0x89,0xc4,0x71,0x0e,0x27,0xd8,0x5b,0x3c]

// Encode côté serveur (Node Buffer disponible)
export function encodeResult(obj: object): string {
  const json = JSON.stringify(obj)
  const bytes = Array.from(Buffer.from(json, "utf8")).map((b, i) => b ^ K[i % K.length])
  return Buffer.from(bytes).toString("base64url")
}

// Decode côté client (browser)
export function decodeResult<T>(s: string): T {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"))
  const bytes = Array.from(bin).map((c, i) => c.charCodeAt(0) ^ K[i % K.length])
  return JSON.parse(String.fromCharCode(...bytes)) as T
}
