import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  ArrowUpRight,
  DollarSign,
  Package,
  PackageOpen,
  ShoppingBag,
  ShoppingCart,
  Truck,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  carregarDashboard,
  type DashboardResumo,
} from '../services/DashboardService'

const moeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const dataHora = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

type Indicador = {
  titulo: string
  valor: string
  descricao: string
  icone: LucideIcon
  estilo: string
}

const tonsIndicador = {
  principal: 'bg-primary/10 text-primary',
  informativo: 'bg-info/10 text-info-foreground',
  alerta: 'bg-warning/15 text-warning-foreground',
  critico: 'bg-destructive/10 text-destructive',
}

const atalhos = [
  {
    titulo: 'Clientes',
    descricao: 'Cadastro e histórico',
    caminho: '/clientes',
    icone: Users,
  },
  {
    titulo: 'Produtos',
    descricao: 'Catálogo e estoque',
    caminho: '/produtos',
    icone: Package,
  },
  {
    titulo: 'Fornecedores',
    descricao: 'Parceiros e contatos',
    caminho: '/fornecedores',
    icone: Truck,
  },
  {
    titulo: 'Entradas',
    descricao: 'Recebimento de mercadoria',
    caminho: '/entradas',
    icone: PackageOpen,
  },
]

function Dashboard() {
  const { usuario } = useAuth()
  const [resumo, setResumo] = useState<DashboardResumo | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [recarregar, setRecarregar] = useState(0)
  const tenantId = usuario?.tenant_id ?? null

  useEffect(() => {
    let ativo = true

    carregarDashboard(tenantId)
      .then((dados) => {
        if (!ativo) return
        setResumo(dados)
        setErro('')
      })
      .catch((error: unknown) => {
        if (!ativo) return
        setErro(
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar os indicadores do painel.',
        )
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => {
      ativo = false
    }
  }, [recarregar, tenantId])

  const indicadores: Indicador[] = resumo
    ? [
        {
          titulo: 'Vendas do dia',
          valor: moeda.format(resumo.totalVendasHoje),
          descricao: `${resumo.vendasHoje} ${
            resumo.vendasHoje === 1 ? 'venda registrada' : 'vendas registradas'
          } hoje`,
          icone: DollarSign,
          estilo: tonsIndicador.principal,
        },
        {
          titulo: 'Clientes cadastrados',
          valor: String(resumo.clientesCadastrados),
          descricao: 'clientes visíveis para sua conta',
          icone: Users,
          estilo: tonsIndicador.informativo,
        },
        {
          titulo: 'Entradas do mês',
          valor: moeda.format(resumo.totalEntradasNoMes),
          descricao: `${resumo.entradasNoMes} ${
            resumo.entradasNoMes === 1 ? 'entrada no período' : 'entradas no período'
          }`,
          icone: PackageOpen,
          estilo: tonsIndicador.alerta,
        },
        {
          titulo: 'Estoque zerado',
          valor: String(resumo.produtosSemEstoque),
          descricao: 'produtos ativos sem unidades disponíveis',
          icone: AlertTriangle,
          estilo: tonsIndicador.critico,
        },
      ]
    : []

  function tentarNovamente() {
    setErro('')
    setCarregando(true)
    setRecarregar((valor) => valor + 1)
  }

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
            Visão geral
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Bem-vindo, {usuario?.nome ?? 'usuário'}
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>Resumo da operação de hoje.</span>
            <span className="rounded-md border border-border bg-card px-2 py-0.5 font-mono text-[11px]">
              {usuario?.tenant_id ?? 'Acesso global'}
            </span>
          </p>
        </div>
        <Link
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          to="/pdv"
        >
          <ShoppingCart aria-hidden="true" className="size-4" />
          Nova venda
        </Link>
      </header>

      {erro && (
        <div
          className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between"
          role="alert"
        >
          <span>{erro}</span>
          <button
            className="min-h-9 shrink-0 rounded-md border border-destructive/30 px-3 font-medium hover:bg-destructive/10"
            onClick={tentarNovamente}
            type="button"
          >
            Tentar novamente
          </button>
        </div>
      )}

      {carregando && !resumo ? (
        <div
          aria-live="polite"
          className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground"
        >
          Carregando os dados reais da operação...
        </div>
      ) : (
        resumo && (
          <>
            <section
              aria-label="Indicadores"
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
            >
              {indicadores.map((indicador) => {
                const Icon = indicador.icone
                return (
                  <article
                    className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm"
                    key={indicador.titulo}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {indicador.titulo}
                        </p>
                        <p className="mt-2 text-2xl font-semibold tabular-nums">
                          {indicador.valor}
                        </p>
                      </div>
                      <span
                        className={`flex size-10 shrink-0 items-center justify-center rounded-lg ${indicador.estilo}`}
                      >
                        <Icon aria-hidden="true" className="size-5" />
                      </span>
                    </div>
                    <p className="mt-4 text-xs text-muted-foreground">
                      {indicador.descricao}
                    </p>
                  </article>
                )
              })}
            </section>

            <section
              aria-labelledby="atalhos-title"
              className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm"
            >
              <div className="mb-4">
                <h2 id="atalhos-title" className="font-semibold">
                  Atalhos rápidos
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Acesse as áreas mais usadas no dia a dia.
                </p>
              </div>
              <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                {atalhos.map((atalho) => {
                  const Icon = atalho.icone
                  return (
                    <li key={atalho.caminho}>
                      <Link
                        className="group flex h-full flex-col gap-3 rounded-lg border border-border bg-background p-4 transition-colors hover:border-primary/40 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        to={atalho.caminho}
                      >
                        <span className="flex items-center justify-between">
                          <span className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                            <Icon aria-hidden="true" className="size-4" />
                          </span>
                          <ArrowUpRight
                            aria-hidden="true"
                            className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary"
                          />
                        </span>
                        <span className="flex flex-col gap-0.5">
                          <span className="text-sm font-medium">
                            {atalho.titulo}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {atalho.descricao}
                          </span>
                        </span>
                      </Link>
                    </li>
                  )
                })}
              </ul>
            </section>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
              <section
                aria-labelledby="vendas-semana-title"
                className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm lg:col-span-3"
              >
                <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2
                      id="vendas-semana-title"
                      className="font-semibold"
                    >
                      Vendas da semana
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Faturamento dos últimos 7 dias
                    </p>
                  </div>
                  <span className="rounded-full bg-success/10 px-3 py-1 text-sm font-medium tabular-nums text-success-foreground">
                    {moeda.format(
                      resumo.vendasPorDia.reduce(
                        (total, dia) => total + dia.total,
                        0,
                      ),
                    )}
                  </span>
                </div>
                <div className="h-64 w-full" role="img" aria-label="Gráfico de vendas dos últimos sete dias">
                  <ResponsiveContainer height="100%" width="100%">
                    <BarChart
                      data={resumo.vendasPorDia}
                      margin={{ left: 8, right: 8, top: 8 }}
                    >
                      <CartesianGrid
                        stroke="var(--border)"
                        vertical={false}
                      />
                      <XAxis
                        axisLine={false}
                        dataKey="dia"
                        tickLine={false}
                        tickMargin={8}
                      />
                      <YAxis
                        axisLine={false}
                        tickFormatter={(valor: number) =>
                          moeda.format(valor).replace(',00', '')
                        }
                        tickLine={false}
                        width={72}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--card)',
                          borderColor: 'var(--border)',
                          borderRadius: '0.75rem',
                        }}
                        formatter={(valor) => [
                          moeda.format(Number(valor)),
                          'Vendas',
                        ]}
                        labelStyle={{ color: 'var(--muted-foreground)' }}
                      />
                      <Bar
                        dataKey="total"
                        fill="var(--primary)"
                        maxBarSize={44}
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section
                aria-labelledby="movimentacoes-title"
                className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm lg:col-span-2"
              >
                <div className="mb-4 flex items-start justify-between gap-2">
                  <div>
                    <h2 id="movimentacoes-title" className="font-semibold">
                      Últimas movimentações
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Vendas e entradas recentes
                    </p>
                  </div>
                  <Link
                    className="shrink-0 rounded-md px-2 py-1 text-sm font-medium text-primary hover:bg-accent"
                    to="/vendas"
                  >
                    Ver todas
                  </Link>
                </div>
                {resumo.atividadesRecentes.length > 0 ? (
                  <ul className="flex flex-col divide-y divide-border">
                    {resumo.atividadesRecentes.map((atividade) => {
                      const venda = atividade.tipo === 'venda'
                      const Icon = venda ? ShoppingBag : PackageOpen
                      return (
                        <li
                          className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                          key={atividade.id}
                        >
                          <span
                            className={`flex size-9 shrink-0 items-center justify-center rounded-full ${
                              venda
                                ? 'bg-primary/10 text-primary'
                                : 'bg-info/10 text-info-foreground'
                            }`}
                          >
                            <Icon aria-hidden="true" className="size-4" />
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className="truncate text-sm font-medium">
                              {atividade.titulo}
                            </span>
                            <span className="truncate text-xs text-muted-foreground">
                              {atividade.subtitulo} ·{' '}
                              {dataHora.format(new Date(atividade.data))}
                            </span>
                          </span>
                          <span
                            className={`shrink-0 text-sm font-medium tabular-nums ${
                              venda
                                ? 'text-success-foreground'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {venda ? '+' : '−'}
                            {moeda.format(atividade.valor)}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <div className="flex min-h-40 flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                    <PackageOpen aria-hidden="true" className="size-6" />
                    <p>Nenhuma movimentação recente.</p>
                  </div>
                )}
              </section>
            </div>
          </>
        )
      )}
    </div>
  )
}

export default Dashboard
