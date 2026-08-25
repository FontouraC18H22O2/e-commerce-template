const API_URL = import.meta.env.VITE_API_URL

class ApiError extends Error {
  constructor(message, status, details) {
    super(message)
    this.status = status
    this.details = details
  }
}

// Wrapper único para todos os pedidos à API. `credentials: 'include'` é
// obrigatório aqui — é o que faz o cookie de sessão (HttpOnly) viajar em
// cada pedido, mesmo com frontend e backend em portas/domínios diferentes.
async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  // 204 No Content não tem corpo para fazer parse.
  const data = res.status === 204 ? null : await res.json().catch(() => null)

  if (!res.ok) {
    throw new ApiError(data?.error || 'Erro de comunicação com o servidor', res.status, data?.details)
  }

  return data
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' }),
}

export { ApiError }
