import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { supabase } from '../lib/supabase'

function LoginPage() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setErro('')
    setCarregando(true)

    const { error } = await supabase.auth.signInWithPassword({
  email,
  password: senha,
})

    if (error) {
      setErro(error.message)
    }

    setCarregando(false)
  }

  function handleEmailChange(event: ChangeEvent<HTMLInputElement>) {
    setEmail(event.currentTarget.value)
  }

  function handleSenhaChange(event: ChangeEvent<HTMLInputElement>) {
    setSenha(event.currentTarget.value)
  }

  return (
    <main className="login-page">
      <section aria-labelledby="login-title" className="login-card">
        <header className="login-header">
          <span aria-hidden="true" className="login-brand-mark">
            IM
          </span>
          <div>
            <h1 id="login-title">InflowMarket</h1>
            <p>Gestão simples para o seu negócio.</p>
          </div>
        </header>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="login-field">
            <label htmlFor="email">E-mail</label>

            <input
              autoComplete="username"
              id="email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              required
            />
          </div>

          <div className="login-field">
            <label htmlFor="senha">Senha</label>

            <input
              autoComplete="current-password"
              id="senha"
              type="password"
              value={senha}
              onChange={handleSenhaChange}
              required
            />
          </div>

          <button className="login-submit" type="submit" disabled={carregando}>
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>

          {erro && (
            <p className="login-error" role="alert">
              {erro}
            </p>
          )}
        </form>
      </section>
    </main>
  )
}

export default LoginPage