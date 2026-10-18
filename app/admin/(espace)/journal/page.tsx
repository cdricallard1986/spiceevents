import type { Metadata } from "next";
import { exigerAdmin } from "@/lib/admin/garde";
import { sectionDe } from "@/lib/admin/navigation";
import { BientotDisponible } from "@/components/admin/BientotDisponible";

export const metadata: Metadata = { title: "Journal" };

export default async function PageJournal() {
  await exigerAdmin();
  return <BientotDisponible section={sectionDe("/admin/journal")} />;
}
