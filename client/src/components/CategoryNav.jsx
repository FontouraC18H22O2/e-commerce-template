import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../services/api.js'

export default function CategoryNav() {
  const [categories, setCategories] = useState([])
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    api.get('/categories').then((data) => setCategories(data.categories))
  }, [])

  // Fecha o dropdown ao clicar fora dele.
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="category-nav" ref={containerRef}>
      <button
        type="button"
        className="navbar__link category-nav__trigger"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        Categorias
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="category-nav__menu"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            {categories.map((cat) => (
              <Link key={cat.id} to={`/?category=${cat.slug}`} className="category-nav__item" onClick={() => setOpen(false)}>
                {cat.name}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
