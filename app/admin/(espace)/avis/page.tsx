import type { Metadata } from "next";
import { exigerAdmin } from "@/lib/admin/garde";
import { sectionDe } from "@/lib/admin/navigation";
import { BientotDisponible } from "@/components/admin/BientotDisponible";

export const metadata: Metadata = { title: "Avis" };

export default async function PageAvis() {
  await exigerAdmin();
  return <BientotDisponible section={sectionDe("/admin/avis")} />;
}
