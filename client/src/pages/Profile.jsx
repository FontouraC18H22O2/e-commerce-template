import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { api } from '../services/api.js'
import { useAuth } from '../context/AuthContext.jsx'

const emptyProfile = { name: '', phone: '', address: '', city: '', postalCode: '', country: '' }

export default function Profile() {
  const { updateUser } = useAuth()

  const [profile, setProfile] = useState(emptyProfile)
  const [loading, setLoading] = useState(true)
  const [profileError, setProfileError] = useState(null)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)

  const [email, setEmail] = useState('')
  const [emailPassword, setEmailPassword] = useState('')
  const [emailError, setEmailError] = useState(null)
  const [emailSuccess, setEmailSuccess] = useState(false)
  const [savingEmail, setSavingEmail] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordError, setPasswordError] = useState(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    api
      .get('/auth/profile')
      .then((data) => {
        const u = data.user
        setProfile({
          name: u.name ?? '',
          phone: u.phone ?? '',
          address: u.address ?? '',
          city: u.city ?? '',
          postalCode: u.postalCode ?? '',
          country: u.country ?? '',
        })
        setEmail(u.email)
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleProfileSubmit(e) {
    e.preventDefault()
    setSavingProfile(true)
    setProfileError(null)
    setProfileSuccess(false)
    try {
      const { user } = await api.put('/auth/profile', profile)
      updateUser({ name: user.name })
      setProfileSuccess(true)
    } catch (err) {
      setProfileError(err.message)
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleEmailSubmit(e) {
    e.preventDefault()
    setSavingEmail(true)
    setEmailError(null)
    setEmailSuccess(false)
    try {
      const { user } = await api.put('/auth/email', { newEmail: email, currentPassword: emailPassword })
      updateUser({ email: user.email })
      setEmailPassword('')
      setEmailSuccess(true)
    } catch (err) {
      setEmailError(err.message)
    } finally {
      setSavingEmail(false)
    }
  }

  async function handlePasswordSubmit(e) {
    e.preventDefault()
    setSavingPassword(true)
    setPasswordError(null)
    setPasswordSuccess(false)
    try {
      await api.put('/auth/password', { currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setPasswordSuccess(true)
    } catch (err) {
      setPasswordError(err.message)
    } finally {
      setSavingPassword(false)
    }
  }

  if (loading) return <p style={{ color: 'var(--color-ink-soft)' }}>A carregar...</p>

  return (
    <div className="profile">
      <p className="eyebrow">Conta</p>
      <h1>O meu perfil</h1>

      <motion.section
        className="profile__section"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <h2>Dados pessoais</h2>
        <form onSubmit={handleProfileSubmit} className="admin-form">
          <div className="field">
            <label htmlFor="name">Nome</label>
            <input
              id="name"
              className="input"
              required
              value={profile.name}
              onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="phone">Telemóvel</label>
            <input
              id="phone"
              className="input"
              value={profile.phone}
              onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
            />
          </div>
          <div className="field">
            <label htmlFor="address">Morada</label>
            <input
              id="address"
              className="input"
              value={profile.address}
              onChange={(e) => setProfile((p) => ({ ...p, address: e.target.value }))}
            />
          </div>
          <div className="admin-form__row">
            <div className="field">
              <label htmlFor="city">Cidade</label>
              <input
                id="city"
                className="input"
                value={profile.city}
                onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value }))}
              />
            </div>
            <div className="field">
              <label htmlFor="postalCode">Código postal</label>
              <input
                id="postalCode"
                className="input"
                value={profile.postalCode}
                onChange={(e) => setProfile((p) => ({ ...p, postalCode: e.target.value }))}
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="country">País</label>
            <input
              id="country"
              className="input"
              value={profile.country}
              onChange={(e) => setProfile((p) => ({ ...p, country: e.target.value }))}
            />
          </div>

          {profileError && <p className="form-alert" role="alert">{profileError}</p>}
          {profileSuccess && <p className="profile__success">Dados guardados.</p>}

          <button type="submit" className="btn" disabled={savingProfile}>
            {savingProfile ? 'A guardar...' : 'Guardar alterações'}
          </button>
        </form>
      </motion.section>

      <motion.section
        className="profile__section"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
      >
        <h2>Email</h2>
        <form onSubmit={handleEmailSubmit} className="admin-form">
          <div className="field">
            <label htmlFor="email">Novo email</label>
            <input id="email" className="input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="emailPassword">Password atual (para confirmar)</label>
            <input
              id="emailPassword"
              className="input"
              type="password"
              required
              value={emailPassword}
              onChange={(e) => setEmailPassword(e.target.value)}
            />
          </div>

          {emailError && <p className="form-alert" role="alert">{emailError}</p>}
          {emailSuccess && <p className="profile__success">Email atualizado.</p>}

          <button type="submit" className="btn" disabled={savingEmail}>
            {savingEmail ? 'A guardar...' : 'Alterar email'}
          </button>
        </form>
      </motion.section>

      <motion.section
        className="profile__section"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
      >
        <h2>Password</h2>
        <form onSubmit={handlePasswordSubmit} className="admin-form">
          <div className="field">
            <label htmlFor="currentPassword">Password atual</label>
            <input
              id="currentPassword"
              className="input"
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="newPassword">Nova password</label>
            <input
              id="newPassword"
              className="input"
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          {passwordError && <p className="form-alert" role="alert">{passwordError}</p>}
          {passwordSuccess && <p className="profile__success">Password alterada.</p>}

          <button type="submit" className="btn" disabled={savingPassword}>
            {savingPassword ? 'A guardar...' : 'Alterar password'}
          </button>
        </form>
      </motion.section>
    </div>
  )
}
