import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { api } from '../services/api.js'
import ProductCard from './ProductCard.jsx'

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

export default function FeaturedSection() {
  const [products, setProducts] = useState([])

  useEffect(() => {
    api.get('/products/featured').then((data) => setProducts(data.products))
  }, [])

  if (products.length === 0) return null

  return (
    <section className="featured">
      <div className="featured__header">
        <div>
          <p className="eyebrow">Em destaque</p>
          <h2>Escolhidos para ti</h2>
        </div>
      </div>
      <motion.div className="featured__scroll" variants={gridVariants} initial="hidden" animate="show">
        {products.map((product, i) => (
          <ProductCard key={product.id} product={product} size={i === 0 ? 'lg' : undefined} />
        ))}
      </motion.div>
    </section>
  )
}
