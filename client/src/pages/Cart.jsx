import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '../context/CartContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { formatPrice } from '../utils/format.js'
import { TrashIcon } from '../components/icons/index.jsx'

export default function Cart() {
  const { items, updateQuantity, removeItem, totalCents } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()

  if (items.length === 0) {
    return (
      <div>
        <p className="eyebrow">Carrinho</p>
        <h1>O carrinho está vazio</h1>
        <Link to="/" className="btn btn--outline">Ver catálogo</Link>
      </div>
    )
  }

  function handleCheckoutClick() {
    navigate(user ? '/checkout' : '/login?redirect=/checkout')
  }

  return (
    <div className="cart">
      <p className="eyebrow">Carrinho</p>
      <h1>O teu carrinho</h1>

      <ul className="cart__list">
        <AnimatePresence>
          {items.map((item) => (
            <motion.li
              key={item.productId}
              className="cart__item"
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0 }}
              transition={{ duration: 0.25 }}
            >
              <Link to={`/products/${item.slug}`} className="cart__item-thumb">
                {item.imageUrl ? <img src={item.imageUrl} alt="" /> : <div className="product-card__placeholder" />}
              </Link>
              <Link to={`/products/${item.slug}`} className="cart__item-name">
                {item.name}
              </Link>
              <input
                className="input"
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => updateQuantity(item.productId, Number(e.target.value))}
              />
              <span>{formatPrice(item.priceCents * item.quantity)}</span>
              <button
                type="button"
                className="cart__item-remove"
                onClick={() => removeItem(item.productId)}
                aria-label="Remover"
              >
                <TrashIcon />
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      <div className="cart__summary">
        <span className="cart__total-label">Total</span>
        <span className="cart__total-value">{formatPrice(totalCents)}</span>
      </div>

      <button type="button" className="btn btn--block" onClick={handleCheckoutClick}>
        Finalizar compra
      </button>
      <p className="cart__note">O preço final é sempre confirmado no servidor no momento da compra.</p>
    </div>
  )
}
