import argon2 from 'argon2'
import prisma from '../lib/prismaClient.js'

// Erro de negócio simples, com status HTTP associado — o errorHandler
// central sabe usar err.status para decidir o código de resposta.
class AuthError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

export async function registerUser({ name, email, password }) {
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    // Mensagem deliberadamente genérica: não confirmamos se o email já existe
    // por essa via, para não facilitar enumeração de contas registadas.
    throw new AuthError('Não foi possível concluir o registo', 409)
  }

  const passwordHash = await argon2.hash(password)

  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  })

  return user
}

export async function verifyCredentials({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } })

  // Mesma mensagem quer o email não exista, quer a password esteja errada —
  // impede um atacante de descobrir quais emails estão registados.
  if (!user) {
    throw new AuthError('Email ou password incorretos', 401)
  }

  const isValid = await argon2.verify(user.passwordHash, password)
  if (!isValid) {
    throw new AuthError('Email ou password incorretos', 401)
  }

  return user
}

export function toPublicUser(user) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  }
}
