import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { formatPrice } from '../utils/format.js'

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
}

export default function ProductCard({ product }) {
  return (
    <motion.div variants={item}>
      <Link to={`/products/${product.slug}`} className="product-card">
        <div className="product-card__image">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} />
          ) : (
            <div className="product-card__placeholder" />
          )}
        </div>
        <p className="product-card__category">{product.category.name}</p>
        <h3 className="product-card__name">{product.name}</h3>
        <p className="product-card__price">{formatPrice(product.priceCents)}</p>
      </Link>
    </motion.div>
  )
}
