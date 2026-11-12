/** Piment stylisé (silhouette du piment du logo), couleur héritée du texte. */
export function Piment({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 48" aria-hidden="true" focusable="false" className={className} fill="currentColor">
      {/* Queue */}
      <path d="M8.6 1.2c1.9 1.6 3.1 3.6 3.6 6.1l-1.9.4c-.4-2-1.3-3.6-2.9-4.9z" />
      {/* Corps, courbé comme celui du logo */}
      <path d="M11 7.4c3.6-.4 6.6 1.6 7.6 5.4 1.3 4.8.4 11.4-2.4 18.1-2.3 5.6-5.7 10.6-9.7 15.2-.5.5-1.3.2-1.2-.5.9-5.9 3.1-10.5 4.3-15.6 1.3-5.3.8-10.4-1.3-14.6C7.2 13 8 7.7 11 7.4z" />
    </svg>
  );
}
