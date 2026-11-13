import type { CleImage } from "@/lib/images";
import type { Bilingue, Carte, Etape, QuestionReponse, Seo } from "../types";

/** Un moment de la journée, avec les options qui s'y rattachent (slugs français de `contenu/options.ts`). */
export type Moment = { titre: string; texte: string; accroche: string; image: CleImage; options: string[] };

/** Photos d'en-tête de la page, une tirée au hasard à chaque visite : l'ambiance de la soirée (piste, lumières, son), grandes et paysage. */
export const IMAGES_ACCUEIL_MARIAGES: CleImage[] = [
  "presta-mariage-hero",
  "maison-mariage-danse-genou",
  "contact-maries-lumiere",
  "hero-premiere-danse",
  "presta-bal-fumee-bleue",
  "mariage-accueil-fumee",
  "presta-bal-etincelles-salle",
  "piste-invites",
  "maison-evenement-scene-dj",
  "presta-soiree-privee",
  "presta-piste-laser",
  "maison-mariage-diner-violet",
  "maison-mariage-lasers",
  "mariage-soiree-fumee-rouge",
  "mariage-soiree-scene-dj",
  "mariage-soiree-regie",
  "mariage-soiree-piste-rose",
  "mariage-soiree-cabine",
  "mariage-soiree-chapiteau-bleu",
  "mariage-soiree-faisceaux",
  "mariage-soiree-bras-ouverts",
  "mariage-soiree-bras-leves",
  "mariage-premiere-danse-bleue",
];

/** Engagement de la promesse, avec un lien éventuel vers la page qui le détaille. */
export type Garantie = Carte & { lien?: { href: "/animations" | "/son-et-lumiere"; texte: string } };

type Mariages = {
  seo: Seo;
  hero: { surtitre: string; titre: string; intro: string; ctaPrincipal: string; ctaSecondaire: string };
  promesse: { surtitre: string; titre: string; paragraphes: string[]; garanties: Garantie[] };
  journee: { surtitre: string; titre: string; intro: string; moments: Moment[] };
  methode: { surtitre: string; titre: string; intro: string; etapes: Etape[] };
  nuvio: {
    surtitre: string;
    titre: string;
    texte: string;
    points: string[];
    lien: string;
    /** Aperçu illustratif de l'espace Nuvio (maquette Nocturne). */
    apercu: { surtitre: string; titre: string; texte: string; avancement: string; note: string };
  };
  dj: {
    surtitre: string;
    titre: string;
    citation: string;
    paragraphes: string[];
    differences: Etape[];
    lien: string;
    /** Au-dessus du mix vidéo de Cédric (DJ Dioz). */
    mix: string;
    /** Lien vers la page « Nos DJ ». */
    equipe: string;
  };
  video: { surtitre: string; titre: string; intro: string };
  photos: { surtitre: string; titre: string; lien: string };
  avis: { lien: string };
  faq: { surtitre: string; titre: string; questions: QuestionReponse[]; lien: string };
  appel: { titre: string; texte: string; bouton: string };
};

export const MARIAGES: Bilingue<Mariages> = {
  fr: {
    seo: {
      titre: "DJ mariage Paris & Île-de-France : musique, son, lumière | Spice Events",
      description:
        "DJ de mariage primé aux Wedding Awards Mariages.net : préparation sur mesure, de la cérémonie laïque à la soirée, sonorisation et éclairage haut de gamme. Paris et Île-de-France.",
    },
    hero: {
      surtitre: "Mariages · Paris & Île-de-France",
      titre: "Un grand oui. *Une nuit pimentée.*",
      intro:
        "Un mariage ne se vit qu'une fois. Nous préparons avec vous la musique, la lumière et le rythme de chaque moment, pour que vous n'ayez qu'une chose à faire : en profiter.",
      ctaPrincipal: "Vérifier ma date",
      ctaSecondaire: "Notre méthode",
    },
    promesse: {
      surtitre: "Notre promesse",
      titre: "Vous profitez, *nous pimentons*.",
      paragraphes: [
        "Notre mission : faire de votre grand jour un moment inoubliable et à votre image, avec un service professionnel, moderne et authentique.",
        "Tout est pensé pour que vous viviez votre soirée en toute sérénité : chaque détail est préparé en amont, et maîtrisé le jour J.",
      ],
      garanties: [
        {
          titre: "Un DJ expérimenté",
          texte: "Rigoureux, à l'écoute, capable de s'adapter à toutes les ambiances et à tous vos invités.",
        },
        {
          titre: "Une sonorisation haut de gamme",
          texte: "Adaptée à votre lieu, fournie par notre partenaire MX Événement et testée avant chaque date.",
          lien: { href: "/son-et-lumiere", texte: "Notre matériel" },
        },
        {
          titre: "Une mise en lumière sur mesure",
          texte: "Éclairages décoratifs pour sublimer le lieu, lumières dynamiques pour la piste.",
        },
        {
          titre: "Des animations soignées",
          texte: "Créatives et originales, choisies pour servir votre journée, sans jamais l'encombrer.",
          lien: { href: "/animations", texte: "Voir les animations" },
        },
      ],
    },
    journee: {
      surtitre: "Du premier oui au dernier rappel",
      titre: "Chaque instant. *Sa touche de Spice.*",
      intro: "Une cérémonie tout en douceur, un cocktail qui pétille, une piste qui s'anime : nous dosons la musique et la lumière au fil de votre journée.",
      moments: [
        {
          titre: "La cérémonie",
          accroche: "Les mots. Les frissons.",
          texte:
            "Micros pour l'officiant et vos proches, entrée des mariés, musiques lancées à la seconde près : une sonorisation douce et claire, entendue du premier au dernier rang, même en plein air.",
          image: "presta-ceremonie-cour",
          options: ["sonorisation-ceremonie-laique", "feux-d-artifice-de-jour"],
        },
        {
          titre: "Le cocktail",
          accroche: "Les retrouvailles en musique.",
          texte:
            "Une ambiance musicale qui accompagne les retrouvailles sans couvrir les conversations, même loin de la salle de soirée. Vos invités choisissent un disque, laissent un message vocal ou posent devant la borne photo.",
          image: "presta-vinyles-installation",
          options: ["sonorisation-deportee", "bar-a-vinyles", "livre-d-or-audio", "photobooth"],
        },
        {
          titre: "Le dîner",
          accroche: "Une lumière qui rassemble.",
          texte:
            "Une lumière chaude qui sublime la salle, une musique d'ambiance choisie avec vous, et vos temps forts intégrés au déroulé : discours, projections, surprises des témoins.",
          image: "presta-diner-chateau",
          options: ["guirlandes-lumineuses"],
        },
        {
          titre: "L'ouverture de bal",
          accroche: "Votre bulle, au milieu de tous.",
          texte:
            "Votre chanson, mise en scène : lumière dédiée, et si votre lieu le permet, fumée lourde et étincelles froides synchronisées avec la musique.",
          image: "presta-bal-etincelles-fumee",
          options: ["ouverture-de-bal"],
        },
        {
          titre: "La nuit",
          accroche: "Encore un dernier morceau.",
          texte:
            "Un mix qui fait danser toutes les générations et une piste qui ne désemplit pas, jusqu'à 4 h du matin — et plus tard avec des heures supplémentaires, si votre lieu le permet.",
          image: "presta-piste-mains-levees",
          options: [],
        },
      ],
    },
    methode: {
      surtitre: "Notre méthode",
      titre: "Six étapes, *zéro fausse note*.",
      intro:
        "Du premier échange au dernier morceau, un accompagnement personnalisé : nous prenons le temps de comprendre votre vision, vos goûts et les émotions que vous voulez transmettre.",
      etapes: [
        {
          titre: "Premier échange",
          texte: "Un rendez-vous ou une visio pour cerner vos attentes, l'ambiance idéale et les besoins techniques de votre lieu.",
        },
        {
          titre: "Devis & validation",
          texte: "Une proposition claire, sur mesure, adaptée à votre budget. Devis signé et acompte de 50 % : votre date est bloquée.",
        },
        {
          titre: "Planification",
          texte: "Questionnaire musical, moments forts, playlists : nous construisons ensemble le déroulé, au fil d'échanges réguliers.",
        },
        {
          titre: "Coordination",
          texte: "Nous contactons vos prestataires — lieu, traiteur, officiant… — pour anticiper horaires, accès et besoins techniques.",
        },
        {
          titre: "Installation & tests",
          texte: "Son et lumière installés et testés à l'avance, chaque réglage adapté à la configuration du lieu.",
        },
        {
          titre: "Le jour J",
          texte: "Nous sommes là du début à la fin : musique, transitions et lumière orchestrées avec discrétion.",
        },
      ],
    },
    nuvio: {
      surtitre: "L'esprit léger, avant aussi",
      titre: "Une belle fête *se prépare ensemble*.",
      texte:
        "Après la signature, vous préparez votre mariage sur Nuvio, la plateforme que nous avons conçue : vous, notre équipe et votre DJ voyez la même version, à jour à la seconde. Fini les informations éparpillées dans vingt emails.",
      points: ["Déroulé heure par heure", "Vos musiques, moment par moment", "Devis signé en ligne", "Messagerie avec l'équipe"],
      lien: "Découvrir Nuvio",
      apercu: {
        surtitre: "Votre espace mariage",
        titre: "Le grand jour se dessine.",
        texte: "Toutes les petites choses qui font votre journée.",
        avancement: "Avancement",
        note: "Aperçu illustratif de votre espace de préparation",
      },
    },
    dj: {
      surtitre: "Votre DJ",
      titre: "Un DJ qui vit la nuit *avec vous*.",
      citation: "Un bon DJ ne se cache pas derrière son ordinateur : il vit la soirée avec vous.",
      paragraphes: [
        "DJ depuis plus de 20 ans, Cédric Allard a fait de sa passion un métier : plus de 600 mariages, soirées et événements professionnels à travers la France. Ce qu'il recherche avant tout, c'est le plaisir du partage — cette énergie unique qui naît quand la musique rassemble les gens.",
        "Selon votre date, Cédric mixe lui-même ou vous présente un DJ de l'équipe, préparé avec la même méthode et la même exigence.",
      ],
      differences: [
        {
          titre: "Il lit la piste",
          texte: "Attentif à ce qui se passe sur la piste, il passe le bon morceau au bon moment, plutôt qu'une playlist figée.",
        },
        {
          titre: "Toutes les générations",
          texte: "Vos goûts d'abord, puis un mix qui fait danser les grands-parents comme vos amis.",
        },
        {
          titre: "Un micro dosé",
          texte: "Quelques mots pour faire vivre les temps forts, sans chanter ni monopoliser l'attention — ou pas de micro du tout, si vous préférez.",
        },
      ],
      lien: "En savoir plus sur Cédric",
      mix: "Écoutez Cédric aux platines (DJ Dioz) : un mix pour toutes les générations.",
      equipe: "Rencontrer les DJ de l'équipe",
    },
    video: {
      surtitre: "En images",
      titre: "Vos nuits, *en mouvement*.",
      intro: "Quelques minutes au cœur de nos mariages : l'émotion de la première danse, et une piste pleine jusqu'au bout de la nuit.",
    },
    photos: { surtitre: "En images", titre: "Des nuits *qui ont du goût*.", lien: "Voir la galerie" },
    avis: {
      lien: "Voir tous les avis",
    },
    faq: {
      surtitre: "Questions fréquentes",
      titre: "Vos questions, *nos réponses*.",
      questions: [
        {
          question: "Comment choisissez-vous la musique de notre mariage ?",
          reponse:
            "Tout part de vous : un questionnaire musical et des rendez-vous de préparation nous permettent de connaître vos styles, vos morceaux préférés et vos consignes. Nous construisons ensuite une programmation à votre image, qui plaît aussi à vos invités.",
        },
        {
          question: "Parlez-vous au micro pendant la soirée ?",
          reponse:
            "Seulement si vous le souhaitez. L'animation micro sert à faire vivre les temps forts et à dynamiser la soirée : pas de chant, pas d'écho dans la voix, pas d'interventions à tout bout de champ. Et si vous préférez sans micro, nous savons très bien nous en passer.",
        },
        {
          question: "Si un invité demande une chanson, que faites-vous ?",
          reponse:
            "Nous essayons de lui faire plaisir, sauf si le titre va à l'encontre de vos consignes ou risque de vider la piste. Parfois, nous attendons simplement le bon moment pour le passer.",
        },
        {
          question: "Jusqu'à quelle heure dure la musique ?",
          reponse:
            "Nous coupons la musique à 4 h du matin au plus tard, sauf si le règlement de votre lieu impose un horaire plus tôt, ou si vous réservez des heures supplémentaires.",
        },
        {
          question: "Intervenez-vous dans les salles avec détecteurs de fumée ou limiteur sonore ?",
          reponse:
            "Pour garantir la qualité des effets, nous ne réalisons pas nos animations dans les lieux équipés de détecteurs de fumée sensibles. Les limiteurs sonores ne nous empêchent pas d'intervenir, mais nous vous conseillons d'éviter un lieu qui en est équipé : le son est coupé ou bridé dès qu'un seuil est dépassé, et c'est toute l'ambiance de la soirée qui en pâtit. Signalez-nous ces équipements dès le premier échange : nous vérifions ensemble ce qui est possible.",
        },
        {
          question: "Nos témoins peuvent-ils vous contacter directement ?",
          reponse:
            "Oui, avec plaisir. Vos témoins ou votre wedding planner peuvent nous joindre pour toute question sur la musique, les animations ou la coordination — y compris pour préparer leurs surprises.",
        },
        {
          question: "Et en cas de problème technique le jour J ?",
          reponse:
            "Nous l'anticipons : tout le matériel est testé avant chaque prestation avec notre partenaire MX Événement, et du matériel de remplacement nous accompagne. En cas d'incident, nous intervenons immédiatement pour que la fête continue.",
        },
        {
          question: "Travaillez-vous avec nos autres prestataires ?",
          reponse:
            "Oui : lieu, traiteur, photographe, officiant, wedding planner… Nous nous coordonnons avec chacun pour que les temps forts s'enchaînent sans stress.",
        },
        {
          question: "Proposez-vous plusieurs formules ?",
          reponse:
            "Nous proposons une formule unique, complète, que vous pouvez enrichir d'une option premium. Nous vous en présentons le détail lors du premier échange.",
        },
        {
          question: "Comment réserver notre date ?",
          reponse:
            "Il suffit de nous retourner le devis signé, accompagné d'un acompte de 50 % du montant total : votre date est alors réservée.",
        },
        {
          question: "Vous déplacez-vous en dehors de l'Île-de-France ?",
          reponse:
            "Oui. Nous intervenons surtout en Île-de-France, mais nous nous déplaçons dans toute la France, en adaptant chaque prestation au lieu : salle de réception, domaine, extérieur ou site atypique.",
        },
      ],
      lien: "Toutes les questions",
    },
    appel: {
      titre: "Prêts à pimenter votre grand jour ?",
      texte: "Racontez-nous vos envies. Ensemble, trouvons les ingrédients de votre nuit.",
      bouton: "Pimentons votre nuit",
    },
  },
  en: {
    seo: {
      titre: "Wedding DJ in Paris: music, sound & lighting | Spice Events",
      description:
        "Award-winning wedding DJ (Mariages.net Wedding Awards): tailored planning from the ceremony to the party, with premium sound and lighting. Paris and the Île-de-France region.",
    },
    hero: {
      surtitre: "Weddings · Paris & Île-de-France",
      titre: "A big “I do”. *A spicy night.*",
      intro:
        "You only get married once. We plan the music, the lighting and the pace of every moment with you, so all you have to do is enjoy it.",
      ctaPrincipal: "Check my date",
      ctaSecondaire: "Our approach",
    },
    promesse: {
      surtitre: "Our promise",
      titre: "You enjoy it, *we spice it up*.",
      paragraphes: [
        "Our mission: to make your big day unforgettable and true to you, with a professional, modern and genuine service.",
        "Everything is designed so you can relax and live your evening to the full: every detail is prepared in advance and handled on the day.",
      ],
      garanties: [
        {
          titre: "An experienced DJ",
          texte: "Meticulous, attentive, able to adapt to any atmosphere and every guest.",
        },
        {
          titre: "Premium sound",
          texte: "Suited to your venue, supplied by our partner MX Événement and tested before every date.",
          lien: { href: "/son-et-lumiere", texte: "Our equipment" },
        },
        {
          titre: "Tailored lighting",
          texte: "Decorative lighting to flatter the venue, dynamic lights for the dance floor.",
        },
        {
          titre: "Thoughtful entertainment",
          texte: "Creative, original ideas chosen to serve your day, never to clutter it.",
          lien: { href: "/animations", texte: "See the entertainment" },
        },
      ],
    },
    journee: {
      surtitre: "From the first “I do” to the last encore",
      titre: "Every moment. *Its touch of spice.*",
      intro: "A gentle ceremony, a sparkling drinks reception, a dance floor coming alive: we pace the music and the light throughout your day.",
      moments: [
        {
          titre: "The ceremony",
          accroche: "The words. The shivers.",
          texte:
            "Microphones for your celebrant and loved ones, your entrance, music cued to the second: gentle, clear sound heard from the front row to the back, even outdoors.",
          image: "presta-ceremonie-cour",
          options: ["sonorisation-ceremonie-laique", "feux-d-artifice-de-jour"],
        },
        {
          titre: "The drinks reception",
          accroche: "Reunions set to music.",
          texte:
            "Music that sets the mood without drowning out the conversation, even far from the party room. Guests pick a record, leave a voice message or strike a pose at the photo booth.",
          image: "presta-vinyles-installation",
          options: ["sonorisation-deportee", "bar-a-vinyles", "livre-d-or-audio", "photobooth"],
        },
        {
          titre: "Dinner",
          accroche: "A light that brings everyone together.",
          texte:
            "Warm light that flatters the room, background music chosen with you, and your key moments built into the running order: speeches, slideshows, surprises from your wedding party.",
          image: "presta-diner-chateau",
          options: ["guirlandes-lumineuses"],
        },
        {
          titre: "The first dance",
          accroche: "Your bubble, in the middle of everyone.",
          texte:
            "Your song, staged: dedicated lighting and, where the venue allows, low fog and cold sparks timed to the music.",
          image: "presta-bal-etincelles-fumee",
          options: ["ouverture-de-bal"],
        },
        {
          titre: "The night",
          accroche: "One last song.",
          texte:
            "A mix that gets every generation dancing and a dance floor that never empties, until 4 am — or later with extra hours, if your venue allows.",
          image: "presta-piste-mains-levees",
          options: [],
        },
      ],
    },
    methode: {
      surtitre: "Our approach",
      titre: "Six steps, *not a single wrong note*.",
      intro:
        "From the first conversation to the last song, personal support: we take the time to understand your vision, your tastes and the emotions you want to share.",
      etapes: [
        {
          titre: "First conversation",
          texte: "A meeting or video call to understand your expectations, the atmosphere you want and your venue's technical needs.",
        },
        {
          titre: "Quote & booking",
          texte: "A clear, tailored proposal that fits your budget. Signed quote and 50% deposit: your date is secured.",
        },
        {
          titre: "Planning",
          texte: "Music questionnaire, key moments, playlists: we build the running order together through regular catch-ups.",
        },
        {
          titre: "Coordination",
          texte: "We contact your suppliers — venue, caterer, celebrant… — to plan timings, access and technical needs.",
        },
        {
          titre: "Set-up & tests",
          texte: "Sound and lighting installed and tested in advance, every setting adapted to the venue.",
        },
        {
          titre: "The big day",
          texte: "We're there from start to finish: music, transitions and lighting handled discreetly.",
        },
      ],
    },
    nuvio: {
      surtitre: "Light-hearted, even beforehand",
      titre: "A great party *is planned together*.",
      texte:
        "Once the quote is signed, you plan your wedding on Nuvio, the platform we designed: you, our team and your DJ all see the same version, updated to the second. No more details scattered across twenty emails.",
      points: ["Hour-by-hour schedule", "Your music, moment by moment", "Quote signed online", "Messages with the whole team"],
      lien: "Discover Nuvio (in French)",
      apercu: {
        surtitre: "Your wedding space",
        titre: "The big day takes shape.",
        texte: "All the little things that make your day.",
        avancement: "Progress",
        note: "Illustrative preview of your planning space",
      },
    },
    dj: {
      surtitre: "Your DJ",
      titre: "A DJ who lives the night *with you*.",
      citation: "A good DJ doesn't hide behind a laptop: he lives the night with you.",
      paragraphes: [
        "A DJ for more than 20 years, Cédric Allard turned his passion into his profession: over 600 weddings, parties and corporate events across France. What drives him above all is sharing — that unique energy when music brings people together.",
        "Depending on your date, Cédric either plays himself or introduces you to a DJ from the team, prepared with the same method and the same high standards.",
      ],
      differences: [
        {
          titre: "He reads the room",
          texte: "Watching the dance floor closely, he plays the right track at the right time, rather than a fixed playlist.",
        },
        {
          titre: "Every generation",
          texte: "Your taste first, then a mix that gets grandparents and friends dancing together.",
        },
        {
          titre: "The microphone, sparingly",
          texte: "A few words to bring the key moments to life, never singing or stealing the show — or no microphone at all, if you prefer.",
        },
      ],
      lien: "More about Cédric",
      mix: "Hear Cédric on the decks (DJ Dioz): a mix for every generation.",
      equipe: "Meet the team's DJs",
    },
    video: {
      surtitre: "On film",
      titre: "Your nights, *in motion*.",
      intro: "A few minutes inside our weddings: the emotion of the first dance, and a dance floor that stays full until the very end.",
    },
    photos: { surtitre: "In pictures", titre: "Nights *full of flavour*.", lien: "View the gallery" },
    avis: {
      lien: "See all reviews",
    },
    faq: {
      surtitre: "Frequently asked questions",
      titre: "Your questions, *answered*.",
      questions: [
        {
          question: "How do you choose the music for our wedding?",
          reponse:
            "It all starts with you: a music questionnaire and planning meetings tell us your favourite styles and songs, and anything you'd rather avoid. We then build a set that reflects you and that your guests will love too.",
        },
        {
          question: "Do you use the microphone during the evening?",
          reponse:
            "Only if you want us to. The microphone is there to bring key moments to life and lift the energy: no singing, no echo effects, no constant interruptions. And if you'd rather go without, that's absolutely fine.",
        },
        {
          question: "What if a guest requests a song?",
          reponse:
            "We'll try to play it, unless it goes against your wishes or risks emptying the dance floor. Sometimes we simply wait for the right moment.",
        },
        {
          question: "How late does the music go on?",
          reponse:
            "We stop the music at 4 am at the latest, unless your venue's rules require an earlier time, or you book extra hours.",
        },
        {
          question: "Do you work in venues with smoke detectors or sound limiters?",
          reponse:
            "To guarantee the quality of the effects, we don't provide our entertainment in venues fitted with sensitive smoke detectors. Sound limiters don't stop us from performing, but we advise against choosing a venue fitted with one: the sound is cut or capped as soon as a threshold is exceeded, and the whole atmosphere of the evening suffers. Let us know about them in our first conversation and we'll look at what's possible together.",
        },
        {
          question: "Can our best man or bridesmaids contact you directly?",
          reponse:
            "Of course. Your wedding party or wedding planner can get in touch with any question about the music, entertainment or coordination — including to plan their surprises.",
        },
        {
          question: "What happens if something goes wrong technically on the day?",
          reponse:
            "We plan for it: all equipment is tested before every event with our partner MX Événement, and we bring backup gear. If anything happens, we step in straight away so the party carries on.",
        },
        {
          question: "Do you work with our other suppliers?",
          reponse:
            "Yes: venue, caterer, photographer, celebrant, wedding planner… We coordinate with each of them so the key moments flow without stress.",
        },
        {
          question: "Do you offer several packages?",
          reponse:
            "We offer a single, complete package, which you can enhance with a premium option. We'll walk you through the details in our first conversation.",
        },
        {
          question: "How do we book our date?",
          reponse: "Simply return the signed quote with a deposit of 50% of the total: your date is then reserved.",
        },
        {
          question: "Do you travel outside the Paris region?",
          reponse:
            "Yes. Most of our events are in Île-de-France, but we travel all over France, adapting every service to the venue: reception hall, country estate, outdoors or somewhere unusual.",
        },
      ],
      lien: "All questions",
    },
    appel: {
      titre: "Ready to spice up your big day?",
      texte: "Tell us what you'd love. Together, let's find the ingredients for your night.",
      bouton: "Let's spice up your night",
    },
  },
};
