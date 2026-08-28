import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { BagIcon } from './icons/index.jsx'
import CategoryNav from './CategoryNav.jsx'
import SearchBar from './SearchBar.jsx'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { totalCount } = useCart()
  const navigate = useNavigate()
  const location = useLocation()

  // No login/registo não faz sentido pesquisar ou navegar por categorias —
  // fica só o logótipo, como forma simples de voltar à home.
  const authPages = ['/login', '/register', '/forgot-password', '/reset-password']
  const isAuthPage = authPages.includes(location.pathname)

  async function handleLogout() {
    await logout()
    navigate('/')
  }

  return (
    <header className="navbar">
      <div className="navbar__left">
        <Link to="/" className="navbar__logo">
          Loja
        </Link>
        {!isAuthPage && <CategoryNav />}
      </div>

      {!isAuthPage && <SearchBar />}

      <nav className="navbar__links">
        <Link to="/cart" className="navbar__link">
          <BagIcon />
          <AnimatePresence>
            {totalCount > 0 && (
              <motion.span
                key={totalCount}
                className="navbar__badge"
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.4, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                {totalCount}
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        {user ? (
          <>
            <Link to="/orders" className="navbar__link">
              Encomendas
            </Link>
            {user.role === 'ADMIN' && (
              <Link to="/admin" className="navbar__link">
                Painel admin
              </Link>
            )}
            <Link to="/profile" className="navbar__user">
              Olá, {user.name}
            </Link>
            <button type="button" className="btn--text" onClick={handleLogout}>
              Sair
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="navbar__link">
              Entrar
            </Link>
            <Link to="/register" className="btn btn--outline">
              Criar conta
            </Link>
          </>
        )}
      </nav>
    </header>
  )
}
