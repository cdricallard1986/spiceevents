"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CLASSES_PILL } from "@/components/common/PillNouvelleVersion";

/**
 * Toasts du back office : messages courts `fixed top-center`, au même style que
 * la pill « Nouvelle version disponible ». Les erreurs restent plus longtemps
 * et sont annoncées immédiatement aux lecteurs d'écran.
 */

export type TypeToast = "succes" | "erreur" | "info";
type Toast = { id: number; message: string; type: TypeToast };

const DUREES: Record<TypeToast, number> = { succes: 4000, info: 5000, erreur: 8000 };
const BORDURES: Record<TypeToast, string> = { succes: "border-or", info: "border-ligne", erreur: "border-erreur" };

type ContexteToasts = { afficher: (message: string, type?: TypeToast) => void };

const Contexte = createContext<ContexteToasts | null>(null);

/** `afficher("Avis publié")`, `afficher("Envoi impossible", "erreur")`. */
export function useToasts(): ContexteToasts {
  const contexte = useContext(Contexte);
  if (!contexte) throw new Error("useToasts doit être utilisé sous <FournisseurToasts>");
  return contexte;
}

export function FournisseurToasts({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const compteur = useRef(0);

  const fermer = useCallback((id: number) => setToasts((liste) => liste.filter((t) => t.id !== id)), []);
  const afficher = useCallback((message: string, type: TypeToast = "succes") => {
    compteur.current += 1;
    const id = compteur.current;
    // Trois au plus à l'écran : les plus anciens laissent la place.
    setToasts((liste) => [...liste.slice(-2), { id, message, type }]);
  }, []);
  const valeur = useMemo(() => ({ afficher }), [afficher]);

  return (
    <Contexte.Provider value={valeur}>
      {children}
      <div className="pointer-events-none fixed left-1/2 top-4 z-[60] flex w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 flex-col items-center gap-2">
        {toasts.map((t) => (
          <ToastUnique key={t.id} toast={t} onFermer={fermer} />
        ))}
      </div>
    </Contexte.Provider>
  );
}

function ToastUnique({ toast, onFermer }: { toast: Toast; onFermer: (id: number) => void }) {
  useEffect(() => {
    const minuteur = window.setTimeout(() => onFermer(toast.id), DUREES[toast.type]);
    return () => window.clearTimeout(minuteur);
  }, [toast, onFermer]);

  return (
    <div
      role={toast.type === "erreur" ? "alert" : "status"}
      className={`${CLASSES_PILL} ${BORDURES[toast.type]} pointer-events-auto flex max-w-full items-start gap-4 rounded-2xl sm:rounded-full`}
    >
      <p className="flex-1">{toast.message}</p>
      <button
        type="button"
        onClick={() => onFermer(toast.id)}
        aria-label="Fermer le message"
        className="text-lg leading-none text-sable hover:text-or"
      >
        ×
      </button>
    </div>
  );
}
