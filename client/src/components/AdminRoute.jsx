import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

// Isto é só uma conveniência de UX (esconder a página de quem não devia lá
// estar) — a proteção a sério está no servidor (requireAdmin em cada rota
// /api/admin/*), que é o único sítio onde a verificação não pode ser
// contornada por quem souber abrir as devtools.
export default function AdminRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <p>A verificar sessão...</p>

  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />
  }

  if (user.role !== 'ADMIN') {
    return <p className="form-alert" role="alert">Acesso restrito a administradores.</p>
  }

  return children
}
