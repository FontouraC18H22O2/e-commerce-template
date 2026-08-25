import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ProductGallery({ images, name }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const active = images[activeIndex]

  return (
    <div className="gallery">
      <div className="gallery__main">
        <AnimatePresence mode="wait">
          {active ? (
            <motion.img
              key={active.id}
              src={active.url}
              alt={name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
          ) : (
            <div className="product-card__placeholder" />
          )}
        </AnimatePresence>
      </div>

      {images.length > 1 && (
        <div className="gallery__thumbs">
          {images.map((image, i) => (
            <button
              key={image.id}
              type="button"
              className={`gallery__thumb ${i === activeIndex ? 'gallery__thumb--active' : ''}`}
              onClick={() => setActiveIndex(i)}
            >
              <img src={image.url} alt={`${name} — vista ${i + 1}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
