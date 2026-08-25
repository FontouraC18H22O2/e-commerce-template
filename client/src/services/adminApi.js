import { api } from './api.js'

const API_URL = import.meta.env.VITE_API_URL

// --- produtos ---

export const listAdminProducts = () => api.get('/admin/products')
export const getAdminProduct = (id) => api.get(`/admin/products/${id}`)
export const createAdminProduct = (data) => api.post('/admin/products', data)
export const updateAdminProduct = (id, data) => api.put(`/admin/products/${id}`, data)
export const deleteAdminProduct = (id) => api.delete(`/admin/products/${id}`)

export const reorderProductImages = (productId, imageIds) =>
  api.put(`/admin/products/${productId}/images/order`, { imageIds })

export const deleteProductImage = (productId, imageId) =>
  api.delete(`/admin/products/${productId}/images/${imageId}`)

// Upload é multipart/form-data — não passa pelo wrapper `api` genérico
// (que assume sempre JSON), por isso fala com fetch diretamente aqui.
export async function uploadProductImage(productId, file) {
  const formData = new FormData()
  formData.append('image', file)

  const res = await fetch(`${API_URL}/admin/products/${productId}/images`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const err = new Error(data?.error || 'Erro ao enviar imagem')
    err.status = res.status
    throw err
  }
  return data
}

// --- promoções ---

export const listAdminPromotions = () => api.get('/admin/promotions')
export const createAdminPromotion = (data) => api.post('/admin/promotions', data)
export const updateAdminPromotion = (id, data) => api.put(`/admin/promotions/${id}`, data)
export const deleteAdminPromotion = (id) => api.delete(`/admin/promotions/${id}`)

// --- encomendas ---

export const listAdminOrders = () => api.get('/admin/orders')
export const updateOrderStatus = (id, status) => api.patch(`/admin/orders/${id}/status`, { status })
