import { z } from 'zod'

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Nome demasiado curto').max(100),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  address: z.string().trim().max(200).optional().or(z.literal('')),
  city: z.string().trim().max(100).optional().or(z.literal('')),
  postalCode: z.string().trim().max(20).optional().or(z.literal('')),
  country: z.string().trim().max(100).optional().or(z.literal('')),
})

export const changeEmailSchema = z.object({
  newEmail: z.string().trim().toLowerCase().email('Email inválido'),
  currentPassword: z.string().min(1, 'Password obrigatória'),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Password atual obrigatória'),
  newPassword: z.string().min(8, 'A nova password deve ter pelo menos 8 caracteres').max(200),
})
