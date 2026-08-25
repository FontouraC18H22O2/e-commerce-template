import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Home from './pages/Home.jsx'
import ProductDetail from './pages/ProductDetail.jsx'
import Cart from './pages/Cart.jsx'
import Checkout from './pages/Checkout.jsx'
import OrderConfirmation from './pages/OrderConfirmation.jsx'
import Orders from './pages/Orders.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'

// Transição de página discreta — fade + leve deslocamento vertical.
// AnimatePresence precisa de uma "key" que mude por rota (location.pathname)
// para saber quando animar a saída da página antiga e a entrada da nova.
function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  )
}

function App() {
  const location = useLocation()

  return (
    <>
      <Navbar />
      <main className="page">
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<PageTransition><Home /></PageTransition>} />
            <Route path="/products/:slug" element={<PageTransition><ProductDetail /></PageTransition>} />
            <Route path="/cart" element={<PageTransition><Cart /></PageTransition>} />
            <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
            <Route path="/register" element={<PageTransition><Register /></PageTransition>} />
            <Route
              path="/checkout"
              element={
                <PageTransition>
                  <ProtectedRoute>
                    <Checkout />
                  </ProtectedRoute>
                </PageTransition>
              }
            />
            <Route path="/orders/confirmation" element={<PageTransition><OrderConfirmation /></PageTransition>} />
            <Route
              path="/orders"
              element={
                <PageTransition>
                  <ProtectedRoute>
                    <Orders />
                  </ProtectedRoute>
                </PageTransition>
              }
            />
          </Routes>
        </AnimatePresence>
      </main>
      <Footer />
    </>
  )
}

export default App
