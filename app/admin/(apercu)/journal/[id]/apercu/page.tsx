import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { exigerAdmin } from "@/lib/admin/garde";
import { COLONNES_ARTICLE_ADMIN, type LigneArticleAdmin } from "@/lib/journal/admin";
import { schemaIdArticle } from "@/lib/journal/schema";
import { ApercuArticle } from "@/components/admin/ApercuArticle";

export const metadata: Metadata = {
  title: "Aperçu de l'article",
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

type Props = { params: Promise<{ id: string }> };

/**
 * Aperçu d'un article, brouillon compris, avec le rendu de la page publique
 * (en-tête, corps sous `prose-nuit`, styles du site) — sans le cadre du back
 * office. Réservé à l'administrateur (garde + middleware), jamais indexé.
 */
export default async function PageApercu({ params }: Props) {
  const { supabase } = await exigerAdmin();
  const { id } = await params;
  const idValide = schemaIdArticle.safeParse(id);
  if (!idValide.success) notFound();
  // Les liens du site (`Link` de next-intl) : adresses françaises.
  setRequestLocale("fr");

  const { data, error } = await supabase.from("articles").select(COLONNES_ARTICLE_ADMIN).eq("id", idValide.data).maybeSingle();
  if (error) console.warn(`[admin] Journal — aperçu : ${error.code ?? ""} ${error.message}`);
  if (!error && !data) notFound();
  return <ApercuArticle ligne={data as LigneArticleAdmin | null} erreurLecture={Boolean(error)} />;
}
