import prisma from '../lib/prismaClient.js'
import {
  registerUser,
  verifyCredentials,
  toPublicUser,
  updateProfile,
  changeEmail,
  changePassword,
  requestPasswordReset,
  resetPassword,
} from '../services/authService.js'

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

// O /me devolve só os campos cacheados na sessão (rápido, sem ir à BD) —
// para os dados completos do perfil (morada, telefone...), o /profile
// abaixo vai mesmo à BD, porque esses campos não vivem na sessão.
export async function getProfile(req, res, next) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.session.userId } })
    res.json({ user: toPublicUser(user) })
  } catch (err) {
    next(err)
  }
}

export async function putProfile(req, res, next) {
  try {
    const user = await updateProfile(req.session.userId, req.body)
    req.session.name = user.name
    res.json({ user: toPublicUser(user) })
  } catch (err) {
    next(err)
  }
}

export async function putEmail(req, res, next) {
  try {
    const user = await changeEmail(req.session.userId, req.body)
    req.session.email = user.email
    res.json({ user: toPublicUser(user) })
  } catch (err) {
    next(err)
  }
}

export async function putPassword(req, res, next) {
  try {
    await changePassword(req.session.userId, req.body)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
}

export async function forgotPassword(req, res, next) {
  try {
    await requestPasswordReset(req.body.email)
    // Mesma resposta quer o email exista quer não — só quem tem acesso à
    // caixa de correio é que sabe se recebeu alguma coisa.
    res.json({ message: 'Se existir uma conta com esse email, foi enviado um link de recuperação.' })
  } catch (err) {
    next(err)
  }
}

export async function postResetPassword(req, res, next) {
  try {
    await resetPassword(req.body.token, req.body.newPassword)
    res.status(204).end()
  } catch (err) {
    next(err)
  }
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
