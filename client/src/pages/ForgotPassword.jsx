import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api } from '../services/api.js'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await api.post('/auth/forgot-password', { email })
      // A resposta é sempre a mesma quer o email exista quer não — de
      // propósito, para não revelar quais contas existem.
      setSubmitted(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <motion.div
      className="auth-form"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="auth-form__header">
        <p className="eyebrow">Conta</p>
        <h1>Esqueceste-te da password?</h1>
        <p>Indica o teu email e enviamos-te um link para escolheres uma nova.</p>
      </div>

      {submitted ? (
        <p className="profile__success">
          Se existir uma conta com esse email, foi enviado um link de recuperação. Verifica a caixa de entrada
          (e o spam).
        </p>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              className="input"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {error && <p className="form-alert" role="alert">{error}</p>}

          <button type="submit" className="btn btn--block" disabled={submitting}>
            {submitting ? 'A enviar...' : 'Enviar link de recuperação'}
          </button>
        </form>
      )}

      <p className="auth-form__footer">
        <Link to="/login">Voltar ao login</Link>
      </p>
    </motion.div>
  )
}
