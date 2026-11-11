import type { QuestionReponse } from "@/contenu/types";

/** Questions dépliables, accessibles au clavier sans JavaScript. `ouvertes` : toutes dépliées (résultats d'une recherche). */
export function Faq({ questions, ouvertes = false }: { questions: QuestionReponse[]; ouvertes?: boolean }) {
  return (
    <div className="divide-y divide-ligne border-y border-ligne">
      {questions.map((q) => (
        <details key={q.question} className="group" open={ouvertes || undefined}>
          <summary className="flex cursor-pointer list-none items-start justify-between gap-6 py-6 text-lg font-medium marker:hidden [&::-webkit-details-marker]:hidden">
            <span>{q.question}</span>
            <span aria-hidden="true" className="mt-1 text-2xl leading-none text-or transition-transform group-open:rotate-45">+</span>
          </summary>
          <p className="max-w-3xl pb-7 text-sable">{q.reponse}</p>
        </details>
      ))}
    </div>
  );
}
