import { registerUser, verifyCredentials, toPublicUser } from '../services/authService.js'

export async function register(req, res, next) {
  try {
    const user = await registerUser(req.body)
    await startSession(req, user)
    res.status(201).json({ user: toPublicUser(user) })
  } catch (err) {
    next(err)
  }
}

export async function login(req, res, next) {
  try {
    const user = await verifyCredentials(req.body)
    await startSession(req, user)
    res.json({ user: toPublicUser(user) })
  } catch (err) {
    next(err)
  }
}

export function logout(req, res, next) {
  req.session.destroy((err) => {
    if (err) return next(err)
    res.clearCookie('sid')
    res.status(204).end()
  })
}

export function me(req, res) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Sem sessão iniciada' })
  }
  res.json({
    user: {
      id: req.session.userId,
      name: req.session.name,
      email: req.session.email,
      role: req.session.role,
    },
  })
}

// Regenera o id de sessão antes de a preencher — evita "session fixation"
// (um atacante fixar um id de sessão antes do login e reutilizá-lo depois).
// Devolve uma Promise para o controller poder esperar que a sessão esteja
// mesmo escrita antes de responder ao cliente.
function startSession(req, user) {
  return new Promise((resolve, reject) => {
    req.session.regenerate((err) => {
      if (err) return reject(err)
      req.session.userId = user.id
      req.session.name = user.name
      req.session.email = user.email
      req.session.role = user.role
      req.session.save((saveErr) => {
        if (saveErr) return reject(saveErr)
        resolve()
      })
    })
  })
}
