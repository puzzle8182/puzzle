export function HeroNetwork() {
  return (
    <svg
      viewBox="0 0 420 420"
      className="w-full max-w-md mx-auto"
      role="img"
      aria-label="Diagrama mostrando empresa, colaborador e psicólogo conectados pela plataforma"
    >
      {/* linhas de conexão */}
      <path
        d="M210 210 L82 118 M210 210 L338 118 M210 210 L210 348"
        stroke="var(--sage)"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* fluxo financeiro (assinatura), sutilmente pontilhado, node psicólogo -> centro */}
      <path
        d="M330 130 L222 202"
        stroke="var(--amber)"
        strokeWidth="1.5"
        strokeDasharray="1 6"
        strokeLinecap="round"
        fill="none"
      />

      {/* nó: empresa */}
      <g>
        <circle cx="82" cy="118" r="34" fill="var(--paper)" stroke="var(--pine)" strokeWidth="1.5" />
        <path
          d="M70 128V106a1 1 0 0 1 1-1h10v6h6a1 1 0 0 1 1 1v16"
          stroke="var(--pine)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        <text x="82" y="168" textAnchor="middle" fontSize="13" fill="var(--ink)" fontFamily="var(--font-inter)">
          Empresa
        </text>
      </g>

      {/* nó: colaborador */}
      <g>
        <circle cx="338" cy="118" r="34" fill="var(--paper)" stroke="var(--pine)" strokeWidth="1.5" />
        <circle cx="338" cy="110" r="6" stroke="var(--pine)" strokeWidth="1.5" fill="none" />
        <path
          d="M326 130a12 12 0 0 1 24 0"
          stroke="var(--pine)"
          strokeWidth="1.5"
          strokeLinecap="round"
          fill="none"
        />
        <text x="338" y="168" textAnchor="middle" fontSize="13" fill="var(--ink)" fontFamily="var(--font-inter)">
          Colaborador
        </text>
      </g>

      {/* nó: psicólogo */}
      <g>
        <circle cx="210" cy="348" r="34" fill="var(--paper)" stroke="var(--pine)" strokeWidth="1.5" />
        <path
          d="M198 340v-8a12 12 0 0 1 24 0v8a12 6 0 0 1-24 0Z"
          stroke="var(--pine)"
          strokeWidth="1.5"
          strokeLinejoin="round"
          fill="none"
        />
        <text x="210" y="398" textAnchor="middle" fontSize="13" fill="var(--ink)" fontFamily="var(--font-inter)">
          Psicólogo
        </text>
      </g>

      {/* centro: plataforma */}
      <circle cx="210" cy="210" r="30" fill="var(--pine)" />
      <circle cx="210" cy="210" r="30" fill="var(--sage)" opacity="0.5" className="brand-pulse" />
      <text
        x="210"
        y="215"
        textAnchor="middle"
        fontSize="11.5"
        fill="var(--paper)"
        fontFamily="var(--font-inter)"
        fontWeight={500}
      >
        Plataforma
      </text>
    </svg>
  )
}
