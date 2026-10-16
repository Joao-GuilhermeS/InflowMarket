import { useEffect, useMemo, useState } from 'react'
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Eye,
  Receipt,
  Search,
  ShoppingBag,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { listarVendas } from '../services/VendaService'
import type { VendaResumo } from '../services/VendaService'

type FiltroPeriodo = '30' | '90' | 'todos'
type FiltroStatus = 'TODOS' | VendaResumo['status']

const TAMANHO_PAGINA = 8

const moeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const dataVenda = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  dateStyle: 'short',
  timeStyle: 'short',
})

const rotulosStatus: Record<VendaResumo['status'], string> = {
  EM_ABERTO: 'Em aberto',
  PAGA: 'Paga',
  VENCIDA: 'Vencida',
  CANCELADA: 'Cancelada',
}

const estilosStatus: Record<VendaResumo['status'], string> = {
  EM_ABERTO: 'bg-warning/15 text-warning-foreground',
  PAGA: 'bg-success/10 text-success-foreground',
  VENCIDA: 'bg-destructive/10 text-destructive',
  CANCELADA: 'bg-muted text-muted-foreground',
}

function normalizarBusca(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
}

function totalEmCentavos(vendas: VendaResumo[]): number {
  return (
    vendas.reduce(
      (total, venda) => total + Math.round(venda.valorTotal * 100),
      0,
    ) / 100
  )
}

function Vendas() {
  const { usuario } = useAuth()
  const [vendas, setVendas] = useState<VendaResumo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('TODOS')
  const [filtroPeriodo, setFiltroPeriodo] = useState<FiltroPeriodo>('30')
  const [recarregar, setRecarregar] = useState(0)
  const [pagina, setPagina] = useState(1)
  const [dataReferencia] = useState(() => Date.now())
  const tenantId = usuario?.tenant_id

  useEffect(() => {
    if (!tenantId) return

    let ativo = true

    listarVendas(tenantId)
      .then((dados) => {
        if (!ativo) return
        setVendas(dados)
        setErro('')
      })
      .catch((error: unknown) => {
        if (!ativo) return
        setErro(
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar as vendas.',
        )
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => {
      ativo = false
    }
  }, [recarregar, tenantId])

  const vendasFiltradas = useMemo(() => {
    const limite =
      filtroPeriodo === 'todos'
        ? null
        : new Date(
            dataReferencia -
              Number(filtroPeriodo) * 24 * 60 * 60 * 1000,
          )
    const consulta = normalizarBusca(busca.trim())

    return vendas
      .filter((venda) => {
        const data = new Date(venda.dataVenda)
        const combinaPeriodo = !limite || data >= limite
        const combinaStatus =
          filtroStatus === 'TODOS' || venda.status === filtroStatus
        const combinaBusca =
          !consulta ||
          normalizarBusca(venda.cliente).includes(consulta) ||
          String(venda.numero).includes(consulta)

        return combinaPeriodo && combinaStatus && combinaBusca
      })
      .sort(
        (primeira, segunda) =>
          new Date(segunda.dataVenda).getTime() -
          new Date(primeira.dataVenda).getTime(),
      )
  }, [busca, dataReferencia, filtroPeriodo, filtroStatus, vendas])

  const quantidadePaginas = Math.max(
    1,
    Math.ceil(vendasFiltradas.length / TAMANHO_PAGINA),
  )
  const paginaAtual = Math.min(pagina, quantidadePaginas)
  const inicioPagina = (paginaAtual - 1) * TAMANHO_PAGINA
  const vendasDaPagina = vendasFiltradas.slice(
    inicioPagina,
    inicioPagina + TAMANHO_PAGINA,
  )
  const totalFiltrado = totalEmCentavos(vendasFiltradas)

  function atualizarBusca(valor: string) {
    setBusca(valor)
    setPagina(1)
  }

  function atualizarStatus(valor: FiltroStatus) {
    setFiltroStatus(valor)
    setPagina(1)
  }

  function atualizarPeriodo(valor: FiltroPeriodo) {
    setFiltroPeriodo(valor)
    setPagina(1)
  }

  function tentarNovamente() {
    setErro('')
    setCarregando(true)
    setRecarregar((valor) => valor + 1)
  }

  if (!tenantId) {
    return (
      <section className="flex flex-col gap-6">
        <PageHeading />
        <div
          className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
          role="alert"
        >
          Seu usuário não está vinculado a uma loja.
        </div>
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
            Operação de caixa
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Vendas
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {vendasFiltradas.length} vendas · {moeda.format(totalFiltrado)} no
            filtro atual.
          </p>
        </div>
        <Link
          className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          to="/pdv"
        >
          <ShoppingBag aria-hidden="true" className="size-4" />
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

      <section className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-center lg:justify-between">
          <label className="relative min-w-0 flex-1 lg:max-w-md">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
              className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) => atualizarBusca(event.currentTarget.value)}
              placeholder="Buscar por cliente ou número..."
              type="search"
              value={busca}
            />
          </label>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <label className="sr-only" htmlFor="vendas-status">
              Filtrar por status
            </label>
            <select
              className="h-10 min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              id="vendas-status"
              onChange={(event) =>
                atualizarStatus(event.currentTarget.value as FiltroStatus)
              }
              value={filtroStatus}
            >
              <option value="TODOS">Todos os status</option>
              {Object.entries(rotulosStatus).map(([status, rotulo]) => (
                <option key={status} value={status}>
                  {rotulo}
                </option>
              ))}
            </select>
            <label className="sr-only" htmlFor="vendas-periodo">
              Filtrar por período
            </label>
            <span className="relative">
              <CalendarDays
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <select
                className="h-10 w-full min-w-0 rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-w-40"
                id="vendas-periodo"
                onChange={(event) =>
                  atualizarPeriodo(
                    event.currentTarget.value as FiltroPeriodo,
                  )
                }
                value={filtroPeriodo}
              >
                <option value="30">Últimos 30 dias</option>
                <option value="90">Últimos 90 dias</option>
                <option value="todos">Todo o período</option>
              </select>
            </span>
          </div>
        </div>

        {carregando ? (
          <div
            aria-live="polite"
            className="flex min-h-48 items-center justify-center text-sm text-muted-foreground"
          >
            Carregando vendas...
          </div>
        ) : erro && vendas.length === 0 ? (
          <div className="flex min-h-48 items-center justify-center p-6 text-sm text-muted-foreground">
            O histórico de vendas não está disponível.
          </div>
        ) : vendasFiltradas.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center gap-3 p-6 text-center">
            <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Receipt aria-hidden="true" className="size-5" />
            </span>
            <div>
              <h2 className="font-medium">Nenhuma venda encontrada</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Ajuste a busca ou os filtros, ou registre uma nova venda no
                caixa.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-muted/50 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Venda</th>
                    <th className="px-4 py-3">Cliente</th>
                    <th className="px-4 py-3">Vendedor</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Total</th>
                    <th aria-label="Ações" className="px-4 py-3 text-right" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {vendasDaPagina.map((venda) => (
                    <tr className="hover:bg-muted/30" key={venda.id}>
                      <td className="px-4 py-3">
                        <span className="block font-medium">
                          #{venda.numero}
                        </span>
                        <span className="mt-0.5 block text-xs tabular-nums text-muted-foreground">
                          {dataVenda.format(new Date(venda.dataVenda))}
                        </span>
                      </td>
                      <td className="max-w-56 truncate px-4 py-3">
                        {venda.cliente}
                      </td>
                      <td className="max-w-48 truncate px-4 py-3 text-muted-foreground">
                        {venda.vendedor}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex rounded-full border border-border px-2.5 py-1 text-xs">
                          {venda.tipoVenda === 'AVISTA' ? 'À vista' : 'A prazo'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={venda.status} />
                      </td>
                      <td className="px-4 py-3 font-semibold tabular-nums">
                        {moeda.format(venda.valorTotal)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <RomaneioLink venda={venda} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="flex flex-col gap-3 p-3 md:hidden">
              {vendasDaPagina.map((venda) => (
                <li
                  className="rounded-lg border border-border bg-background p-4"
                  key={venda.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">Venda #{venda.numero}</p>
                      <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                        {dataVenda.format(new Date(venda.dataVenda))}
                      </p>
                    </div>
                    <StatusBadge status={venda.status} />
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    <div className="min-w-0">
                      <dt className="text-xs text-muted-foreground">Cliente</dt>
                      <dd className="truncate">{venda.cliente}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs text-muted-foreground">Vendedor</dt>
                      <dd className="truncate">{venda.vendedor}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Tipo</dt>
                      <dd>{venda.tipoVenda === 'AVISTA' ? 'À vista' : 'A prazo'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Total</dt>
                      <dd className="font-semibold tabular-nums">
                        {moeda.format(venda.valorTotal)}
                      </dd>
                    </div>
                  </dl>
                  <div className="mt-3 flex justify-end border-t border-border pt-3">
                    <RomaneioLink venda={venda} />
                  </div>
                </li>
              ))}
            </ul>

            <nav
              aria-label="Paginação das vendas"
              className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm text-muted-foreground sm:flex-row"
            >
              <p>
                Exibindo{' '}
                <span className="font-medium text-foreground">
                  {inicioPagina + 1}
                </span>
                –
                <span className="font-medium text-foreground">
                  {inicioPagina + vendasDaPagina.length}
                </span>{' '}
                de{' '}
                <span className="font-medium text-foreground">
                  {vendasFiltradas.length}
                </span>{' '}
                vendas
              </p>
              <div className="flex items-center gap-2">
                <button
                  className="inline-flex min-h-9 items-center gap-1 rounded-md border border-border px-3 text-sm hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={paginaAtual === 1}
                  onClick={() => setPagina((valor) => Math.max(1, valor - 1))}
                  type="button"
                >
                  <ChevronLeft aria-hidden="true" className="size-4" />
                  Anterior
                </button>
                <span className="min-w-16 text-center tabular-nums">
                  {paginaAtual} / {quantidadePaginas}
                </span>
                <button
                  className="inline-flex min-h-9 items-center gap-1 rounded-md border border-border px-3 text-sm hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={paginaAtual === quantidadePaginas}
                  onClick={() =>
                    setPagina((valor) =>
                      Math.min(quantidadePaginas, valor + 1),
                    )
                  }
                  type="button"
                >
                  Próxima
                  <ChevronRight aria-hidden="true" className="size-4" />
                </button>
              </div>
            </nav>
          </>
        )}
        {!carregando && !erro && vendas.length > 0 && (
          <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
            Exibindo até as 100 vendas mais recentes retornadas pelo serviço.
          </div>
        )}
      </section>
    </section>
  )
}

function PageHeading() {
  return (
    <header>
      <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
        Operação de caixa
      </p>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        Vendas
      </h1>
    </header>
  )
}

function StatusBadge({ status }: { status: VendaResumo['status'] }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${estilosStatus[status]}`}
    >
      {rotulosStatus[status]}
    </span>
  )
}

function RomaneioLink({ venda }: { venda: VendaResumo }) {
  return (
    <Link
      aria-label={`Ver romaneio da venda ${venda.numero}`}
      className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      title="Ver romaneio"
      to={`/vendas/${venda.id}/romaneio`}
    >
      <Eye aria-hidden="true" className="size-4" />
    </Link>
  )
}

export default Vendas
