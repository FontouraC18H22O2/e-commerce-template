// Handler de erros centralizado. Tem de ser o último middleware montado no app.
// Nunca expõe stack traces nem detalhes internos ao cliente — só regista no
// servidor (console, por agora) e devolve uma mensagem genérica.
export function errorHandler(err, req, res, _next) {
  console.error(err)

  const status = err.status ?? 500
  const message = status < 500 ? err.message : 'Erro interno do servidor'

  res.status(status).json({ error: message })
}

export function notFoundHandler(req, res) {
  res.status(404).json({ error: 'Rota não encontrada' })
}
