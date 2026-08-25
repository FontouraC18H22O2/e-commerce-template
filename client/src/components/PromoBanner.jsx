import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api } from '../services/api.js'

export default function PromoBanner() {
  const [promotions, setPromotions] = useState([])

  useEffect(() => {
    api.get('/promotions').then((data) => setPromotions(data.promotions))
  }, [])

  if (promotions.length === 0) return null

  // Mostra sempre a promoção com maior desconto — é a que mais interessa
  // destacar. As restantes continuam visíveis nos produtos a que se aplicam.
  const promo = promotions[0]

  return (
    <motion.div
      className="promo-banner"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div>
        <p className="promo-banner__title">{promo.name}</p>
        <p className="promo-banner__text">
          {promo.description || `${promo.discountPercent}% de desconto`}
          {promo.category && ` — categoria ${promo.category.name}`}
        </p>
      </div>
      {promo.category ? (
        <Link to={`/?category=${promo.category.slug}`} className="btn btn--outline">
          Ver produtos
        </Link>
      ) : (
        <Link to="/" className="btn btn--outline">
          Ver catálogo
        </Link>
      )}
    </motion.div>
  )
}
