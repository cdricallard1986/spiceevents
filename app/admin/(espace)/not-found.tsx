import Link from "next/link";

export default function IntrouvableAdmin() {
  return (
    <>
      <p className="surtitre mb-3">404</p>
      <h1 className="font-display text-4xl leading-tight md:text-5xl">Page introuvable</h1>
      <p className="mt-4 text-sable">Cette adresse n&apos;existe pas dans le back office.</p>
      <Link
        href="/admin"
        className="mt-8 inline-flex items-center gap-2 text-[0.8125rem] font-semibold uppercase tracking-[0.16em] text-or hover:text-or-clair"
      >
        ← Accueil du back office
      </Link>
    </>
  );
}
