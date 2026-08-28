import resend from '../lib/resendClient.js'

// Remetente por defeito da Resend — funciona sem verificares um domínio
// próprio, mas só entrega para o email com que criaste a conta Resend
// (limitação deles em contas sem domínio verificado). Troca para um
// endereço teu (ex: "Loja <noreply@teudominio.com>") depois de verificares
// um domínio no dashboard da Resend.
const FROM = process.env.RESEND_FROM_EMAIL || 'Loja <onboarding@resend.dev>'

export async function sendPasswordResetEmail(to, resetUrl) {
  if (!resend) {
    // Sem chave configurada: não rebenta o pedido, só avisa — assim dá para
    // testar o resto do fluxo (geração do token, etc.) antes de ligar o
    // Resend a sério.
    console.warn('RESEND_API_KEY não definida — email de reset não enviado. Link:', resetUrl)
    return
  }

  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Repor a tua password',
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto; color: #17151c;">
        <h1 style="font-size: 20px;">Repor a tua password</h1>
        <p>Pediste para repor a password da tua conta na Loja. Clica no botão abaixo para escolheres uma nova password.</p>
        <p style="margin: 32px 0;">
          <a href="${resetUrl}" style="background: #ff5630; color: #fff; padding: 12px 24px; border-radius: 999px; text-decoration: none; font-weight: 600;">
            Repor password
          </a>
        </p>
        <p style="font-size: 13px; color: #6b675e;">Este link expira em 30 minutos. Se não foste tu a pedir isto, ignora este email — a tua password mantém-se inalterada.</p>
      </div>
    `,
  })
}
