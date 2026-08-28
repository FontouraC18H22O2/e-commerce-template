// Schemas de validação de input para autenticação.
// Ficam numa pasta própria (em vez de dentro dos controllers) porque vão
// crescer — teremos schemas equivalentes para produtos, encomendas, etc.,
// e assim ficam todos previsíveis no mesmo sítio.
import { z } from 'zod'

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Nome demasiado curto').max(100),
  email: z.string().trim().toLowerCase().email('Email inválido'),
  // Mínimo de 8 caracteres — mais do que isso (maiúsculas/símbolos obrigatórios)
  // tende a levar os utilizadores a reutilizar padrões previsíveis; o hash
  // forte (argon2) é a proteção real, o mínimo aqui é só para travar passwords
  // triviais como "123456".
  password: z.string().min(8, 'A password deve ter pelo menos 8 caracteres').max(200),
})

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email inválido'),
  password: z.string().min(1, 'Password obrigatória'),
})

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Email inválido'),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token em falta'),
  newPassword: z.string().min(8, 'A password deve ter pelo menos 8 caracteres').max(200),
})
