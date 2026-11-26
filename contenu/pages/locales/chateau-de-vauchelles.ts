import type { Locale } from "@/i18n/routing";
import { typographier } from "@/lib/typographie";
import type { PageLocale } from "./types";

/**
 * Page lieu « DJ mariage au Château de Vauchelles » (Vauchelles-lès-Domart,
 * Somme), en français et en anglais : beaucoup de couples y viennent de
 * l’étranger. Huit mariages animés de 2024 à 2026 (planning de Cédric,
 * novembre 2026), avis déjà publiés sur le site. Pas de nom de musicien qui ne
 * figure plus sur la page Nos DJ.
 */
export const CHATEAU_DE_VAUCHELLES: Record<Locale, PageLocale> = typographier({
  fr: {
    seo: {
      titre: "DJ mariage au Château de Vauchelles | Spice Events",
      description:
        "DJ de mariage au Château de Vauchelles, près d’Amiens : huit mariages animés depuis 2024, de la cérémonie à la soirée, pour couples français et étrangers.",
    },
    ariane: "Château de Vauchelles",
    hero: {
      surtitre: "Somme · Hauts-de-France",
      titre: "DJ mariage *au Château de Vauchelles*",
      intro:
        "Huit mariages depuis 2024 dans ce château près d’Amiens : nous connaissons ses salles, ses espaces et la meilleure façon d’y faire danser vos invités, qu’ils viennent de France, du Royaume-Uni ou d’ailleurs.",
    },
    promesse: {
      surtitre: "Un lieu que nous connaissons bien",
      titre: "Huit mariages, *autant de souvenirs*.",
      paragraphes: [
        "Cérémonie laïque, cocktail, dîner dans une salle, soirée dans une autre : au Château de Vauchelles, la journée se vit d’un espace à l’autre. Nous installons une sonorisation pour chaque moment, et un éclairage qui met le château en valeur à la nuit tombée.",
        "Beaucoup de nos mariés y viennent de l’étranger : tout se prépare à distance, par appels et par écrit, en français ou en anglais, jusqu’au déroulé minute par minute du jour J.",
      ],
    },
    cartes: {
      surtitre: "Nos mariages au château",
      titre: "Huit mariages *au Château de Vauchelles*",
      intro: "Chaque couple, sa journée. Quelques souvenirs, avec Cédric ou un DJ de l’équipe aux platines.",
      liste: [
        {
          surtitre: "Cérémonie laïque · Soirée",
          titre: "Août 2024",
          detail: "Avec Cédric",
          texte: "Une cérémonie laïque, une sonorisation déportée pour suivre la journée, et des invités qui n’ont jamais quitté la piste.",
        },
        {
          surtitre: "Un mariage anglais",
          titre: "Août 2024",
          detail: "Avec Cédric",
          texte:
            "Musique de la cérémonie, du cocktail et de la soirée, deux enceintes supplémentaires, le photobooth et l’éclairage : tout réuni en une seule équipe.",
        },
        {
          surtitre: "Une journée complète",
          titre: "Mai 2025",
          detail: "Avec Cédric",
          texte:
            "L’équipe sur place dès 9 h, cérémonie laïque, photobooth, et une soirée prolongée sur le moment tant la piste était pleine.",
        },
        {
          surtitre: "Bar à vinyles · Saxophone",
          titre: "Mai 2025",
          detail: "Avec Cédric",
          texte: "Bar à vinyles, vidéoprojection et un saxophone sonorisé : une soirée saluée pour ses éclairages et ses projecteurs.",
        },
        {
          surtitre: "Jusqu’à 4 h du matin",
          titre: "Juin 2025",
          detail: "Avec Lucas M.",
          texte: "Cérémonie, cocktail et soirée en musique, lasers et photobooth, et une piste animée jusqu’à 4 h.",
        },
        {
          surtitre: "Cérémonie laïque · Soirée",
          titre: "Août 2025",
          detail: "Avec Lucas M.",
          texte: "Une cérémonie laïque en musique, puis le cocktail et la soirée dansante.",
        },
        {
          surtitre: "DJ et saxophone live",
          titre: "Juillet 2026",
          detail: "Avec Cédric",
          texte:
            "Cérémonie laïque, dîner dans une salle à part, et un saxophoniste aux côtés du DJ : selon les mariés, l’une des meilleures fêtes de mariage de leurs invités.",
        },
        {
          surtitre: "Préparé depuis l’étranger",
          titre: "Juillet 2026",
          detail: "Avec Antoine D.",
          texte: "Un couple venu de l’étranger, tout préparé à distance : Antoine aux platines, qui a aussi orchestré les discours du dîner.",
        },
      ],
      aussi: "Prochain rendez-vous au château : juin 2027.",
    },
    avis: {
      surtitre: "Ils se sont mariés à Vauchelles",
      titre: "Ce qu’ils *en ont dit*",
      liste: [
        {
          texte:
            "Il a vraiment rendu notre soirée si amusante et si spéciale : nos invités n’ont jamais quitté la piste de danse. Entre l’éclairage, la sonorisation et la playlist, je n’aurais pas pu rêver mieux, si ce n’est de pouvoir la revivre !",
          auteurs: "Michaela",
          contexte: "Août 2024",
        },
        {
          texte:
            "Cédric a tout fait pour notre mariage (DJ, musique de la cérémonie, musique de l’heure du cocktail, photomaton, éclairage !). Le photomaton a été un tel succès auprès des invités et la musique était absolument impeccable.",
          auteurs: "Beth & Liam",
          contexte: "Août 2024",
        },
        {
          texte:
            "Il devait initialement jouer pour nous jusqu’à 1 heure du matin, mais voyant à quel point tout le monde s’amusait, il a proposé de prolonger le spectacle le soir même, ce qui nous a permis de continuer à faire la fête !",
          auteurs: "Aaron",
          contexte: "Mai 2025",
        },
        {
          texte:
            "Au-delà de mettre l’ambiance et faire danser tout le monde, c’est une personne disponible, humaine, qui fait son travail avec passion. Petit plus : éclairages et projecteurs au top, le rendu est génial.",
          auteurs: "Quentin & Pauline",
          contexte: "Mai 2025",
        },
        {
          texte:
            "La musique était parfaite toute la soirée, la piste de danse est restée pleine, et tant de nos invités ont dit que c’était l’une des meilleures fêtes de mariage auxquelles ils ont assisté.",
          auteurs: "James",
          contexte: "Juillet 2026",
        },
        {
          texte:
            "DJ Antoine a été excellent ; il a joué toutes les chansons que nous avons demandées et a aidé à officier les discours pendant le dîner. Dans l’ensemble, 10/10.",
          auteurs: "Roman",
          contexte: "Juillet 2026",
        },
      ],
    },
    atouts: {
      surtitre: "Pourquoi Vauchelles",
      titre: "Les atouts *du château*",
      intro: "Ce que nous aimons au Château de Vauchelles, et comment nous en tirons le meilleur.",
      liste: [
        {
          titre: "Un château classique",
          texte: "Une demeure des XVIIe et XVIIIe siècles, son parc et ses dépendances : un décor superbe en photo le jour, et sous la lumière le soir.",
        },
        {
          titre: "Toute la journée au même endroit",
          texte: "Cérémonie laïque, cocktail, dîner et soirée sur place : aucune navette, et la musique accompagne chaque moment.",
        },
        {
          titre: "Des volumes pour danser",
          texte: "De grandes salles sous de hauts plafonds : la place pour une vraie piste de danse et un éclairage spectaculaire.",
        },
        {
          titre: "Vos invités dorment sur place",
          texte: "Le château loge une partie des invités : personne ne surveille sa montre ni la route du retour, et la fête en profite.",
        },
        {
          titre: "Entre Paris et Londres",
          texte:
            "À environ 1 h 30 de Paris par l’A16, sur la route de Calais et du tunnel sous la Manche : idéal pour les familles venues du Royaume-Uni.",
        },
        {
          titre: "Une équipe qui connaît le lieu",
          texte: "Huit mariages depuis 2024 : nous savons déjà où placer le son et la lumière pour chaque moment de votre journée.",
        },
      ],
    },
    anecdote: {
      surtitre: "Le saviez-vous ?",
      titre: "La plus vaste cathédrale *de France*",
      texte:
        "À une demi-heure du château, Notre-Dame d’Amiens est la plus vaste cathédrale gothique de France : on pourrait, dit-on, y loger deux fois Notre-Dame de Paris. Classée au patrimoine mondial de l’Unesco, sa façade retrouve certains soirs les couleurs qu’elle avait au Moyen Âge. Une belle promenade pour vos invités le lendemain du mariage.",
    },
    photos: { entete: "soiree-piste-fumee", promesse: "mariage-soiree-regie" },
    appel: {
      titre: "Vous vous mariez *au Château de Vauchelles* ?",
      texte: "Dites-nous votre date : nous vous répondons personnellement, en français ou en anglais.",
      bouton: "Vérifier ma date",
    },
  },
  en: {
    seo: {
      titre: "Wedding DJ at Château de Vauchelles | Spice Events",
      description:
        "Wedding DJ at Château de Vauchelles, near Amiens: eight weddings since 2024, from the ceremony to the party, for French and international couples.",
    },
    ariane: "Château de Vauchelles",
    hero: {
      surtitre: "Somme · Northern France",
      titre: "Wedding DJ *at Château de Vauchelles*",
      intro:
        "Eight weddings since 2024 at this château near Amiens: we know its rooms, its spaces and how to keep your guests dancing, whether they come from France, the UK or further afield.",
    },
    promesse: {
      surtitre: "A venue we know well",
      titre: "Eight weddings, *eight stories*.",
      paragraphes: [
        "Ceremony, drinks reception, dinner in one room, party in another: at Château de Vauchelles the day moves from space to space. We set up sound for every moment, and lighting that shows the château at its best once night falls.",
        "Many of our couples travel from abroad: everything is planned remotely, by call and in writing, in English or French, right down to the minute-by-minute timeline for the day.",
      ],
    },
    cartes: {
      surtitre: "Our weddings at the château",
      titre: "Eight weddings *at Château de Vauchelles*",
      intro: "Every couple, their own day. A few memories, with Cédric or one of our DJs behind the decks.",
      liste: [
        {
          surtitre: "Ceremony · Party",
          titre: "August 2024",
          detail: "With Cédric",
          texte: "A celebrant-led ceremony, sound that followed the day from space to space, and guests who never left the dance floor.",
        },
        {
          surtitre: "An English wedding",
          titre: "August 2024",
          detail: "With Cédric",
          texte: "Ceremony, drinks and party music, two extra speakers, the photo booth and the lighting: all from one team.",
        },
        {
          surtitre: "A full day",
          titre: "May 2025",
          detail: "With Cédric",
          texte: "The team on site from 9 am, a celebrant-led ceremony, the photo booth, and a party extended on the night because the dance floor was packed.",
        },
        {
          surtitre: "Vinyl bar · Saxophone",
          titre: "May 2025",
          detail: "With Cédric",
          texte: "Vinyl bar, video projection and a miked-up saxophone: an evening praised for its lighting and spotlights.",
        },
        {
          surtitre: "Until 4 am",
          titre: "June 2025",
          detail: "With Lucas M.",
          texte: "Music for the ceremony, the drinks and the party, lasers and the photo booth, and a dance floor going strong until 4 am.",
        },
        {
          surtitre: "Ceremony · Party",
          titre: "August 2025",
          detail: "With Lucas M.",
          texte: "A celebrant-led ceremony with music, followed by the drinks reception and the party.",
        },
        {
          surtitre: "DJ and live sax",
          titre: "July 2026",
          detail: "With Cédric",
          texte:
            "A celebrant-led ceremony, dinner in a separate room and a saxophonist playing alongside the DJ: for the couple’s guests, one of the best wedding parties they had been to.",
        },
        {
          surtitre: "Planned from abroad",
          titre: "July 2026",
          detail: "With Antoine D.",
          texte: "A couple travelling from overseas, everything planned remotely: Antoine on the decks, who also hosted the dinner speeches.",
        },
      ],
      aussi: "Our next wedding at the château: June 2027.",
    },
    avis: {
      surtitre: "They married at Vauchelles",
      titre: "What *they said*",
      liste: [
        {
          texte:
            "He truly made our night so fun and special, as our guests never left the dance floor. Between the lighting, sound system and playlist, I couldn’t have asked for it to be better, only that I could relive it again!",
          auteurs: "Michaela",
          contexte: "August 2024",
        },
        {
          texte:
            "Cedric did everything for our wedding (DJ, ceremony music, cocktail hour music, photo booth, lighting!). The photo booth was such a hit with the guests and the music was absolutely flawless.",
          auteurs: "Beth & Liam",
          contexte: "August 2024",
        },
        {
          texte:
            "He was initially supposed to play for us until 1 a.m., but seeing how much fun everyone was having, he offered to extend the show the same evening, which allowed us to continue to party!",
          auteurs: "Aaron",
          contexte: "May 2025",
        },
        {
          texte:
            "Beyond creating the atmosphere and getting everyone dancing, he is available, warm-hearted and does his job with passion. A little extra: the lighting and spotlights were top-notch, the result was brilliant.",
          auteurs: "Quentin & Pauline",
          contexte: "May 2025",
        },
        {
          texte:
            "The music was perfect all evening, the dance floor stayed full, and so many of our guests said it was one of the best wedding parties they had ever been to.",
          auteurs: "James",
          contexte: "July 2026",
        },
        {
          texte:
            "DJ Antoine was excellent; he played all the songs we requested and helped officiate the speeches during the dinner. Overall 10/10.",
          auteurs: "Roman",
          contexte: "July 2026",
        },
      ],
    },
    atouts: {
      surtitre: "Why Vauchelles",
      titre: "What makes *the château* special",
      intro: "What we love about Château de Vauchelles, and how we make the most of it.",
      liste: [
        {
          titre: "A classic French château",
          texte: "A 17th and 18th-century house with its grounds and outbuildings: stunning in photos by day, and under the lights at night.",
        },
        {
          titre: "The whole day in one place",
          texte: "Ceremony, drinks, dinner and party on site: no shuttles, and the music follows every moment.",
        },
        {
          titre: "Room to dance",
          texte: "Large rooms with high ceilings: space for a proper dance floor and spectacular lighting.",
        },
        {
          titre: "Your guests stay over",
          texte: "The château sleeps some of your guests: nobody watches the clock or worries about the drive home, and the party is all the better for it.",
        },
        {
          titre: "Between Paris and London",
          texte: "About 1 h 30 from Paris on the A16, on the road to Calais and the Channel Tunnel: ideal for families travelling from the UK.",
        },
        {
          titre: "A team that knows the venue",
          texte: "Eight weddings since 2024: we already know where the sound and lighting work best for every part of your day.",
        },
      ],
    },
    anecdote: {
      surtitre: "Did you know?",
      titre: "The largest cathedral *in France*",
      texte:
        "Half an hour from the château, Amiens Cathedral is the largest Gothic cathedral in France: it is said you could fit Notre-Dame de Paris inside it twice. A UNESCO World Heritage Site, its façade is lit on some evenings in the colours it wore in the Middle Ages. A lovely outing for your guests the day after the wedding.",
    },
    photos: { entete: "soiree-piste-fumee", promesse: "mariage-soiree-regie" },
    appel: {
      titre: "Getting married *at Château de Vauchelles*?",
      texte: "Tell us your date: we reply personally, in English or French.",
      bouton: "Check my date",
    },
  },
});
