import type { CleImage } from "@/lib/images";
import type { Bilingue, Etape, Seo } from "../types";
import { typographier } from "@/lib/typographie";

/** Une famille de matériel : marques et modèles du parc, avec une photo du vrai matériel. */
export type FamilleMateriel = { titre: string; texte: string; modeles: string[]; image: CleImage };

type SonEtLumiere = {
  seo: Seo;
  hero: { surtitre: string; titre: string; intro: string };
  promesse: { surtitre: string; titre: string; paragraphes: string[]; citation: string };
  materiel: { surtitre: string; titre: string; intro: string; familles: FamilleMateriel[]; note: string };
  preparation: { surtitre: string; titre: string; intro: string; etapes: Etape[] };
  securite: { surtitre: string; titre: string; intro: string; points: string[] };
  partenaire: { surtitre: string; titre: string; paragraphes: string[]; points: string[]; lien: string };
  video: { surtitre: string; titre: string; titreLecteur: string };
  liens: { titre: string; texte: string };
  faq: { surtitre: string; titre: string; lien: string };
  appel: { titre: string; texte: string };
};

/** Photos d'en-tête de la page (secours : la liste vit en base, `entete:son-et-lumiere`, gérée dans le back office). */
export const IMAGES_ENTETE_SON_LUMIERE: CleImage[] = ["son-lumiere-installation", "son-lumiere-regie-lets-dance"];

export const SON_ET_LUMIERE: Bilingue<SonEtLumiere> = typographier({
  fr: {
    seo: {
      titre: "Sonorisation et éclairage de mariage et d'événement : notre matériel | Spice Events",
      description:
        "L-Acoustics, Yamaha, Pioneer DJ, Shure : un matériel son et lumière professionnel, testé en atelier avant chaque date, avec secours sur place. Paris et Île-de-France.",
    },
    hero: {
      surtitre: "Son & lumière",
      titre: "Le piment, *sans les imprévus*.",
      intro:
        "Sonorisation, éclairage, régie DJ : un parc professionnel, testé en atelier avant chaque date, installé selon un protocole strict et doublé par du matériel de secours sur place.",
    },
    promesse: {
      surtitre: "Notre promesse",
      titre: "Une nuit qui brille, *une technique qui tient*.",
      paragraphes: [
        "Un mariage ou un événement réussi repose sur un équilibre : de l'émotion, et une technique qui ne se remarque jamais. Une coupure de son pendant les discours, une lumière qui s'éteint pendant l'ouverture du bal : ce sont des instants qui ne se rattrapent pas.",
        "C'est pourquoi chaque prestation est pensée comme une mise en scène technique, où chaque câble, chaque réglage et chaque faisceau a son importance — avec notre partenaire MX Événement, prestataire son et lumière.",
      ],
      citation: "Un matériel haut de gamme, une préparation minutieuse et une exécution sans faille : voilà notre promesse.",
    },
    materiel: {
      surtitre: "Le matériel",
      titre: "Les références *des professionnels du spectacle*.",
      intro:
        "Les mêmes marques que sur les scènes de concert et les grands événements, choisies pour leur fiabilité autant que pour leur son.",
      familles: [
        {
          titre: "Diffusion",
          texte: "Un son clair et homogène dans toute la salle, sans saturation, même sur de grandes surfaces.",
          modeles: [
            "L-Acoustics : line array Kara, enceintes X12 et ARCS Wide",
            "Contrôleurs amplifiés L-Acoustics LA12X, LA8 et LA4X",
            "Enceintes colonnes sur batterie LD Systems MAUI 5 GO",
          ],
          image: "materiel-l-acoustics",
        },
        {
          titre: "Régie DJ",
          texte: "Le standard des clubs et des festivals, pour des enchaînements précis et une soirée sans coupure.",
          modeles: ["Pioneer DJ CDJ-2000NXS2 et DJM-900NXS2", "Une régie blanche en édition limitée", "Lecteur et console de secours prêts à prendre le relais"],
          image: "materiel-pioneer-blanc",
        },
        {
          titre: "Régie son & micros",
          texte: "Discours, cérémonie, musiciens : chaque voix entendue, du premier au dernier rang.",
          modeles: ["Consoles numériques Yamaha QL5 et CL5", "Micros sans fil Shure", "Traitement numérique (DSP, égalisation multibande)"],
          image: "materiel-yamaha-ql5",
        },
        {
          titre: "Lumière",
          texte: "Une mise en lumière du lieu pour le dîner, des effets dynamiques synchronisés à la musique pour la piste.",
          modeles: ["Lyres et projecteurs Chauvet Pro", "Portman, Wolfmix", "Structures, gobos et mise en lumière d'architecture"],
          image: "son-lumiere-regie-bleue",
        },
      ],
      note: "Le matériel est adapté à chaque lieu et à chaque nombre d'invités : une cérémonie dans un jardin n'appelle pas la même installation qu'une soirée de 300 personnes.",
    },
    preparation: {
      surtitre: "Avant chaque date",
      titre: "Avant la nuit, *tout est calé*.",
      intro: "Le jour J ne commence pas à l'arrivée des invités : il se prépare à l'atelier, puis sur place, bien avant le premier morceau.",
      etapes: [
        {
          titre: "Contrôle en atelier",
          texte: "Chaque élément est vérifié et testé avant de partir : enceintes, consoles, micros, câbles, lumières.",
        },
        {
          titre: "Repérage du lieu",
          texte: "Configuration, distances, alimentation électrique, contraintes du lieu : l'installation est pensée en amont.",
        },
        {
          titre: "Installation & calage",
          texte: "Son et lumière réglés pour la salle, câblages sécurisés, tests complets avant l'arrivée des invités.",
        },
        {
          titre: "Redondances vérifiées",
          texte: "Systèmes de secours, sauvegarde audio, lecteur et console de secours : tout ce qui peut prendre le relais est prêt.",
        },
        {
          titre: "Supervision",
          texte: "Pendant toute la prestation, le son et la lumière sont surveillés et ajustés, discrètement.",
        },
        {
          titre: "Démontage",
          texte: "Le matériel est démonté et rechargé à l'heure convenue avec le lieu.",
        },
      ],
    },
    securite: {
      surtitre: "Sécurité",
      titre: "La sécurité n'est pas un détail, *c'est notre priorité*.",
      intro: "Parce qu'un moment d'émotion ne doit jamais dépendre d'un imprévu technique.",
      points: [
        "Des équipements aux normes CE, contrôlés avant chaque utilisation.",
        "Une installation selon un protocole strict : isolation, câblage, protections, tests de charge.",
        "Des réseaux électriques et des câblages sécurisés, testés et doublés.",
        "Des solutions de secours prêtes à prendre le relais : alimentation, lecteur, console.",
        "La prévention des risques électriques et incendie, dans le respect du règlement de chaque lieu.",
        "Une coordination avec le photographe, le vidéaste et le traiteur pour éviter toute interférence.",
      ],
    },
    partenaire: {
      surtitre: "Notre partenaire technique",
      titre: "MX Événement, *la précision technique*.",
      paragraphes: [
        "Le son et la lumière de nos prestations sont fournis par MX Événement, prestataire son, lumière et structure, dont Cédric est associé. Son équipe, forte de plus de 10 ans d'expérience, partage notre règle : aucune place à l'improvisation.",
        "Ce partenariat nous donne accès à un parc de matériel professionnel entretenu en atelier, et à une logistique rodée aux mariages comme aux grands événements.",
      ],
      points: [
        "Un matériel haut de gamme, entretenu et testé en atelier avant chaque sortie",
        "Une logistique rigoureuse, pour une installation fluide et sécurisée",
        "Une supervision technique continue pendant la prestation",
        "Du matériel de secours disponible immédiatement sur place",
      ],
      lien: "Découvrir MX Événement",
    },
    video: {
      surtitre: "En images",
      titre: "MX Événement, *en coulisses*.",
      titreLecteur: "Vidéo de présentation de MX Événement",
    },
    liens: {
      titre: "Des solutions pour *chaque moment*",
      texte: "La cérémonie en plein air, le cocktail loin de la piste, l'ouverture de bal : découvrez les installations qui s'y prêtent.",
    },
    faq: { surtitre: "Questions fréquentes", titre: "La technique, *en pratique*.", lien: "Toutes les questions" },
    appel: {
      titre: "Parlons de *votre événement*.",
      texte: "Votre date, le nombre d'invités et le déroulé : nous vous proposons une installation adaptée, testée et sécurisée.",
    },
  },
  en: {
    seo: {
      titre: "Wedding and event sound and lighting: our equipment | Spice Events",
      description:
        "L-Acoustics, Yamaha, Pioneer DJ, Shure: professional sound and lighting, tested in the workshop before every date, with backup on site. Paris and Île-de-France.",
    },
    hero: {
      surtitre: "Sound & lighting",
      titre: "All the spice, *none of the glitches*.",
      intro:
        "Sound, lighting, DJ booth: professional equipment, tested in the workshop before every date, installed to a strict protocol and backed up by spare equipment on site.",
    },
    promesse: {
      surtitre: "Our promise",
      titre: "A night that shines, *technology that holds*.",
      paragraphes: [
        "A successful wedding or event rests on a balance: emotion, and technology nobody ever notices. Sound cutting out during the speeches, lights failing during the first dance: those are moments you never get back.",
        "That's why every booking is designed as a technical production, where every cable, every setting and every beam of light matters — with our partner MX Événement, a sound and lighting company.",
      ],
      citation: "Premium equipment, meticulous preparation and flawless execution: that is our promise.",
    },
    materiel: {
      surtitre: "The equipment",
      titre: "The brands *live-show professionals trust*.",
      intro: "The same brands you find on concert stages and at major events, chosen for their reliability as much as their sound.",
      familles: [
        {
          titre: "Sound system",
          texte: "Clear, even sound across the whole room, with no distortion, even in large spaces.",
          modeles: [
            "L-Acoustics: Kara line array, X12 and ARCS Wide speakers",
            "L-Acoustics LA12X, LA8 and LA4X amplified controllers",
            "LD Systems MAUI 5 GO battery-powered column speakers",
          ],
          image: "materiel-l-acoustics",
        },
        {
          titre: "DJ booth",
          texte: "The club and festival standard, for precise transitions and a night without interruption.",
          modeles: ["Pioneer DJ CDJ-2000NXS2 and DJM-900NXS2", "A limited-edition white setup", "Backup player and console ready to take over"],
          image: "materiel-pioneer-blanc",
        },
        {
          titre: "Mixing desk & microphones",
          texte: "Speeches, ceremony, musicians: every voice heard, from the front row to the back.",
          modeles: ["Yamaha QL5 and CL5 digital consoles", "Shure wireless microphones", "Digital processing (DSP, multiband EQ)"],
          image: "materiel-yamaha-ql5",
        },
        {
          titre: "Lighting",
          texte: "Architectural lighting for dinner, dynamic effects synchronised to the music for the dance floor.",
          modeles: ["Chauvet Pro moving heads and fixtures", "Portman, Wolfmix", "Trusses, gobos and architectural lighting"],
          image: "son-lumiere-regie-bleue",
        },
      ],
      note: "The equipment is matched to each venue and guest count: a garden ceremony doesn't call for the same setup as a party for 300.",
    },
    preparation: {
      surtitre: "Before every date",
      titre: "Before the night, *everything is set*.",
      intro: "The big day doesn't start when the guests arrive: it is prepared in the workshop, then on site, long before the first song.",
      etapes: [
        { titre: "Workshop check", texte: "Every item is checked and tested before it leaves: speakers, consoles, microphones, cables, lights." },
        { titre: "Venue survey", texte: "Layout, distances, power supply, venue rules: the setup is planned in advance." },
        { titre: "Setup & tuning", texte: "Sound and light tuned to the room, cabling secured, full tests before the guests arrive." },
        { titre: "Backups checked", texte: "Backup systems, audio backup, a spare player and console: everything that can take over is ready." },
        { titre: "Supervision", texte: "Throughout the event, sound and lighting are monitored and adjusted, discreetly." },
        { titre: "Breakdown", texte: "The equipment is taken down and loaded out at the time agreed with the venue." },
      ],
    },
    securite: {
      surtitre: "Safety",
      titre: "Safety isn't a detail, *it's our priority*.",
      intro: "Because a moment of emotion should never depend on a technical hitch.",
      points: [
        "CE-compliant equipment, checked before every use.",
        "Installation to a strict protocol: insulation, cabling, protection, load tests.",
        "Secured, tested and duplicated power networks and cabling.",
        "Backup solutions ready to take over: power, player, console.",
        "Electrical and fire risk prevention, in line with each venue's rules.",
        "Coordination with the photographer, videographer and caterer to avoid any interference.",
      ],
    },
    partenaire: {
      surtitre: "Our technical partner",
      titre: "MX Événement, *technical precision*.",
      paragraphes: [
        "The sound and lighting for our events are supplied by MX Événement, a sound, lighting and staging company in which Cédric is a partner. Its team, with more than 10 years of experience, shares our rule: no room for improvisation.",
        "This partnership gives us access to professional equipment maintained in the workshop, and to logistics well practised at weddings and large events alike.",
      ],
      points: [
        "Premium equipment, maintained and tested in the workshop before every outing",
        "Rigorous logistics, for a smooth and safe setup",
        "Continuous technical supervision throughout the event",
        "Backup equipment available immediately on site",
      ],
      lien: "Discover MX Événement",
    },
    video: {
      surtitre: "On video",
      titre: "MX Événement, *behind the scenes*.",
      titreLecteur: "MX Événement presentation video",
    },
    liens: {
      titre: "Solutions for *every moment*",
      texte: "An outdoor ceremony, drinks far from the dance floor, the first dance: discover the setups designed for them.",
    },
    faq: { surtitre: "Frequently asked questions", titre: "Technology, *in practice*.", lien: "All questions" },
    appel: {
      titre: "Tell us about *your event*.",
      texte: "Your date, the guest count and the schedule: we'll suggest a setup that is tailored, tested and safe.",
    },
  },
});
