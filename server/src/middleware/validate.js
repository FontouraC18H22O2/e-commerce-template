// Middleware genérico de validação: recebe um schema Zod e valida req.body
// (ou req.query, para listagens com filtros). Em caso de erro, devolve 400
// com as mensagens do Zod — nunca deixa o pedido chegar ao controller com
// dados por confirmar.
//
// No Express 5, req.query passou a ser só de leitura (não se pode fazer
// req.query = {...}), por isso o resultado validado de "query" fica em
// req.validatedQuery em vez de substituir req.query.
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const input = source === 'query' ? req.query : req.body
    const result = schema.safeParse(input)

    if (!result.success) {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      })
    }

    if (source === 'query') {
      req.validatedQuery = result.data
    } else {
      req.body = result.data
    }
    next()
  }
}
