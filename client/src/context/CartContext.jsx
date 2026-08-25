import { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react'

const CartContext = createContext(null)
const STORAGE_KEY = 'cart'

// Guardamos aqui um "retrato" do produto (nome, preço, imagem) só para
// mostrar o carrinho sem termos de ir à API a cada render. Nada disto é
// sensível — são dados já públicos no catálogo. O preço REAL é sempre
// recalculado no servidor no momento do checkout; isto é só para o utilizador
// ver o que está a comprar antes disso.
function readInitialCart() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readInitialCart)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // localStorage pode falhar (modo privado, quota excedida) — o carrinho
      // continua a funcionar em memória durante a sessão, só não persiste.
    }
  }, [items])

  const addItem = useCallback((product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id)
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id ? { ...item, quantity: item.quantity + quantity } : item,
        )
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          slug: product.slug,
          priceCents: product.priceCents,
          imageUrl: product.images?.[0]?.url ?? null,
          quantity,
        },
      ]
    })
  }, [])

  const removeItem = useCallback((productId) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId))
  }, [])

  const updateQuantity = useCallback((productId, quantity) => {
    if (quantity < 1) return
    setItems((prev) => prev.map((item) => (item.productId === productId ? { ...item, quantity } : item)))
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const totalCents = useMemo(() => items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0), [items])
  const totalCount = useMemo(() => items.reduce((sum, item) => sum + item.quantity, 0), [items])

  const value = { items, addItem, removeItem, updateQuantity, clear, totalCents, totalCount }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart tem de ser usado dentro de um CartProvider')
  return ctx
}
