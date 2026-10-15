export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`font-display tracking-[0.18em] ${className}`}>
      SPICE<span className="text-or">·</span>EVENTS
    </span>
  );
}
