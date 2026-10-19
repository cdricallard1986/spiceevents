"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { exigerAdmin, type ContexteAdmin } from "@/lib/admin/garde";
import {
  COLONNES_ARTICLE_ADMIN,
  adressePublique,
  aujourdhuiParis,
  cheminEnvoiArticle,
  estSlugProvisoire,
  slugProvisoire,
  type LigneArticleAdmin,
  type ResultatArticle,
  type ResultatCopiePhoto,
  type ResultatCreationArticle,
  type ResultatEchec,
  type ResultatSuppressionArticle,
  type ResultatUrlEnvoiArticle,
} from "@/lib/journal/admin";
import { ETIQUETTE_ARTICLES } from "@/lib/journal/lecture";
import { premiereErreur, schemaIdArticle, validerChampsArticle, verifierPublication, type ErreursArticle } from "@/lib/journal/schema";
import { lireSlugAuto, messageManques, typeDepuisChemin } from "@/lib/journal/schema-admin";
import { slugLibre } from "@/lib/journal/slug";
import { BUCKET_MEDIAS } from "@/lib/photos/constantes";
import { schemaDemandeEnvoi, schemaIdPhoto } from "@/lib/photos/schema";

// ⚠️ Fichier « use server » : chaque export est un point d'entrée HTTP public,
// appelable par n'importe qui avec n'importe quels arguments. Chaque export :
// `exigerAdmin()` en tête, puis Zod (lib/journal/schema.ts : champs, document
// de l'éditeur, identifiant), écriture avec le client de SESSION (RLS :
// est_admin()) — jamais la clé service_role —, puis `revalidateTag("articles")`
// dès que le site public peut changer.
//
// Aucune photo ne transite par ici : le navigateur l'envoie directement à
// Storage avec l'URL signée de `creerUrlEnvoiArticle` (limite de 4,5 Mo de Vercel).

type Supabase = ContexteAdmin["supabase"];
type ErreurSupabase = { code?: string; message: string; statusCode?: string; status?: number };

const LISTE = "/admin/journal";
const SLUG_FIGE = "L'adresse d'un article publié ne change plus (Google et les liens vers l'article pointent dessus).";

/** Message clair pour Cédric (le détail technique part dans les journaux du serveur). */
function echec(action: string, e: ErreurSupabase): ResultatEchec {
  console.warn(`[admin] Journal — ${action} : ${e.code ?? e.statusCode ?? ""} ${e.message}`);
  if (e.code === "42501" || e.statusCode === "403" || e.status === 403) return { ok: false, message: "Droits refusés par la base : reconnectez-vous puis réessayez." };
  if (e.code === "23505") return { ok: false, message: "Cette adresse est déjà prise par un autre article : choisissez-en une autre.", erreurs: { slug: "Adresse déjà prise." } };
  if (e.code === "23514") {
    if (/adresse/i.test(e.message)) return { ok: false, message: SLUG_FIGE, erreurs: { slug: SLUG_FIGE } };
    if (/publie_complet/.test(e.message)) return { ok: false, message: "Un article publié doit rester complet (titre, description, catégorie, date, couverture et son texte alternatif)." };
    return { ok: false, message: "La base a refusé l'article : une valeur dépasse ses limites (longueur, adresse, catégorie, photo)." };
  }
  return { ok: false, message: `${action} impossible : la base ne répond pas. Réessayez dans un instant.` };
}

const INTROUVABLE: ResultatEchec = { ok: false, message: "Article introuvable : il a peut-être été supprimé. Rechargez la page." };

function invalide(message: string | undefined): ResultatEchec {
  return { ok: false, message: message ?? "Demande invalide : rechargez la page puis réessayez." };
}

function erreursChamps(erreurs: ErreursArticle): ResultatEchec {
  return { ok: false, message: premiereErreur(erreurs), erreurs };
}

/** Adresses déjà prises par les AUTRES articles qui commencent comme `base` (pour `slugLibre`). */
async function slugsPris(supabase: Supabase, base: string, id: string): Promise<Set<string> | ErreurSupabase> {
  // `base` est validée (minuscules, chiffres, tirets) : ni `%` ni `_` à échapper.
  const { data, error } = await supabase.from("articles").select("slug").like("slug", `${base}%`).neq("id", id);
  if (error) return error;
  return new Set((data ?? []).map((l) => String(l.slug)));
}

/** « Nouvel article » : une ligne brouillon tout de suite (adresse provisoire, titre vide, date du jour), puis l'éditeur. */
export async function creerArticle(): Promise<ResultatCreationArticle> {
  const { supabase } = await exigerAdmin();
  for (let essai = 0; essai < 3; essai++) {
    const slug = slugProvisoire(randomBytes(5).toString("hex"));
    const { data, error } = await supabase.from("articles").insert({ slug, titre: "", date_publication: aujourdhuiParis() }).select("id").single();
    if (!error && data) {
      revalidatePath(LISTE);
      return { ok: true, id: String(data.id) };
    }
    // Adresse provisoire déjà prise (hasard) : on en tire une autre.
    if (error?.code !== "23505") return echec("Création de l'article", error ?? { message: "réponse vide" });
  }
  return { ok: false, message: "Création de l'article impossible : réessayez." };
}

/**
 * Enregistrement automatique de l'éditeur (tous les champs et le document).
 * L'adresse :
 * - d'un article déjà publié une fois ne change plus (et la base le refuse aussi) ;
 * - qui suit le titre (`slugAuto`) prend un numéro si elle est déjà prise (`-2`, `-3`…) ;
 * - saisie à la main et déjà prise : refusée, avec une proposition libre.
 * Un article en ligne reste complet : ce qui manquerait est signalé champ par champ.
 */
export async function enregistrerArticle(id: unknown, champs: unknown): Promise<ResultatArticle> {
  const { supabase } = await exigerAdmin();
  const idValide = schemaIdArticle.safeParse(id);
  if (!idValide.success) return INTROUVABLE;
  const v = validerChampsArticle(champs);
  if (!v.ok) return erreursChamps(v.erreurs);
  const slugAuto = lireSlugAuto(champs);

  const { data: actuel, error } = await supabase.from("articles").select("id, statut, publie_le, slug").eq("id", idValide.data).maybeSingle();
  if (error) return echec("Enregistrement", error);
  if (!actuel) return INTROUVABLE;

  let slug = v.champs.slug;
  if (actuel.publie_le !== null && slug !== actuel.slug) return { ok: false, message: SLUG_FIGE, erreurs: { slug: SLUG_FIGE } };
  if (actuel.statut === "publie") {
    const manque = verifierPublication(v.champs);
    if (Object.keys(manque).length > 0) {
      return { ok: false, message: `${premiereErreur(manque)} Un article en ligne reste complet : pour le laisser inachevé, retirez-le du site.`, erreurs: manque };
    }
  }
  if (slug !== actuel.slug) {
    const prises = await slugsPris(supabase, slug, idValide.data);
    if (!(prises instanceof Set)) return echec("Vérification de l'adresse", prises);
    if (prises.has(slug)) {
      const libre = slugLibre(slug, prises);
      if (!slugAuto) {
        const message = `L'adresse ${adressePublique(slug)} est déjà prise par un autre article. Proposition : ${libre}`;
        return { ok: false, message, erreurs: { slug: message } };
      }
      slug = libre;
    }
  }

  const { data, error: erreurMaj } = await supabase.from("articles").update({ ...v.champs, slug }).eq("id", idValide.data).select(COLONNES_ARTICLE_ADMIN).maybeSingle();
  if (erreurMaj) return echec("Enregistrement", erreurMaj);
  if (!data) return INTROUVABLE;
  // Un brouillon n'est pas sur le site : rien à régénérer.
  if (actuel.statut === "publie") revalidateTag(ETIQUETTE_ARTICLES);
  return { ok: true, article: data as LigneArticleAdmin };
}

/**
 * Publication (confirmée dans l'interface) : l'article doit être complet ;
 * sinon, la liste de ce qui manque. La date de première publication est
 * posée une seule fois : l'adresse est alors figée.
 */
export async function publierArticle(id: unknown): Promise<ResultatArticle> {
  const { supabase } = await exigerAdmin();
  const idValide = schemaIdArticle.safeParse(id);
  if (!idValide.success) return INTROUVABLE;
  const { data: ligne, error } = await supabase.from("articles").select(COLONNES_ARTICLE_ADMIN).eq("id", idValide.data).maybeSingle();
  if (error) return echec("Publication", error);
  if (!ligne) return INTROUVABLE;
  const article = ligne as LigneArticleAdmin;
  if (article.statut === "publie") return { ok: true, article };

  const v = validerChampsArticle(article);
  if (!v.ok) return { ok: false, message: `L'article ne peut pas être publié : ${premiereErreur(v.erreurs)}`, erreurs: v.erreurs };
  const manque = verifierPublication(v.champs);
  if (estSlugProvisoire(article.slug)) manque.slug = "Choisissez l'adresse de l'article avant de le publier : elle ne changera plus ensuite.";
  if (Object.keys(manque).length > 0) return { ok: false, message: messageManques(manque), erreurs: manque };

  const { data, error: erreurMaj } = await supabase
    .from("articles")
    .update({ statut: "publie", publie_le: article.publie_le ?? new Date().toISOString() })
    .eq("id", idValide.data)
    .select(COLONNES_ARTICLE_ADMIN)
    .maybeSingle();
  if (erreurMaj) return echec("Publication", erreurMaj);
  if (!data) return INTROUVABLE;
  revalidateTag(ETIQUETTE_ARTICLES);
  revalidatePath(LISTE);
  return { ok: true, article: data as LigneArticleAdmin };
}

/** Retirer du site (confirmé) : l'article redevient un brouillon ; son adresse reste figée et renvoie une page introuvable. */
export async function retirerArticle(id: unknown): Promise<ResultatArticle> {
  const { supabase } = await exigerAdmin();
  const idValide = schemaIdArticle.safeParse(id);
  if (!idValide.success) return INTROUVABLE;
  const { data, error } = await supabase.from("articles").update({ statut: "brouillon" }).eq("id", idValide.data).select(COLONNES_ARTICLE_ADMIN).maybeSingle();
  if (error) return echec("Retrait du site", error);
  if (!data) return INTROUVABLE;
  revalidateTag(ETIQUETTE_ARTICLES);
  revalidatePath(LISTE);
  return { ok: true, article: data as LigneArticleAdmin };
}

/**
 * Suppression définitive (confirmée) : seulement un article JAMAIS publié.
 * Un article qui a été en ligne a une adresse connue de Google : on le
 * retire du site, on ne le supprime pas.
 */
export async function supprimerArticle(id: unknown): Promise<ResultatSuppressionArticle> {
  const { supabase } = await exigerAdmin();
  const idValide = schemaIdArticle.safeParse(id);
  if (!idValide.success) return INTROUVABLE;
  const { data: ligne, error } = await supabase.from("articles").select("id, publie_le").eq("id", idValide.data).maybeSingle();
  if (error) return echec("Suppression", error);
  if (!ligne) return INTROUVABLE;
  if (ligne.publie_le !== null) return { ok: false, message: "Cet article a déjà été publié : il ne peut plus être supprimé. Retirez-le du site, il restera ici en brouillon." };
  const { data, error: erreurSuppression } = await supabase.from("articles").delete().eq("id", idValide.data).is("publie_le", null).select("id");
  if (erreurSuppression) return echec("Suppression", erreurSuppression);
  if (!data || data.length === 0) return INTROUVABLE;
  revalidatePath(LISTE);
  return { ok: true, id: idValide.data };
}

/** URL signée pour envoyer UNE photo d'article (couverture ou texte) directement à Storage, sous `journal/<aaaa>/<mm>/…`. */
export async function creerUrlEnvoiArticle(entree: unknown): Promise<ResultatUrlEnvoiArticle> {
  const { supabase } = await exigerAdmin();
  const v = schemaDemandeEnvoi.safeParse(entree);
  if (!v.success) return invalide(v.error.issues[0]?.message);
  const chemin = cheminEnvoiArticle(v.data.type, new Date(), randomBytes(6).toString("hex"));
  const { data, error } = await supabase.storage.from(BUCKET_MEDIAS).createSignedUploadUrl(chemin);
  if (error || !data) return echec("Préparation de l'envoi", error ?? { message: "réponse vide" });
  return { ok: true, chemin: data.path, jeton: data.token };
}

/**
 * Couverture choisie dans la photothèque : une photo ENVOYÉE (`galeries/…`)
 * est copiée dans le dossier du journal du bucket (la couverture n'accepte que
 * `journal/…`), sans passer par le navigateur. Une photo du site est envoyée
 * par le navigateur, comme une nouvelle photo.
 */
export async function copierPhotoPhototheque(photoId: unknown): Promise<ResultatCopiePhoto> {
  const { supabase } = await exigerAdmin();
  const v = schemaIdPhoto.safeParse(photoId);
  if (!v.success) return invalide("Photo introuvable : rechargez la page.");
  const { data: photo, error } = await supabase.from("photos").select("id, origine, chemin, alt_fr").eq("id", v.data).maybeSingle();
  if (error) return echec("Copie de la photo", error);
  if (!photo) return invalide("Photo introuvable : elle a peut-être été supprimée. Rechargez la page.");
  const type = photo.origine === "stockage" ? typeDepuisChemin(String(photo.chemin)) : null;
  if (!type) return invalide("Cette photo ne peut pas être copiée ici : choisissez-en une autre.");
  const destination = cheminEnvoiArticle(type, new Date(), randomBytes(6).toString("hex"));
  const { error: erreurCopie } = await supabase.storage.from(BUCKET_MEDIAS).copy(String(photo.chemin), destination);
  if (erreurCopie) return echec("Copie de la photo", erreurCopie);
  return { ok: true, chemin: destination, alt: String(photo.alt_fr ?? "") };
}
