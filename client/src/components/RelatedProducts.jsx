import { motion } from 'framer-motion'
import ProductCard from './ProductCard.jsx'

const gridVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

export default function RelatedProducts({ products }) {
  if (!products || products.length === 0) return null

  return (
    <section className="related">
      <div className="related__header">
        <p className="eyebrow">Também pode interessar-te</p>
        <h2>Produtos relacionados</h2>
      </div>
      <motion.div className="home__grid" variants={gridVariants} initial="hidden" animate="show">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </motion.div>
    </section>
  )
}
