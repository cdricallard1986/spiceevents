import type { Bilingue, Etape, Seo } from "../types";

type Citation = { texte: string };
type BlocTechnique = { titre: string; points: string[] };

type APropos = {
  seo: Seo;
  hero: { surtitre: string; titre: string; intro: string };
  parcours: { surtitre: string; titre: string; paragraphes: string[] };
  /** Grande citation sur photo, entre le parcours et la suite. */
  citationPhare: Citation;
  aujourdhui: { surtitre: string; titre: string; paragraphes: string[]; citations: Citation[] };
  valeurs: { surtitre: string; titre: string; intro: string; liste: Etape[] };
  technique: {
    surtitre: string;
    titre: string;
    intro: string;
    blocs: BlocTechnique[];
    partenariat: { titre: string; texte: string; points: string[]; lien: string };
    citation: string;
  };
  video: { surtitre: string; titre: string; intro: string; titreLecteur: string };
};

export const A_PROPOS: Bilingue<APropos> = {
  fr: {
    seo: {
      titre: "Cédric Allard, DJ mariage et fondateur de Spice Events — Île-de-France",
      description:
        "Le parcours de Cédric Allard, fondateur de Spice Events, nos valeurs et notre exigence technique avec MX Événement : son, lumière et matériel de secours, à Paris et en Île-de-France.",
    },
    hero: {
      surtitre: "À propos · Cédric Allard",
      titre: "Une passion devenue *une signature*.",
      intro:
        "Fondateur de Spice Events et associé de MX Événement, Cédric accompagne les mariés et leurs invités depuis plus de 20 ans, de la première idée au dernier morceau.",
    },
    parcours: {
      surtitre: "Le parcours",
      titre: "De l'école de cinéma *aux pistes de danse*.",
      paragraphes: [
        "Cédric crée Spice Events très tôt, pour facturer ses premiers clients. Il est alors étudiant en cinéma, option son, et possède déjà une solide expérience de l'animation de soirées. Très vite, il veut professionnaliser ses prestations et les adapter aux mariages et aux événements : une expérience qui allie technique, ambiance et émotion.",
        "Les débuts demandent patience et discipline : il réinvestit longtemps dans le matériel et la qualité plutôt que dans sa propre rémunération, et assume seul chaque décision. Les conseils d'autres professionnels et des rencontres décisives, comme celle de Maxime Gaudefroy, aujourd'hui son associé chez MX Événement, l'aident à structurer l'entreprise.",
        "Le nom « Spice » dit cette ambition : pimenter les événements, les rendre uniques, et garder une certaine polyvalence. Cédric imaginait d'abord plusieurs déclinaisons — Spice Records, Spice Weddings, Spice the Night. C'est finalement Spice Events qui est devenu sa référence pour les mariages et les événements.",
      ],
    },
    citationPhare: {
      texte:
        "La réussite, ce n'est pas juste avoir du matériel ou une bonne technique, c'est savoir écouter, anticiper et accompagner chaque mariage ou événement de A à Z.",
    },
    aujourdhui: {
      surtitre: "Aujourd'hui",
      titre: "Moins de dates, *plus d'attention*.",
      paragraphes: [
        "Au sein de MX Événement, chaque associé a son domaine : Tristan l'administration et la comptabilité, Maxime la logistique et la production, Marc le suivi technique et la maintenance du matériel, Cédric la communication et le commercial. Les décisions se prennent ensemble.",
        "Cédric a recentré Spice Events sur l'accompagnement humain et personnalisé. Avec une alternante, il se consacre aux mariages et aux événements qu'il choisit avec soin, pour garantir un suivi à 100 % : conseils musicaux, coordination avec vos prestataires, mise en scène des moments forts.",
        "Pour lui, réussir un mariage, c'est comprendre les envies de chacun et traduire votre vision en réalité — du choix du matériel aux animations, en passant par la lumière et le déroulé de la journée.",
      ],
      citations: [
        {
          texte:
            "J'ai toujours voulu être mon propre patron, construire mon travail et décider moi-même de la manière dont je développe mon entreprise.",
        },
        {
          texte:
            "Toutes les décisions sont à ma charge et leurs conséquences se font sentir sur le long terme. Mais chaque obstacle est une leçon pour mieux structurer mon entreprise.",
        },
      ],
    },
    valeurs: {
      surtitre: "Nos valeurs",
      titre: "Ce qui guide *chaque projet*.",
      intro:
        "Derrière chaque événement, il y a des personnes, des émotions et des histoires à mettre en lumière. Nos valeurs nous accompagnent de la préparation à la dernière note.",
      liste: [
        {
          titre: "L'humain avant tout",
          texte: "Nous plaçons les personnes au centre de tout ce que nous faisons, avec bienveillance et écoute.",
        },
        {
          titre: "Professionnalisme",
          texte: "Rigueur, fiabilité et précision à chaque étape : la clé d'un résultat maîtrisé, sans imprévu.",
        },
        {
          titre: "Adaptation",
          texte: "Chaque lieu, chaque public, chaque ambiance est différent. Nous nous adaptons pour que tout coule naturellement.",
        },
        {
          titre: "Partage",
          texte: "Un événement réussi, c'est une belle collaboration et une vraie connexion entre les gens.",
        },
        {
          titre: "Émotion",
          texte: "Nous créons des moments vivants et sincères, des expériences qui marquent et qui rassemblent.",
        },
      ],
    },
    technique: {
      surtitre: "Son & lumière",
      titre: "Une technique *qui ne se remarque pas*.",
      intro:
        "Un moment d'émotion ne doit jamais dépendre d'un imprévu technique. Chaque installation est pensée comme une mise en scène : calibrée pour le lieu, testée, doublée.",
      blocs: [
        {
          titre: "Un matériel professionnel",
          points: [
            "Des marques reconnues : Pioneer DJ, Shure, Chauvet Pro, Portman, Wolfmix…",
            "Une diffusion modulaire, pour un son homogène même sur de grandes surfaces.",
            "Un traitement numérique (DSP, égalisation multibande) pour un rendu clair, sans saturation.",
            "Des jeux de lumière synchronisés à la musique.",
          ],
        },
        {
          titre: "Avant chaque date",
          points: [
            "Un contrôle complet du matériel.",
            "Des tests son et lumière, adaptés à la configuration du lieu.",
            "La vérification des redondances : systèmes de secours et sauvegarde audio.",
            "Des réseaux électriques et câblages sécurisés, testés et doublés.",
          ],
        },
        {
          titre: "La sécurité des interventions",
          points: [
            "Des équipements aux normes CE, contrôlés avant chaque utilisation.",
            "Une installation selon un protocole strict : isolation, câblage, protections, tests de charge.",
            "Des solutions de secours prêtes à prendre le relais : alimentation, lecteur, console.",
            "La prévention des risques électriques et incendie, dans le respect du règlement de chaque lieu.",
            "Une communication fluide avec le photographe, le vidéaste ou le traiteur pour éviter toute interférence.",
          ],
        },
      ],
      partenariat: {
        titre: "Le partenariat MX Événement",
        texte:
          "Notre partenaire technique partage la même règle : aucune place à l'improvisation. Son équipe, forte de plus de 10 ans d'expérience, prépare et installe des solutions sur mesure. Pour chaque événement :",
        points: [
          "un matériel haut de gamme, entretenu et testé en atelier avant chaque sortie ;",
          "une logistique rigoureuse, pour une installation fluide et sécurisée ;",
          "une supervision technique continue pendant la prestation ;",
          "du matériel de secours disponible immédiatement sur place.",
        ],
        lien: "Découvrir MX Événement",
      },
      citation: "Parce qu'un moment d'émotion ne doit jamais dépendre d'un imprévu technique.",
    },
    video: {
      surtitre: "En images",
      titre: "Un mix pensé *pour toutes les générations*.",
      intro: "Un aperçu de l'ambiance que nous construisons avec vous, pour faire danser petits et grands.",
      titreLecteur: "Vidéo Spice Events : un mix intergénérationnel",
    },
  },
  en: {
    seo: {
      titre: "Cédric Allard, wedding DJ and founder of Spice Events — Paris area",
      description:
        "Meet Cédric Allard, founder of Spice Events: his story, our values and our technical standards with MX Événement — sound, lighting and backup equipment in Paris and Île-de-France.",
    },
    hero: {
      surtitre: "About · Cédric Allard",
      titre: "A passion that became *a signature*.",
      intro:
        "Founder of Spice Events and partner at MX Événement, Cédric has been looking after couples and their guests for over 20 years, from the first idea to the very last song.",
    },
    parcours: {
      surtitre: "The story",
      titre: "From film school *to the dance floor*.",
      paragraphes: [
        "Cédric set up Spice Events early on, so that he could invoice his first clients. He was studying film at the time, specialising in sound, and already had solid experience of DJing parties. He soon wanted to take things further and tailor his work to weddings and events: an experience that brings together technique, atmosphere and emotion.",
        "The early days took patience and discipline. For a long time he put money back into equipment and quality rather than paying himself, and every decision rested on his shoulders alone. Advice from other professionals and a few key encounters — notably Maxime Gaudefroy, now his business partner at MX Événement — helped him build a more structured company.",
        "The name “Spice” reflects that ambition: to add flavour to events, make them unique and stay versatile. Cédric first pictured several spin-offs — Spice Records, Spice Weddings, Spice the Night. In the end, Spice Events became his name of reference for weddings and events.",
      ],
    },
    citationPhare: {
      texte:
        "Success isn't just about having the gear or good technique. It's about listening, anticipating and supporting every wedding or event from start to finish.",
    },
    aujourdhui: {
      surtitre: "Today",
      titre: "Fewer dates, *more attention*.",
      paragraphes: [
        "At MX Événement, each partner owns an area: Tristan handles administration and accounts, Maxime logistics and production, Marc technical support and equipment maintenance, and Cédric marketing and sales. Decisions are made together.",
        "Cédric has refocused Spice Events on personal, hands-on support. Working with an apprentice, he devotes his time to weddings and events he selects carefully, so that each one gets his full attention: music advice, coordination with your suppliers, staging of the key moments.",
        "For him, a successful wedding means understanding what everyone wants and turning your vision into reality — from the choice of equipment to the entertainment, the lighting and the running order of the day.",
      ],
      citations: [
        {
          texte:
            "I always wanted to be my own boss, to shape my own work and decide for myself how my business grows.",
        },
        {
          texte:
            "Every decision is mine to make, and the consequences are felt over the long term. But each obstacle is a lesson in building a better-structured business.",
        },
      ],
    },
    valeurs: {
      surtitre: "Our values",
      titre: "What guides *every project*.",
      intro:
        "Behind every event there are people, emotions and stories to bring to light. Our values stay with us from the first planning session to the final note.",
      liste: [
        {
          titre: "People first",
          texte: "We put people at the heart of everything we do, with kindness and a listening ear.",
        },
        {
          titre: "Professionalism",
          texte: "Rigour, reliability and precision at every step: the key to a controlled result with no surprises.",
        },
        {
          titre: "Adaptability",
          texte: "Every venue, crowd and atmosphere is different. We adapt so that everything flows naturally.",
        },
        {
          titre: "Sharing",
          texte: "A great event is a genuine collaboration and a real connection between people.",
        },
        {
          titre: "Emotion",
          texte: "We create lively, heartfelt moments — experiences that leave a mark and bring people together.",
        },
      ],
    },
    technique: {
      surtitre: "Sound & lighting",
      titre: "Technology *you don't notice*.",
      intro:
        "A moment of emotion should never hinge on a technical hitch. Every set-up is staged with care: calibrated for the venue, tested and backed up.",
      blocs: [
        {
          titre: "Professional equipment",
          points: [
            "Trusted brands: Pioneer DJ, Shure, Chauvet Pro, Portman, Wolfmix…",
            "Modular sound systems for even coverage, even in large spaces.",
            "Digital processing (DSP, multi-band EQ) for a clear sound with no distortion.",
            "Lighting effects synchronised with the music.",
          ],
        },
        {
          titre: "Before every date",
          points: [
            "A full equipment check.",
            "Sound and lighting tests, adapted to the layout of the venue.",
            "Redundancy checks: backup systems and audio back-up.",
            "Secure power and cabling, tested and duplicated.",
          ],
        },
        {
          titre: "Safety on site",
          points: [
            "CE-certified equipment, checked before every use.",
            "Installation to a strict protocol: insulation, cabling, protection, load tests.",
            "Backup solutions ready to take over: power, player, mixing desk.",
            "Electrical and fire risk prevention, in line with each venue's rules.",
            "Smooth communication with the photographer, videographer or caterer to avoid any interference.",
          ],
        },
      ],
      partenariat: {
        titre: "Our partnership with MX Événement",
        texte:
          "Our technical partner shares the same rule: no room for improvisation. With more than 10 years of experience, their team prepares and installs tailored solutions. For every event:",
        points: [
          "premium equipment, maintained and tested in the workshop before every job;",
          "rigorous logistics for a smooth, safe installation;",
          "continuous technical supervision throughout the event;",
          "backup equipment available on site straight away.",
        ],
        lien: "Discover MX Événement",
      },
      citation: "Because a moment of emotion should never depend on a technical hitch.",
    },
    video: {
      surtitre: "On film",
      titre: "A mix designed *for every generation*.",
      intro: "A glimpse of the atmosphere we build with you, to get young and old alike on the dance floor.",
      titreLecteur: "Spice Events video: a mix for every generation",
    },
  },
};
