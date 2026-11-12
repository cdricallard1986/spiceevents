import type { Locale } from "@/i18n/routing";
import type { Option } from "@/contenu/options";
import { Link } from "@/i18n/navigation";
import { Photo } from "@/components/ui/Photo";

/** Vignette d'une animation, vers sa page. */
export function CarteOption({ option, locale }: { option: Option; locale: Locale }) {
  return (
    <Link
      href={{ pathname: "/animations/[option]", params: { option: option.slug[locale] } }}
      className="group flex h-full flex-col gap-4 border border-ligne p-3 pb-5 transition-colors hover:border-or"
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <Photo
          cle={option.image}
          remplir
          sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
          className="transition-transform duration-700 group-hover:scale-105"
        />
      </div>
      <h3 className="px-2 font-display text-2xl group-hover:text-or">
        {option.titre[locale]} <span aria-hidden="true" className="inline-block transition-transform group-hover:translate-x-1">→</span>
      </h3>
      <p className="px-2 text-[0.9375rem] text-sable">{option.resume[locale]}</p>
    </Link>
  );
}
