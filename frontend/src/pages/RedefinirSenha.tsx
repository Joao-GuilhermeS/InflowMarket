import { useState, type FormEvent } from 'react'
import { ArrowRight, LockKeyhole } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function RedefinirSenha() {
  const [senha, setSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErro('')

    if (senha !== confirmacao) {
      setErro('As senhas digitadas não correspondem.')
      return
    }

    setCarregando(true)

    try {
      const { error } = await supabase.auth.updateUser({ password: senha })

      if (error) {
        setErro(error.message)
        return
      }

      navigate('/', { replace: true })
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível redefinir sua senha. Tente novamente.',
      )
    } finally {
      setCarregando(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f8faf9] px-6 py-10">
      <section
        aria-labelledby="reset-password-title"
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-xl shadow-emerald-950/5 sm:p-9"
      >
        <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <LockKeyhole size={23} aria-hidden="true" />
        </div>
        <h1
          id="reset-password-title"
          className="text-2xl font-bold tracking-tight text-slate-900"
        >
          Redefina sua senha
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Escolha uma nova senha para voltar a acessar sua conta.
        </p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="nova-senha"
              className="text-sm font-semibold text-slate-700"
            >
              Nova senha
            </label>
            <input
              id="nova-senha"
              type="password"
              autoComplete="new-password"
              required
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="confirmacao-senha"
              className="text-sm font-semibold text-slate-700"
            >
              Confirme a nova senha
            </label>
            <input
              id="confirmacao-senha"
              type="password"
              autoComplete="new-password"
              required
              value={confirmacao}
              onChange={(event) => setConfirmacao(event.target.value)}
              className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"
            />
          </div>

          {erro && (
            <p
              role="alert"
              className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800"
            >
              {erro}
            </p>
          )}

          <button
            type="submit"
            disabled={carregando}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 px-5 text-sm font-semibold text-white transition hover:bg-emerald-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/25 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {carregando ? 'Salvando...' : 'Salvar nova senha'}
            {!carregando && <ArrowRight size={18} aria-hidden="true" />}
          </button>
        </form>

        <Link
          to="/login"
          className="mt-6 block text-center text-sm font-medium text-emerald-800 underline-offset-4 hover:underline"
        >
          Voltar para o login
        </Link>
      </section>
    </main>
  )
}

export default RedefinirSenha
