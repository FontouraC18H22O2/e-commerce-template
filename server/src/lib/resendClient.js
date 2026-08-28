import { Resend } from 'resend'

// Se a chave não estiver definida (ex: ainda não configurámos o Resend),
// deixamos o cliente como null em vez de rebentar o arranque do servidor —
// emailService.js trata esse caso e avisa nos logs, mas o resto da app
// continua a funcionar.
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

export default resend
