import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api } from '../services/api.js'
import PasswordInput from '../components/PasswordInput.jsx'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''

  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await api.post('/auth/reset-password', { token, newPassword })
      navigate('/login')
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!token) {
    return (
      <div className="auth-form">
        <p className="form-alert" role="alert">
          Este link não é válido. Pede um novo em "Esqueceste-te da password?".
        </p>
        <p className="auth-form__footer">
          <Link to="/forgot-password">Pedir novo link</Link>
        </p>
      </div>
    )
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
        <h1>Escolhe uma nova password</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="newPassword">Nova password</label>
          <PasswordInput
            id="newPassword"
            className="input"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
        </div>

        {error && <p className="form-alert" role="alert">{error}</p>}

        <button type="submit" className="btn btn--block" disabled={submitting}>
          {submitting ? 'A guardar...' : 'Repor password'}
        </button>
      </form>
    </motion.div>
  )
}
