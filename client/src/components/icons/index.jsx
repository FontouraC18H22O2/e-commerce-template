// Ícones SVG inline, em vez de emojis ou de uma biblioteca externa — leves,
// herdam a cor do texto (currentColor) e não pedem um pedido de rede extra.

export function BagIcon(props) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <path d="M7 9V7a5 5 0 0 1 10 0v2" strokeLinecap="round" />
      <path d="M5.2 9h13.6l-1.1 10.4a2 2 0 0 1-2 1.8H8.3a2 2 0 0 1-2-1.8L5.2 9Z" strokeLinejoin="round" />
    </svg>
  )
}

export function UserIcon(props) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5 20c1.2-3.6 4-5.6 7-5.6s5.8 2 7 5.6" strokeLinecap="round" />
    </svg>
  )
}

export function SearchIcon(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M20 20l-4.5-4.5" strokeLinecap="round" />
    </svg>
  )
}

export function ArrowRightIcon(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function EyeIcon(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

export function EyeOffIcon(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <path d="M3 3l18 18" strokeLinecap="round" />
      <path d="M10.6 5.2A10.9 10.9 0 0 1 12 5c6.4 0 10 7 10 7a15.5 15.5 0 0 1-3.6 4.3M6.5 6.6C3.7 8.3 2 12 2 12s3.6 7 10 7a9.9 9.9 0 0 0 3.1-.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9.9 10a3 3 0 0 0 4.1 4.1" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function TrashIcon(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m2 0-.8 12.2a2 2 0 0 1-2 1.8H8.8a2 2 0 0 1-2-1.8L6 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function PencilIcon(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5.5 16a1 1 0 0 0-.3.5L4 20Z" strokeLinejoin="round" />
      <path d="M13.5 8l2.5 2.5" strokeLinecap="round" />
    </svg>
  )
}

export function BoxIcon(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <path d="M3.5 8.5 12 4l8.5 4.5M3.5 8.5 12 13m-8.5-4.5v8L12 21m0-8v8m0-8 8.5-4.5m-8.5 12.5 8.5-4.5v-8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function TagIcon(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <path d="M12.5 3.5H6a2.5 2.5 0 0 0-2.5 2.5v6.5L13 22l9-9-9.5-9.5Z" strokeLinejoin="round" />
      <circle cx="8" cy="8" r="1.4" />
    </svg>
  )
}

export function ReceiptIcon(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <path d="M6 3h12v18l-2.5-1.6L13 21l-2.5-1.6L8 21l-2-1.6V3Z" strokeLinejoin="round" />
      <path d="M9 8h6M9 12h6M9 16h4" strokeLinecap="round" />
    </svg>
  )
}

export function GridIcon(props) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  )
}
