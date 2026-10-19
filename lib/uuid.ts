import { createHash } from "node:crypto";

/**
 * UUID v5 (SHA-1, RFC 9562) d'un nom dans un espace de noms : toujours le même
 * pour le même nom. Sert aux identifiants fixes des imports en base (photos du
 * site, articles du journal) : l'import et les données de secours portent les mêmes.
 */
export function uuidV5(nom: string, espace: string): string {
  const empreinte = createHash("sha1").update(Buffer.from(espace.replace(/-/g, ""), "hex")).update(nom, "utf8").digest();
  const o = empreinte.subarray(0, 16);
  o[6] = (o[6] & 0x0f) | 0x50; // version 5
  o[8] = (o[8] & 0x3f) | 0x80; // variante RFC
  const h = o.toString("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
