import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { formatPrice } from '../utils/format.js'

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
}

export default function ProductCard({ product, size }) {
  const image = product.images?.[0]

  return (
    <motion.div variants={item} className={size === 'lg' ? 'product-card-wrap product-card-wrap--lg' : 'product-card-wrap'}>
      <Link to={`/products/${product.slug}`} className="product-card">
        <div className="product-card__image">
          {image ? <img src={image.url} alt={product.name} /> : <div className="product-card__placeholder" />}
          {product.promotion && <span className="promo-badge product-card__badge">-{product.promotion.discountPercent}%</span>}
        </div>
        <p className="product-card__category">{product.category.name}</p>
        <h3 className="product-card__name">{product.name}</h3>
        <div className="price-row">
          <p className="product-card__price">{formatPrice(product.priceCents)}</p>
          {product.compareAtPriceCents && (
            <span className="price-original">{formatPrice(product.compareAtPriceCents)}</span>
          )}
        </div>
      </Link>
    </motion.div>
  )
}
