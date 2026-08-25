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

export function TrashIcon(props) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...props}>
      <path d="M4 7h16M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2m2 0-.8 12.2a2 2 0 0 1-2 1.8H8.8a2 2 0 0 1-2-1.8L6 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
