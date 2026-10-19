#!/usr/bin/env node
/**
 * Copie des fichiers du bucket Storage `medias` (photos envoyées depuis le back
 * office) vers un dossier local — lancé par le workflow de sauvegarde.
 *
 * Un dump SQL n'emporte que les lignes `photos` / `articles`, jamais les
 * fichiers : sans cette copie, une restauration pointerait vers des images
 * disparues. Incrémental : un fichier déjà présent (même taille) n'est pas
 * retéléchargé. Les fichiers supprimés du bucket restent dans la sauvegarde.
 *
 * Usage : node outils/sauvegarder_medias.mjs <dossier>
 * Variables : NEXT_PUBLIC_SUPABASE_URL, supabase_service_role_key.
 */

import { mkdirSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const BUCKET = "medias";
const PAR_PAGE = 1000;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
const cle = process.env.supabase_service_role_key;
const dossier = process.argv[2];
if (!url || !cle || !dossier) {
  console.error("Usage : node outils/sauvegarder_medias.mjs <dossier> (NEXT_PUBLIC_SUPABASE_URL et supabase_service_role_key requis)");
  process.exit(2);
}

const entetes = { Authorization: `Bearer ${cle}`, apikey: cle };

/** Liste récursive des objets du bucket (un dossier est renvoyé avec `id: null`). */
async function lister(prefixe = "") {
  const objets = [];
  for (let decalage = 0; ; decalage += PAR_PAGE) {
    const reponse = await fetch(`${url}/storage/v1/object/list/${BUCKET}`, {
      method: "POST",
      headers: { ...entetes, "Content-Type": "application/json" },
      body: JSON.stringify({ prefix: prefixe, limit: PAR_PAGE, offset: decalage, sortBy: { column: "name", order: "asc" } }),
    });
    if (!reponse.ok) throw new Error(`Liste de « ${prefixe || "/"} » impossible : ${reponse.status} ${await reponse.text()}`);
    const page = await reponse.json();
    for (const entree of page) {
      const chemin = prefixe ? `${prefixe}/${entree.name}` : entree.name;
      if (entree.id === null) objets.push(...(await lister(chemin)));
      else objets.push({ chemin, taille: entree.metadata?.size ?? null });
    }
    if (page.length < PAR_PAGE) return objets;
  }
}

function tailleLocale(fichier) {
  try {
    return statSync(fichier).size;
  } catch {
    return null;
  }
}

const objets = await lister();
let copies = 0;
for (const { chemin, taille } of objets) {
  // Défense : un chemin de bucket ne doit jamais sortir du dossier de sauvegarde.
  if (chemin.split("/").some((morceau) => morceau === ".." || morceau === "")) throw new Error(`Chemin refusé : ${chemin}`);
  const cible = join(dossier, chemin);
  if (taille !== null && tailleLocale(cible) === taille) continue;
  const reponse = await fetch(`${url}/storage/v1/object/authenticated/${BUCKET}/${chemin.split("/").map(encodeURIComponent).join("/")}`, {
    headers: entetes,
  });
  if (!reponse.ok) throw new Error(`Téléchargement de ${chemin} impossible : ${reponse.status}`);
  mkdirSync(dirname(cible), { recursive: true });
  writeFileSync(cible, Buffer.from(await reponse.arrayBuffer()));
  copies += 1;
}
console.log(`[medias] ${objets.length} fichier(s) dans le bucket, ${copies} copié(s).`);
