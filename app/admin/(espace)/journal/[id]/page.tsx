import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { exigerAdmin } from "@/lib/admin/garde";
import { COLONNES_ARTICLE_ADMIN, type LigneArticleAdmin } from "@/lib/journal/admin";
import { schemaIdArticle } from "@/lib/journal/schema";
import { COLONNES_PHOTO, type Photo } from "@/lib/photos/types";
import { EditeurArticle } from "@/components/admin/EditeurArticle";
import { copierPhotoPhototheque, creerUrlEnvoiArticle, enregistrerArticle, publierArticle, retirerArticle, supprimerArticle } from "../actions";

export const metadata: Metadata = { title: "Article" };

type Props = { params: Promise<{ id: string }> };

/**
 * Éditeur d'un article (brouillon ou publié), en pleine page. La ligne existe
 * toujours (« Nouvel article » crée le brouillon avant d'ouvrir cette page).
 * La photothèque sert au choix de la couverture.
 */
export default async function PageArticle({ params }: Props) {
  const { supabase } = await exigerAdmin();
  const { id } = await params;
  const idValide = schemaIdArticle.safeParse(id);
  if (!idValide.success) notFound();

  const [article, photos] = await Promise.all([
    supabase.from("articles").select(COLONNES_ARTICLE_ADMIN).eq("id", idValide.data).maybeSingle(),
    supabase.from("photos").select(COLONNES_PHOTO).order("created_at", { ascending: false }).order("chemin", { ascending: true }),
  ]);
  if (article.error) {
    console.warn(`[admin] Journal — lecture de l'article : ${article.error.code ?? ""} ${article.error.message}`);
    return (
      <p role="alert" className="border-l-2 border-erreur bg-nuit-3 px-4 py-3 text-sm text-ivoire">
        L&apos;article n&apos;a pas pu être chargé (la base ne répond pas). Rechargez la page dans un instant.
      </p>
    );
  }
  if (!article.data) notFound();
  if (photos.error) console.warn(`[admin] Journal — lecture de la photothèque : ${photos.error.code ?? ""} ${photos.error.message}`);

  return (
    <EditeurArticle
      ligne={article.data as LigneArticleAdmin}
      photos={(photos.data ?? []) as Photo[]}
      actions={{
        enregistrer: enregistrerArticle,
        publier: publierArticle,
        retirer: retirerArticle,
        supprimer: supprimerArticle,
        creerUrlEnvoi: creerUrlEnvoiArticle,
        copierPhoto: copierPhotoPhototheque,
      }}
    />
  );
}
