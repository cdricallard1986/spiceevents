import type { Metadata } from "next";
import { exigerAdmin } from "@/lib/admin/garde";
import { sectionDe } from "@/lib/admin/navigation";
import { BientotDisponible } from "@/components/admin/BientotDisponible";

export const metadata: Metadata = { title: "Tests" };

export default async function PageTests() {
  await exigerAdmin();
  return <BientotDisponible section={sectionDe("/admin/tests")} />;
}
