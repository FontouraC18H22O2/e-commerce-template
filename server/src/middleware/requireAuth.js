// Protege rotas que exigem sessão iniciada.
export function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Precisas de iniciar sessão' })
  }
  next()
}

// Protege rotas de administração. Assume-se que requireAuth já correu antes
// (ou seja: primeiro confirmamos que há sessão, só depois olhamos para o role).
export function requireAdmin(req, res, next) {
  if (req.session.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Acesso restrito a administradores' })
  }
  next()
}
