export const dynamic = "force-dynamic";

/** Empreinte du build en ligne, comparée par la pill « Nouvelle version disponible ». */
export function GET() {
  return Response.json(
    { empreinte: process.env.NEXT_PUBLIC_EMPREINTE_BUILD ?? "" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
