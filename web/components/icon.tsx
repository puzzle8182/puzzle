import type { SVGProps } from 'react'

const base = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export function Icon({
  name,
  ...props
}: { name: string } & SVGProps<SVGSVGElement>) {
  switch (name) {
    case 'home':
      return (
        <svg {...base} {...props}>
          <path d="M3 11.5 12 4l9 7.5" />
          <path d="M5.5 10v9a1 1 0 0 0 1 1H9a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-9" />
        </svg>
      )
    case 'users':
      return (
        <svg {...base} {...props}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3.5 20a5.5 5.5 0 0 1 11 0" />
          <circle cx="17" cy="9" r="2.5" />
          <path d="M15.5 13a4.5 4.5 0 0 1 5.2 4.4" />
        </svg>
      )
    case 'calendar':
      return (
        <svg {...base} {...props}>
          <rect x="3.5" y="5" width="17" height="16" rx="2" />
          <path d="M3.5 10h17M8 3v4M16 3v4" />
        </svg>
      )
    case 'file':
      return (
        <svg {...base} {...props}>
          <path d="M6.5 3h8l5 5v13a1 1 0 0 1-1 1h-12a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
          <path d="M14 3v5h5M9 13h6M9 17h6" />
        </svg>
      )
    case 'chart':
      return (
        <svg {...base} {...props}>
          <path d="M4 20V10M11 20V4M18 20v-7" />
          <path d="M2.5 20.5h19" />
        </svg>
      )
    case 'card':
      return (
        <svg {...base} {...props}>
          <rect x="3" y="6" width="18" height="13" rx="2" />
          <path d="M3 10.5h18M7 15h4" />
        </svg>
      )
    case 'search':
      return (
        <svg {...base} {...props}>
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m20 20-4.3-4.3" />
        </svg>
      )
    case 'settings':
      return (
        <svg {...base} {...props}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 13a7.9 7.9 0 0 0 0-2l2-1.5-2-3.4-2.4.6a8 8 0 0 0-1.7-1L15 3h-4l-.3 2.7a8 8 0 0 0-1.7 1l-2.4-.6-2 3.4L6.6 11a7.9 7.9 0 0 0 0 2l-2 1.5 2 3.4 2.4-.6a8 8 0 0 0 1.7 1L11 21h4l.3-2.7a8 8 0 0 0 1.7-1l2.4.6 2-3.4Z" />
        </svg>
      )
    default:
      return null
  }
}
