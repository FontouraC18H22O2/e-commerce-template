import { useState } from 'react'
import { EyeIcon, EyeOffIcon } from './icons/index.jsx'

// Input de password com um botão de mostrar/ocultar — evita reescrever o
// mesmo padrão (estado local do tipo do input + ícone) em cada formulário.
// Aceita as mesmas props que um <input>, exceto "type" (é sempre gerido
// por aqui).
export default function PasswordInput({ id, className, ...props }) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="password-input">
      <input id={id} type={visible ? 'text' : 'password'} className={className} {...props} />
      <button
        type="button"
        className="password-input__toggle"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Ocultar password' : 'Mostrar password'}
        tabIndex={-1}
      >
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  )
}
