"use client";

import { useState } from "react";
import { adresseLecteur } from "@/contenu/videos";

type Props = { id: string; titre: string; libelleLecture: string };

/**
 * Lecteur YouTube « à la demande » : d'abord l'image de la vidéo et un bouton
 * lecture (jamais un grand rectangle noir) ; le lecteur — mode confidentialité
 * renforcée — n'est chargé qu'au clic, et démarre aussitôt. Rien n'est chargé
 * depuis YouTube avant ce clic, sinon l'image d'aperçu (i.ytimg.com, sans cookie).
 */
export function LecteurYoutube({ id, titre, libelleLecture }: Props) {
  const [lance, setLance] = useState(false);
  const [image, setImage] = useState(`https://i.ytimg.com/vi/${id}/maxresdefault.jpg`);

  if (lance) {
    return (
      <iframe
        src={`${adresseLecteur(id)}?autoplay=1&rel=0`}
        title={titre}
        allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        className="absolute inset-0 h-full w-full"
      />
    );
  }
  return (
    <button type="button" onClick={() => setLance(true)} className="group absolute inset-0 block h-full w-full" aria-label={`${libelleLecture} : ${titre}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- image d'aperçu de YouTube, servie par YouTube */}
      <img
        src={image}
        alt=""
        loading="lazy"
        decoding="async"
        // Toutes les vidéos n'ont pas d'aperçu en haute définition : repli sur l'aperçu standard.
        onError={() => setImage(`https://i.ytimg.com/vi/${id}/hqdefault.jpg`)}
        className="absolute inset-0 h-full w-full object-cover opacity-85 transition-opacity duration-300 group-hover:opacity-100"
      />
      <span aria-hidden="true" className="absolute inset-0 bg-[radial-gradient(circle,transparent_35%,rgba(0,0,0,0.55))]" />
      <span
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 flex size-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center bg-or text-nuit transition-transform duration-300 group-hover:scale-105 md:size-24"
      >
        <svg viewBox="0 0 24 24" fill="currentColor" className="ml-1 size-8 md:size-10">
          <path d="M8 5.5v13l10.5-6.5z" />
        </svg>
      </span>
      <span className="texte-sur-photo absolute inset-x-0 bottom-0 p-4 text-left text-sm font-semibold uppercase tracking-[0.14em] text-ivoire md:p-6">
        {titre}
      </span>
    </button>
  );
}
