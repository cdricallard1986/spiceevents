import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { EntreeEnvoiTest, EtatEnvoiTest } from "@/lib/admin/emails-test";
import { EnvoiEmailsTest, type Apercu } from "./EnvoiEmailsTest";
import { FournisseurToasts } from "./Toasts";

afterEach(cleanup);

const apercu = (nom: string): Apercu => ({ subject: `[TEST] ${nom}`, from: "Spice Events <contact@spiceevents.fr>", to: "moi@exemple.fr", replyTo: "moi@exemple.fr", html: `<p>${nom}</p>` });
const APERCUS = {
  "notification-fr": apercu("notif FR"),
  "notification-en": apercu("notif EN"),
  "accuse-fr": apercu("accusé FR"),
  "accuse-en": apercu("accusé EN"),
};
const MODELES = [
  { valeur: "notification" as const, libelle: "Notification à Cédric" },
  { valeur: "accuse" as const, libelle: "Accusé de réception au couple" },
];

function rendre(action: (e: EntreeEnvoiTest) => Promise<EtatEnvoiTest>, resendConfigure = true) {
  return render(
    <FournisseurToasts>
      <EnvoiEmailsTest action={action} destinataire="moi@exemple.fr" resendConfigure={resendConfigure} modeles={MODELES} apercus={APERCUS} />
    </FournisseurToasts>,
  );
}

describe("EnvoiEmailsTest", () => {
  it("affiche le destinataire sans champ de saisie, et l'aperçu dans un cadre sans script", () => {
    rendre(vi.fn());
    expect(screen.getByText("moi@exemple.fr", { selector: "p" })).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).toBeNull();
    const cadre = screen.getByTitle(/Aperçu de l'email/);
    expect(cadre).toHaveAttribute("sandbox", "");
    expect(cadre).toHaveAttribute("srcdoc", "<p>notif FR</p>");
  });

  it("change l'aperçu avec le modèle et la langue, et n'envoie que ces deux choix", async () => {
    const action = vi.fn(async (): Promise<EtatEnvoiTest> => ({ statut: "succes", message: "Email de test envoyé à moi@exemple.fr." }));
    rendre(action);
    fireEvent.change(screen.getByLabelText("Modèle"), { target: { value: "accuse" } });
    fireEvent.change(screen.getByLabelText("Langue de la demande"), { target: { value: "en" } });
    expect(screen.getByTitle(/Aperçu de l'email/)).toHaveAttribute("srcdoc", "<p>accusé EN</p>");
    expect(screen.getByText("[TEST] accusé EN")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Envoyer le test" }));
    await waitFor(() => expect(action).toHaveBeenCalledWith({ modele: "accuse", langue: "en" }));
    await waitFor(() => expect(screen.getAllByText("Email de test envoyé à moi@exemple.fr.").length).toBeGreaterThan(0));
  });

  it("affiche l'erreur de Resend et prévient quand la clé manque", async () => {
    rendre(async () => ({ statut: "erreur", message: "Resend a refusé l'envoi — validation_error : domaine non vérifié" }), false);
    expect(screen.getByText(/est absente de cet environnement Vercel/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Envoyer le test" }));
    await waitFor(() => expect(screen.getAllByRole("alert").some((e) => e.textContent?.includes("validation_error"))).toBe(true));
  });
});
