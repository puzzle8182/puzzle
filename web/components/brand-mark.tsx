export function BrandMark({
  size = 32,
  tone = 'light',
}: {
  size?: number
  /** 'light': nós claros, para usar sobre fundo escuro (sidebar).
   *  'dark': nós escuros, para usar sobre fundo claro (login/cadastro). */
  tone?: 'light' | 'dark'
}) {
  const nodeFill = tone === 'light' ? 'var(--paper)' : 'var(--pine)'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M20 20 L9 13 M20 20 L31 13 M20 20 L20 32"
        stroke="var(--sage)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="9" cy="13" r="3.2" fill={nodeFill} fillOpacity="0.9" />
      <circle cx="31" cy="13" r="3.2" fill={nodeFill} fillOpacity="0.9" />
      <circle cx="20" cy="32" r="3.2" fill={nodeFill} fillOpacity="0.9" />
      <circle cx="20" cy="20" r="4.5" fill="var(--sage)" className="brand-pulse" />
    </svg>
  )
}
