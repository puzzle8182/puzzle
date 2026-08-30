#!/bin/bash
set -e

echo "Corrigindo components/brand-mark.tsx..."
cat > components/brand-mark.tsx << 'ENDOFFILE'
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
ENDOFFILE

echo "Ajustando login/page.tsx para usar tone='dark'..."
sed -i '' 's/<BrandMark size={40} \/>/<BrandMark size={40} tone="dark" \/>/' app/login/page.tsx

echo "Ajustando cadastro/page.tsx para usar tone='dark'..."
sed -i '' 's/<BrandMark size={40} \/>/<BrandMark size={40} tone="dark" \/>/g' app/cadastro/page.tsx

echo ""
echo "Correção aplicada."
