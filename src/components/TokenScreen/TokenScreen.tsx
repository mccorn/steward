import { FormEvent, useState } from 'react'
import './TokenScreen.css'

type TokenScreenProps = {
  onSubmit: (token: string) => void
}

export function TokenScreen({ onSubmit }: TokenScreenProps) {
  const [value, setValue] = useState('')

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const token = value.trim()
    if (!token) return
    onSubmit(token)
  }

  return (
    <form className="TokenScreen" onSubmit={handleSubmit}>
      <h1>Steward</h1>
      <p>Введите ключ доступа к серверу</p>
      <input
        type="password"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        autoComplete="current-password"
      />
      <button type="submit">Войти</button>
    </form>
  )
}
