import { notFound } from "next/navigation";
import { exigerAdmin } from "@/lib/admin/garde";

// Adresse inconnue du back office : 404 dans le cadre admin (et jamais capturée par `[locale]`).
export default async function PageInconnueAdmin() {
  await exigerAdmin();
  notFound();
}
