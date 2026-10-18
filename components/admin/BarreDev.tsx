/**
 * Monte la DevToolbar en développement seulement. L'import est DANS la
 * condition : au build de production, la condition est fausse à la
 * compilation et le composant n'entre même pas dans le JavaScript envoyé.
 */
export async function BarreDev() {
  if (process.env.NODE_ENV === "development") {
    const { DevToolbar } = await import("./DevToolbar");
    return <DevToolbar />;
  }
  return null;
}
