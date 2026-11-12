/**
 * Logo de Nuvio, la plateforme de préparation des mariages conçue par Spice Events
 * (repris du site nuvio.disco-very.com : le « N » en trois traits dégradés et le nom).
 */
export function LogoNuvio({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-3 font-sans text-3xl font-bold tracking-tight text-ivoire ${className}`}>
      <svg viewBox="0 0 111 76" aria-hidden="true" focusable="false" className="h-[1.1em] w-auto">
        <defs>
          <linearGradient id="nuvio-g" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#fbc8f6" />
            <stop offset="1" stopColor="#a85cf2" />
          </linearGradient>
          <linearGradient id="nuvio-m" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#7a4ff8" />
            <stop offset="1" stopColor="#6247ee" />
          </linearGradient>
          <linearGradient id="nuvio-d" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#8460f2" />
            <stop offset="1" stopColor="#f3dcf9" />
          </linearGradient>
        </defs>
        <g strokeLinecap="round" strokeWidth="23" fill="none">
          <line x1="43" y1="14" x2="69" y2="62" stroke="url(#nuvio-m)" />
          <line x1="16" y1="62" x2="43" y2="14" stroke="url(#nuvio-g)" />
          <line x1="69" y1="62" x2="95" y2="14" stroke="url(#nuvio-d)" />
        </g>
      </svg>
      Nuvio
    </span>
  );
}
