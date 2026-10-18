import { useState, type FormEvent, type ReactNode } from 'react'
import {
  ArrowRight, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail,
  MessageCircle, Package, ShieldCheck, TrendingUp, Wallet,
} from 'lucide-react'
import { setAuthSessionPersistence, supabase } from '../lib/supabase'

function Feature({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="min-w-0 px-4 first:pl-0 last:pr-0 xl:px-6">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400 text-emerald-300">{icon}</div>
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="mt-1 max-w-[170px] text-sm leading-5 text-emerald-50/80">{description}</p>
    </div>
  )
}

function FinanceIllustration() {
  return (
    <img
      src="/images/inflowmarket-dashboard-illustration.png"
      alt="Pessoa analisando o dashboard de vendas, recebimentos e estoque do InflowMarket"
      className="block h-auto max-h-[min(46vh,440px)] w-full object-contain drop-shadow-[0_18px_24px_rgba(0,20,14,0.18)]"
      width={1659}
      height={948}
      fetchPriority="high"
    />
  )
}

function LoginPage() {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [manterConectado, setManterConectado] = useState(true)
  const [erro, setErro] = useState('')
  const [mensagem, setMensagem] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [recuperando, setRecuperando] = useState(false)

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErro('')
    setMensagem('')
    setCarregando(true)
    try {
      setAuthSessionPersistence(manterConectado)
      const { error } = await supabase.auth.signInWithPassword({ email, password: senha })
      if (error) setErro(error.message)
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível entrar. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }

  async function handleRecuperarSenha() {
    const campoEmail = document.querySelector<HTMLInputElement>('#email')
    if (!campoEmail?.reportValidity()) return
    setErro('')
    setMensagem('')
    setRecuperando(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/redefinir-senha`,
      })
      if (error) setErro(error.message)
      else setMensagem('Se este e-mail estiver cadastrado, você receberá instruções para redefinir sua senha.')
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível enviar as instruções. Tente novamente.')
    } finally {
      setRecuperando(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f8faf9] md:grid md:grid-cols-2">
      {/* Painel esquerdo: composição redesenhada para corresponder à referência aprovada. */}
      <aside className="relative hidden min-h-screen flex-col overflow-hidden bg-gradient-to-br from-emerald-950 via-emerald-950 to-[#003d30] px-8 py-8 text-white md:flex lg:px-[clamp(32px,5.2vw,80px)] lg:py-8 xl:px-[clamp(40px,5.4vw,84px)]">
        <div aria-hidden="true" className="pointer-events-none absolute -right-28 -top-16 h-80 w-80 rounded-full border border-emerald-400/10 bg-emerald-400/[0.035]" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-36 -left-24 h-96 w-96 rounded-full border border-emerald-400/10 bg-emerald-400/[0.035]" />
        <div aria-hidden="true" className="pointer-events-none absolute right-[12%] top-[38%] h-64 w-64 rounded-full bg-emerald-500/[0.06] blur-3xl" />

        <header className="relative z-10 flex shrink-0 items-center gap-4">
          <div className="flex h-[70px] w-[70px] shrink-0 items-center justify-center rounded-[20px] bg-gradient-to-br from-emerald-500 to-emerald-600 text-2xl font-extrabold text-white shadow-lg shadow-emerald-950/30">IM</div>
          <div>
            <p className="text-[clamp(25px,2.3vw,32px)] font-extrabold leading-none tracking-tight">Inflow<span className="text-emerald-400">Market</span></p>
            <p className="mt-2 text-[15px] text-emerald-50/85">Gestão simples para o seu negócio.</p>
          </div>
        </header>

        <section className="relative z-10 flex min-h-0 flex-1 flex-col pt-9 lg:pt-10 xl:pt-[clamp(32px,4vh,52px)]">
          <h1 className="max-w-[560px] text-[clamp(30px,2.65vw,42px)] font-bold leading-[1.12] tracking-tight">Controle total das suas vendas e estoque <span className="text-emerald-400">em um só lugar.</span></h1>
          <p className="mt-5 max-w-[500px] text-[clamp(15px,1.15vw,18px)] leading-[1.55] text-emerald-50/90">Simplifique a gestão financeira da sua feira ou mercado com relatórios em tempo real.</p>
          <div className="relative mx-auto flex w-full max-w-[760px] flex-1 items-center justify-center py-2 lg:py-1 [&>img]:max-h-[min(42vh,390px)]"><FinanceIllustration /></div>
        </section>

        <div className="relative z-10 grid shrink-0 grid-cols-3 border-t border-emerald-100/10 pt-5 lg:pt-6">
          <div className="border-r border-emerald-100/10 pr-3 lg:pr-5"><Feature icon={<TrendingUp size={23} />} title="Vendas" description="Acompanhe seu desempenho" /></div>
          <div className="border-r border-emerald-100/10 px-3 lg:px-5"><Feature icon={<Wallet size={23} />} title="Recebimentos" description="Organize suas contas a receber" /></div>
          <div className="pl-3 lg:pl-5"><Feature icon={<Package size={23} />} title="Estoque" description="Tenha controle dos seus produtos" /></div>
        </div>
      </aside>

      {/* Painel direito preservado: formulário, recuperação de senha e Supabase Auth. */}
      <section aria-labelledby="login-title" className="flex min-h-screen flex-col bg-[#f9fbfa] px-6 py-8 sm:px-12 md:px-5 md:py-0 xl:px-[clamp(48px,8.3vw,104px)]">
        <header className="mx-auto mt-2 flex w-full max-w-[372px] items-center justify-center gap-4 md:mt-[9vh]">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-lg font-extrabold text-white shadow-md shadow-emerald-950/10">IM</div>
          <span className="text-[clamp(1.5rem,2.8vw,2rem)] font-bold tracking-tight text-slate-900">Inflow<span className="text-emerald-700">Market</span></span>
        </header>

        <div className="mx-auto flex w-full max-w-[372px] flex-1 flex-col pt-7 md:flex-none md:pt-7">
          <div className="mb-6"><h2 id="login-title" className="text-[24px] font-bold tracking-tight text-slate-900">Acesse sua conta</h2><p className="mt-1.5 text-sm leading-5 text-slate-500">Digite seu e-mail e senha para acessar o painel de controle.</p></div>
          <form onSubmit={handleLogin} className="space-y-[18px]">
            <div className="space-y-2"><label htmlFor="email" className="text-sm font-semibold text-slate-800">E-mail</label><div className="group relative"><Mail size={17} aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-emerald-700"/><input id="email" name="email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="seu.email@exemplo.com" className="h-[43px] w-full rounded-lg border border-slate-200 bg-white pl-12 pr-4 text-sm text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"/></div></div>
            <div className="space-y-2"><label htmlFor="senha" className="text-sm font-semibold text-slate-800">Senha</label><div className="group relative"><LockKeyhole size={17} aria-hidden="true" className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700 transition-colors group-focus-within:text-emerald-700"/><input id="senha" name="password" type={mostrarSenha ? 'text' : 'password'} autoComplete="current-password" required value={senha} onChange={(event) => setSenha(event.target.value)} placeholder="••••••••" className="h-[43px] w-full rounded-lg border border-slate-200 bg-white pl-12 pr-12 text-sm tracking-[0.18em] text-slate-900 outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/10"/><button type="button" onClick={() => setMostrarSenha((visivel) => !visivel)} aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={mostrarSenha} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-slate-100 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">{mostrarSenha ? <EyeOff size={17} aria-hidden="true"/> : <Eye size={17} aria-hidden="true"/>}</button></div></div>
            <div className="flex items-center justify-between gap-3"><label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-700"><input type="checkbox" checked={manterConectado} onChange={(event) => setManterConectado(event.target.checked)} className="h-5 w-5 rounded border-slate-300 accent-emerald-700 focus:ring-emerald-600"/>Manter conectado</label><button type="button" onClick={handleRecuperarSenha} disabled={recuperando} className="text-sm font-semibold text-emerald-800 underline-offset-4 hover:text-emerald-700 hover:underline disabled:cursor-wait disabled:opacity-70">{recuperando ? 'Enviando...' : 'Esqueceu sua senha?'}</button></div>
            {mensagem && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{mensagem}</p>}
            {erro && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{erro}</p>}
            <button type="submit" disabled={carregando} className="flex h-[63px] w-full items-center justify-center gap-3 rounded-xl bg-emerald-700 px-5 text-base font-semibold text-white shadow-md shadow-emerald-950/10 transition-all hover:-translate-y-0.5 hover:bg-emerald-800 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-600/25 disabled:cursor-not-allowed disabled:opacity-70">{carregando ? <><LoaderCircle size={20} className="animate-spin"/>Entrando...</> : <>Entrar no Sistema<ArrowRight size={20}/></>}</button>
          </form>
          <div className="mt-7 flex min-h-[79px] items-center gap-4 rounded-xl border border-emerald-200 bg-emerald-50/50 px-5 py-4"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white"><MessageCircle size={23} aria-hidden="true"/></span><span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-emerald-900">Precisa de ajuda?</span><span className="mt-1 block text-sm leading-5 text-emerald-950">Fale com o responsável pelo suporte técnico.</span></span><ArrowRight size={19} aria-hidden="true" className="shrink-0 text-emerald-800"/></div>
        </div>

        <footer className="mx-auto mt-auto w-full max-w-[372px] border-t border-slate-200 pt-5 md:mt-6 md:mb-[5vh]"><div className="flex items-start gap-4"><ShieldCheck size={29} aria-hidden="true" className="mt-0.5 shrink-0 text-emerald-700"/><p className="text-xs leading-[1.65] text-slate-500">Seus dados estão protegidos de acordo com a Lei Geral de Proteção de Dados (LGPD).</p></div><p className="mt-7 text-center text-xs text-slate-500">© {new Date().getFullYear()} InflowMarket. Todos os direitos reservados.</p></footer>
      </section>
    </main>
  )
}

export default LoginPage
