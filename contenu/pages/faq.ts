import type { Locale, CheminStatique } from "@/i18n/routing";
import type { Bilingue, QuestionReponse, Seo } from "../types";

/** Un thème de la FAQ ; `questions` sert aussi au futur balisage FAQPage. */
export type ThemeFaq = {
  id: string;
  titre: string;
  questions: QuestionReponse[];
  lien?: { href: CheminStatique; texte: string };
};

type PageFaq = {
  seo: Seo;
  hero: { surtitre: string; titre: string; intro: string };
  sommaire: string;
  themes: ThemeFaq[];
  contact: { titre: string; texte: string };
};

export const FAQ: Bilingue<PageFaq> = {
  fr: {
    seo: {
      titre: "FAQ DJ mariage — musique, technique, réservation | Spice Events",
      description:
        "Vos questions sur notre DJ de mariage en Île-de-France : choix de la musique, horaires, micro, matériel son et lumière, animations, acompte et réservation.",
    },
    hero: {
      surtitre: "Questions fréquentes",
      titre: "Toutes vos questions, *nos réponses*.",
      intro: "Musique, technique, animations, réservation : l'essentiel pour préparer sereinement votre mariage ou votre événement.",
    },
    sommaire: "Thèmes",
    themes: [
      {
        id: "general",
        titre: "Général",
        questions: [
          {
            question: "Quelle est l'expérience de Spice Events ?",
            reponse:
              "Spice Events intervient dans l'événementiel depuis plus de 20 ans, avec des centaines de projets réalisés pour des clients privés et professionnels. Chaque événement profite de ce savoir-faire pour une prestation fluide et adaptée à vos besoins.",
          },
          {
            question: "Quels services proposez-vous ?",
            reponse:
              "Nous prenons en charge toute la partie musicale et technique de votre événement : sonorisation, éclairage, animation et coordination avec vos autres prestataires, pour que chaque moment se déroule sans stress.",
          },
          {
            question: "Sur quels types d'événements intervenez-vous ?",
            reponse:
              "Mariages, anniversaires, soirées privées et événements d'entreprise. Chaque projet est traité avec le même soin et le même professionnalisme.",
          },
          {
            question: "Pouvez-vous intervenir partout en France ?",
            reponse:
              "Oui, nous nous déplaçons sur l'ensemble du territoire. Chaque prestation est adaptée au lieu : salle de réception, espace extérieur ou site atypique.",
          },
          {
            question: "Pouvez-vous vous adapter à différents lieux et configurations ?",
            reponse:
              "Totalement. En intérieur, en extérieur, dans un domaine ou un espace d'entreprise, nous adaptons la sonorisation, l'éclairage et la logistique à chaque contexte.",
          },
          {
            question: "Peut-on adapter vos prestations à nos envies ?",
            reponse:
              "Absolument. Musique, animations, son et lumière : tout s'ajuste à vos goûts, à ceux de vos invités et à l'ambiance souhaitée pour chaque moment.",
          },
        ],
      },
      {
        id: "mariage",
        titre: "Mariage",
        lien: { href: "/mariages", texte: "Notre accompagnement mariage" },
        questions: [
          {
            question: "Comment choisissez-vous la musique de notre mariage ?",
            reponse:
              "Grâce à un questionnaire et à des rendez-vous de préparation, nous sélectionnons vos morceaux préférés et ajustons nos playlists à vos styles favoris, pour une ambiance qui vous ressemble et qui plaît aussi à vos invités.",
          },
          {
            question: "Si un invité demande une musique, que faites-vous ?",
            reponse:
              "Nous essayons de le satisfaire, sauf si le titre va à l'encontre de vos consignes ou s'il risque de toute évidence de vider la piste. Parfois, nous attendons simplement le bon moment pour le passer.",
          },
          {
            question: "Jusqu'à quelle heure dure la soirée ?",
            reponse:
              "Nous coupons la musique à 4 h du matin au plus tard, sauf si le règlement de la salle impose un horaire plus tôt ou si vous demandez des heures supplémentaires.",
          },
          {
            question: "Parlez-vous au micro ?",
            reponse:
              "Selon vos préférences. L'animation micro sert à interagir avec vos invités et à dynamiser la soirée — pas à chanter, ajouter de l'écho ou intervenir en continu. Si vous n'en voulez pas, nous savons très bien nous en passer.",
          },
          {
            question: "Nos témoins ou organisateurs peuvent-ils vous contacter ?",
            reponse:
              "Oui. Vos témoins ou votre wedding planner peuvent nous joindre directement pour toute question sur la musique, les animations ou la coordination, afin de préparer au mieux les surprises et les moments forts.",
          },
          {
            question: "Travaillez-vous avec les autres prestataires du mariage ?",
            reponse:
              "Oui, nous nous coordonnons avec le lieu, le traiteur, le photographe et le wedding planner, pour que chaque temps fort soit parfaitement synchronisé.",
          },
        ],
      },
      {
        id: "preparation",
        titre: "Préparation & réservation",
        questions: [
          {
            question: "Comment se déroule la préparation avec Spice Events ?",
            reponse:
              "Tout commence par un échange, en rendez-vous ou en visio, pour comprendre vos envies et vos besoins techniques. Viennent ensuite les rendez-vous de préparation, la validation du déroulé et la coordination avec vos prestataires avant le jour J.",
          },
          {
            question: "Comment obtenir un devis ?",
            reponse:
              "Après ce premier échange, nous vous adressons une proposition sur mesure, claire et adaptée à votre budget.",
          },
          {
            question: "Proposez-vous plusieurs formules ?",
            reponse:
              "Nous proposons une formule unique, complète, que vous pouvez enrichir d'une option premium. Nous vous en présentons le détail lors du premier échange.",
          },
          {
            question: "Pouvez-vous nous recommander d'autres prestataires ?",
            reponse:
              "Oui. Pour ce que nous ne proposons pas nous-mêmes (musiciens, magicien, artificier…), nous vous orientons vers des partenaires de confiance avec qui nous aimons travailler.",
          },
          {
            question: "Comment réserver notre date ?",
            reponse:
              "Il suffit de nous retourner le devis signé, accompagné d'un acompte de 50 % du montant total. Votre date est alors bloquée et nous passons à la préparation.",
          },
          {
            question: "Nous accompagnez-vous dès la conception de l'événement ?",
            reponse:
              "Oui. Nous analysons vos besoins, vous conseillons sur l'ambiance musicale et la mise en lumière, et planifions avec vous l'ensemble du déroulé.",
          },
          {
            question: "Êtes-vous présents pendant tout l'événement ?",
            reponse:
              "Oui, notre équipe est présente du début à la fin pour gérer la régie, la musique et l'animation, de façon continue et discrète.",
          },
        ],
      },
      {
        id: "technique",
        titre: "Technique",
        lien: { href: "/a-propos", texte: "Notre exigence technique" },
        questions: [
          {
            question: "Fournissez-vous tout le matériel ?",
            reponse:
              "Oui, son, lumière et animations, en partenariat avec MX Événement. Tout est testé avant chaque prestation, et nous prévoyons du matériel de remplacement pour parer à toute éventualité.",
          },
          {
            question: "Comment gérez-vous les imprévus techniques le jour J ?",
            reponse:
              "Nous les anticipons : tests complets avant chaque date et matériel de secours sur place. En cas d'incident, nous intervenons immédiatement pour que la musique et les animations continuent sans interruption.",
          },
          {
            question: "Pouvez-vous sonoriser plusieurs espaces en même temps ?",
            reponse:
              "Oui : cocktail, scène, piste de danse… Chaque espace dispose de son propre matériel son et lumière, avec une ambiance adaptée et une cohérence d'ensemble.",
          },
          {
            question: "Y a-t-il des restrictions pour les salles avec détecteurs de fumée ou limiteur sonore ?",
            reponse:
              "Pour les détecteurs de fumée, oui : nous ne réalisons pas de prestation dans les lieux équipés de détecteurs sensibles, qui compromettent les effets visuels. Les limiteurs sonores ne nous empêchent pas d'intervenir, mais nous vous conseillons d'éviter un lieu qui en est équipé : le son est coupé ou bridé dès qu'un seuil est dépassé, et c'est toute l'ambiance de la soirée qui en pâtit. Nous vérifions toujours les contraintes du lieu en amont.",
          },
        ],
      },
      {
        id: "animations",
        titre: "Animations",
        lien: { href: "/animations", texte: "Toutes les animations" },
        questions: [
          {
            question: "Qu'apporte le bar à vinyles à une soirée ?",
            reponse:
              "Vos invités deviennent DJ le temps de quelques morceaux. C'est une animation originale et participative, qui crée des échanges et une ambiance unique.",
          },
          {
            question: "Pourquoi choisir un livre d'or audio ?",
            reponse:
              "Il transforme les messages de vos invités en souvenirs vivants : des voix, des émotions et des mots que vous pourrez réécouter et partager.",
          },
          {
            question: "Comment le photobooth s'intègre-t-il à l'ambiance ?",
            reponse:
              "Il devient un point de rendez-vous de la soirée : vos invités se lâchent, créent des moments spontanés et repartent avec des photos imprimées ou numériques. Il s'adapte à tous les styles et thèmes.",
          },
          {
            question: "Les étincelles froides et la fumée lourde sont-elles compatibles avec tous les lieux ?",
            reponse:
              "Pas toujours : certains lieux sont équipés de détecteurs de fumée sensibles, incompatibles avec ces effets. Nous vérifions les contraintes techniques du lieu avant toute installation.",
          },
          {
            question: "Les guirlandes lumineuses s'installent-elles en intérieur et en extérieur ?",
            reponse:
              "Oui : salle, jardin, terrasse ou cour, elles créent une ambiance chaleureuse et élégante et s'intègrent à votre décoration.",
          },
        ],
      },
      {
        id: "entreprise",
        titre: "Événements d'entreprise",
        lien: { href: "/evenementiel", texte: "Nos événements" },
        questions: [
          {
            question: "Intervenez-vous pour des événements d'entreprise ?",
            reponse:
              "Oui : séminaires, galas, lancements de produit… Nous proposons une prestation clé en main, avec une organisation rigoureuse et une ambiance adaptée à l'image de votre entreprise.",
          },
          {
            question: "Comment assurez-vous la réussite de notre événement ?",
            reponse:
              "Nous misons sur la fluidité, la coordination entre prestataires et une ambiance musicale adaptée au format, aux objectifs et à vos participants.",
          },
          {
            question: "Pouvez-vous intégrer des discours ou des temps forts ?",
            reponse:
              "Oui. Discours, remises de prix ou projections sont intégrés au déroulé technique et musical, pour que chaque moment important soit mis en valeur.",
          },
          {
            question: "Pouvez-vous adapter la prestation à l'image de notre entreprise ?",
            reponse:
              "Absolument. Nous personnalisons l'ambiance musicale et visuelle pour refléter l'identité et les valeurs de votre marque, dans le respect du ton de votre événement.",
          },
        ],
      },
    ],
    contact: {
      titre: "Une autre *question* ?",
      texte: "Écrivez-nous : Cédric vous répond personnellement.",
    },
  },
  en: {
    seo: {
      titre: "Wedding DJ FAQ — music, equipment, booking | Spice Events, Paris area",
      description:
        "Your questions about our wedding DJ service in Paris and Île-de-France: choosing the music, timings, microphone use, sound and lighting, entertainment, deposit and booking.",
    },
    hero: {
      surtitre: "Frequently asked questions",
      titre: "All your questions, *answered*.",
      intro: "Music, equipment, entertainment, booking: everything you need to plan your wedding or event with peace of mind.",
    },
    sommaire: "Topics",
    themes: [
      {
        id: "general",
        titre: "General",
        questions: [
          {
            question: "How experienced is Spice Events?",
            reponse:
              "Spice Events has been working in events for over 20 years, with hundreds of projects for private and corporate clients. Every event benefits from that know-how, for a smooth service tailored to your needs.",
          },
          {
            question: "What services do you offer?",
            reponse:
              "We take care of the whole music and technical side of your event: sound, lighting, entertainment and coordination with your other suppliers, so that every moment runs without stress.",
          },
          {
            question: "What kinds of events do you cover?",
            reponse:
              "Weddings, birthdays, private parties and corporate events. Every project gets the same care and professionalism.",
          },
          {
            question: "Can you work anywhere in France?",
            reponse:
              "Yes, we travel throughout France. Each service is adapted to the venue, whether it's a reception hall, an outdoor space or a more unusual setting.",
          },
          {
            question: "Can you adapt to different venues and layouts?",
            reponse:
              "Absolutely. Indoors or outdoors, at a country estate or a corporate venue, we adapt the sound, lighting and logistics to each setting.",
          },
          {
            question: "Can you tailor your services to what we want?",
            reponse:
              "Of course. Music, entertainment, sound and lighting are all adjusted to your tastes, your guests' tastes and the atmosphere you want for each moment.",
          },
        ],
      },
      {
        id: "mariage",
        titre: "Weddings",
        lien: { href: "/mariages", texte: "Our wedding service" },
        questions: [
          {
            question: "How do you choose the music for our wedding?",
            reponse:
              "Through a questionnaire and planning meetings, we pick out your favourite songs and tailor our playlists to the styles you love, for an atmosphere that feels like you and that your guests will enjoy too.",
          },
          {
            question: "What happens if a guest requests a song?",
            reponse:
              "We try to play it, unless it goes against your instructions or would clearly empty the dance floor. Sometimes we simply wait for the right moment to play it.",
          },
          {
            question: "How late does the party go on?",
            reponse:
              "We stop the music at 4 am at the latest, unless the venue's rules require an earlier finish or you ask for extra hours.",
          },
          {
            question: "Do you use the microphone?",
            reponse:
              "Only as much as you'd like. Microphone work is there to interact with your guests and lift the energy — not to sing, add echo effects or talk all night. If you'd rather do without, that's absolutely fine.",
          },
          {
            question: "Can our best man, maid of honour or planner contact you?",
            reponse:
              "Yes. Your wedding party or wedding planner can get in touch with us directly about the music, entertainment or coordination, so that surprises and key moments are perfectly prepared.",
          },
          {
            question: "Do you work with the other wedding suppliers?",
            reponse:
              "Yes, we coordinate with the venue, the caterer, the photographer and the wedding planner, so that every highlight is perfectly in sync.",
          },
        ],
      },
      {
        id: "preparation",
        titre: "Planning & booking",
        questions: [
          {
            question: "How does planning with Spice Events work?",
            reponse:
              "It all starts with a conversation, in person or by video call, to understand what you want and what you need technically. Then come the planning meetings, sign-off of the running order and coordination with your suppliers before the big day.",
          },
          {
            question: "How do I get a quote?",
            reponse: "After that first conversation, we send you a clear, tailored proposal that fits your budget.",
          },
          {
            question: "Do you offer several packages?",
            reponse:
              "We offer a single, complete package, which you can enhance with a premium option. We'll walk you through the details in our first conversation.",
          },
          {
            question: "Can you recommend other suppliers?",
            reponse:
              "Yes. For anything we don't provide ourselves (musicians, a magician, fireworks…), we'll point you to trusted partners we love working with.",
          },
          {
            question: "How do we book our date?",
            reponse:
              "Simply return the signed quote along with a deposit of 50% of the total. Your date is then secured and we move on to the planning.",
          },
          {
            question: "Do you support us from the very start?",
            reponse:
              "Yes. We look at your needs, advise you on the music and lighting, and plan the whole running order with you.",
          },
          {
            question: "Are you there for the whole event?",
            reponse:
              "Yes, our team is there from start to finish to run the sound desk, the music and the entertainment, continuously and discreetly.",
          },
        ],
      },
      {
        id: "technique",
        titre: "Equipment",
        lien: { href: "/a-propos", texte: "Our technical standards" },
        questions: [
          {
            question: "Do you provide all the equipment?",
            reponse:
              "Yes — sound, lighting and entertainment, in partnership with MX Événement. Everything is tested before each event, and we bring replacement equipment to cover any eventuality.",
          },
          {
            question: "How do you handle technical problems on the day?",
            reponse:
              "We anticipate them: full tests before every date and backup equipment on site. If anything happens, we step in immediately so that the music and entertainment carry on without interruption.",
          },
          {
            question: "Can you provide sound for several spaces at once?",
            reponse:
              "Yes: drinks reception, stage, dance floor… Each space has its own sound and lighting equipment, with the right atmosphere and a consistent feel throughout.",
          },
          {
            question: "Are there restrictions for venues with smoke detectors or sound limiters?",
            reponse:
              "For smoke detectors, yes: we don't perform in venues fitted with sensitive detectors, as they compromise the visual effects. Sound limiters don't stop us from performing, but we advise against choosing a venue fitted with one: the sound is cut or capped as soon as a threshold is exceeded, and the whole atmosphere of the evening suffers. We always check the venue's constraints beforehand.",
          },
        ],
      },
      {
        id: "animations",
        titre: "Entertainment",
        lien: { href: "/animations", texte: "All entertainment" },
        questions: [
          {
            question: "What does the vinyl bar add to a party?",
            reponse:
              "Your guests become the DJ for a few songs. It's an original, hands-on activity that gets people talking and creates a unique atmosphere.",
          },
          {
            question: "Why choose an audio guestbook?",
            reponse:
              "It turns your guests' messages into living memories: voices, emotions and words you can listen to again and share.",
          },
          {
            question: "How does the photo booth fit into the atmosphere?",
            reponse:
              "It becomes a meeting point of the evening: guests let loose, create spontaneous moments and leave with printed or digital photos. It suits every style and theme.",
          },
          {
            question: "Are cold sparks and low fog suitable for every venue?",
            reponse:
              "Not always: some venues have sensitive smoke detectors, which aren't compatible with these effects. We check the venue's technical constraints before setting anything up.",
          },
          {
            question: "Can fairy lights be installed indoors and outdoors?",
            reponse:
              "Yes: in a hall, garden, terrace or courtyard, they create a warm, elegant atmosphere and blend in with your decoration.",
          },
        ],
      },
      {
        id: "entreprise",
        titre: "Corporate events",
        lien: { href: "/evenementiel", texte: "Our events" },
        questions: [
          {
            question: "Do you work on corporate events?",
            reponse:
              "Yes: seminars, galas, product launches… We offer a turnkey service, with rigorous organisation and an atmosphere that reflects your company's image.",
          },
          {
            question: "How do you make sure our event is a success?",
            reponse:
              "We focus on a smooth flow, coordination between suppliers and music suited to the format, the objectives and your guests.",
          },
          {
            question: "Can you include speeches or key moments?",
            reponse:
              "Yes. Speeches, award ceremonies and screenings are built into the technical and musical running order, so that every important moment gets the spotlight.",
          },
          {
            question: "Can you adapt the service to our company's image?",
            reponse:
              "Absolutely. We tailor the music and visual atmosphere to reflect your brand's identity and values, in keeping with the tone of your event.",
          },
        ],
      },
    ],
    contact: {
      titre: "Another *question*?",
      texte: "Drop us a line: Cédric will get back to you personally.",
    },
  },
};

/** Toutes les questions d'une langue, à plat (pour le balisage FAQPage). */
export function questionsFaq(locale: Locale): QuestionReponse[] {
  return FAQ[locale].themes.flatMap((t) => t.questions);
}
