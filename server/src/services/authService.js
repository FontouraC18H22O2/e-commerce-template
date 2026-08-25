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
    phone: user.phone,
    address: user.address,
    city: user.city,
    postalCode: user.postalCode,
    country: user.country,
  }
}

// Campos de perfil "inofensivos" — não passam por password nenhuma,
// porque não dão acesso a mais nada (ao contrário de email/password).
export async function updateProfile(userId, data) {
  // "" nos campos opcionais do formulário vira null na BD, não uma string
  // vazia — mais limpo para as queries e para o frontend distinguir
  // "por preencher" de "preenchido com nada".
  const cleaned = Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, value === '' ? null : value]),
  )

  const user = await prisma.user.update({ where: { id: userId }, data: cleaned })
  return user
}

export async function changeEmail(userId, { newEmail, currentPassword }) {
  const user = await prisma.user.findUnique({ where: { id: userId } })

  const isValid = await argon2.verify(user.passwordHash, currentPassword)
  if (!isValid) {
    throw new AuthError('Password incorreta', 401)
  }

  const existing = await prisma.user.findUnique({ where: { email: newEmail } })
  if (existing && existing.id !== userId) {
    throw new AuthError('Este email já está a ser usado por outra conta', 409)
  }

  return prisma.user.update({ where: { id: userId }, data: { email: newEmail } })
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  const user = await prisma.user.findUnique({ where: { id: userId } })

  const isValid = await argon2.verify(user.passwordHash, currentPassword)
  if (!isValid) {
    throw new AuthError('Password atual incorreta', 401)
  }

  const passwordHash = await argon2.hash(newPassword)
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } })
}
