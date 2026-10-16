import { useEffect, useMemo, useState } from 'react'
import {
  ArrowDownToLine,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Package,
  Plus,
  Search,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  adicionarItemEntrada,
  criarEntrada,
  finalizarEntrada,
  listarEntradas,
} from '../services/EntradaService'
import type {
  EntradaMercadoria,
  ItemEntrada,
} from '../services/EntradaService'
import { listarFornecedores } from '../services/FornecedorService'
import type { Fornecedor } from '../services/FornecedorService'
import { listarProdutos } from '../services/ProdutoService'
import type { Produto } from '../services/ProdutoService'

interface ItemVisual {
  produto_id: string
  quantidade: string
  custo_unitario: string
}

type FiltroStatus = 'TODOS' | EntradaMercadoria['status']

const TAMANHO_PAGINA = 8

const moeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const quantidadeFormatada = new Intl.NumberFormat('pt-BR', {
  maximumFractionDigits: 3,
})

const dataFormatada = new Intl.DateTimeFormat('pt-BR', {
  timeZone: 'America/Sao_Paulo',
  dateStyle: 'short',
  timeStyle: 'short',
})

const rotulosStatus: Record<EntradaMercadoria['status'], string> = {
  ABERTA: 'Em aberto',
  FINALIZADA: 'Finalizada',
  CANCELADA: 'Cancelada',
}

const estilosStatus: Record<EntradaMercadoria['status'], string> = {
  ABERTA: 'bg-warning/15 text-warning-foreground',
  FINALIZADA: 'bg-success/10 text-success-foreground',
  CANCELADA: 'bg-muted text-muted-foreground',
}

function normalizarBusca(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
}

function totaisEmCentavos(itens: ItemEntrada[]): number {
  return itens.reduce(
    (total, item) => total + Math.round(Number(item.valor_total) * 100),
    0,
  )
}

function Entradas() {
  const { usuario } = useAuth()
  const [entradas, setEntradas] = useState<EntradaMercadoria[]>([])
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [entradaAtual, setEntradaAtual] =
    useState<EntradaMercadoria | null>(null)
  const [itens, setItens] = useState<ItemEntrada[]>([])
  const [itemForm, setItemForm] = useState<ItemVisual>({
    produto_id: '',
    quantidade: '',
    custo_unitario: '',
  })
  const [fornecedorId, setFornecedorId] = useState('')
  const [observacao, setObservacao] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [erroCarregamento, setErroCarregamento] = useState('')
  const [busca, setBusca] = useState('')
  const [filtroStatus, setFiltroStatus] =
    useState<FiltroStatus>('TODOS')
  const [recarregar, setRecarregar] = useState(0)
  const [pagina, setPagina] = useState(1)

  useEffect(() => {
    let ativo = true

    async function carregarDados() {
      try {
        const [entradasData, fornecedoresData, produtosData] =
          await Promise.all([
            listarEntradas(),
            listarFornecedores(),
            listarProdutos(),
          ])

        if (!ativo) return
        setEntradas(entradasData)
        setFornecedores(fornecedoresData)
        setProdutos(produtosData)
        setErroCarregamento('')
      } catch (error) {
        if (!ativo) return
        setErroCarregamento(
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar os dados das entradas.',
        )
      } finally {
        if (ativo) setCarregando(false)
      }
    }

    void carregarDados()

    return () => {
      ativo = false
    }
  }, [recarregar])

  const nomePorFornecedor = useMemo(
    () =>
      new Map(
        fornecedores.map((fornecedor) => [fornecedor.id, fornecedor.nome]),
      ),
    [fornecedores],
  )
  const nomePorProduto = useMemo(
    () => new Map(produtos.map((produto) => [produto.id, produto.nome])),
    [produtos],
  )

  const entradasFiltradas = useMemo(() => {
    const consulta = normalizarBusca(busca.trim())

    return entradas.filter((entrada) => {
      if (filtroStatus !== 'TODOS' && entrada.status !== filtroStatus) {
        return false
      }
      if (!consulta) return true

      const nomeFornecedor =
        nomePorFornecedor.get(entrada.fornecedor_id) ?? ''

      return (
        normalizarBusca(nomeFornecedor).includes(consulta) ||
        normalizarBusca(entrada.observacao ?? '').includes(consulta) ||
        normalizarBusca(rotulosStatus[entrada.status]).includes(consulta)
      )
    })
  }, [busca, entradas, filtroStatus, nomePorFornecedor])

  const quantidadePaginas = Math.max(
    1,
    Math.ceil(entradasFiltradas.length / TAMANHO_PAGINA),
  )
  const paginaAtual = Math.min(pagina, quantidadePaginas)
  const inicioPagina = (paginaAtual - 1) * TAMANHO_PAGINA
  const entradasDaPagina = entradasFiltradas.slice(
    inicioPagina,
    inicioPagina + TAMANHO_PAGINA,
  )
  const quantidadeFinalizadas = entradas.filter(
    (entrada) => entrada.status === 'FINALIZADA',
  ).length
  const mensagemErro = erroCarregamento || erro

  async function handleCriarEntrada(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (!usuario?.tenant_id) {
      setErro('Usuário não possui tenant associado.')
      return
    }

    if (!fornecedorId) {
      setErro('Selecione um fornecedor.')
      return
    }

    try {
      setErro('')
      setSalvando(true)

      const entrada = await criarEntrada({
        tenant_id: usuario.tenant_id,
        fornecedor_id: fornecedorId,
        usuario_id: usuario.id,
        observacao: observacao.trim() || undefined,
      })

      setEntradaAtual(entrada)
      setItens([])
      setItemForm({
        produto_id: '',
        quantidade: '',
        custo_unitario: '',
      })
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível criar a entrada.',
      )
    } finally {
      setSalvando(false)
    }
  }

  async function handleAdicionarItem(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (!entradaAtual) {
      setErro('Crie uma entrada primeiro.')
      return
    }

    const quantidade = Number(itemForm.quantidade)
    const custoUnitario = Number(itemForm.custo_unitario)

    if (!itemForm.produto_id) {
      setErro('Selecione um produto.')
      return
    }

    if (!Number.isFinite(quantidade) || quantidade <= 0) {
      setErro('Informe uma quantidade válida.')
      return
    }

    if (!Number.isFinite(custoUnitario) || custoUnitario < 0) {
      setErro('Informe um custo unitário válido.')
      return
    }

    try {
      setErro('')
      setSalvando(true)

      const novoItem = await adicionarItemEntrada({
        entrada_id: entradaAtual.id,
        produto_id: itemForm.produto_id,
        quantidade,
        custo_unitario: custoUnitario,
      })

      setItens((itensAtuais) => [...itensAtuais, novoItem])
      setItemForm({
        produto_id: '',
        quantidade: '',
        custo_unitario: '',
      })
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível adicionar o item.',
      )
    } finally {
      setSalvando(false)
    }
  }

  async function handleFinalizar() {
    if (!entradaAtual) return

    if (itens.length === 0) {
      setErro('Adicione pelo menos um item antes de finalizar.')
      return
    }

    try {
      setErro('')
      setSalvando(true)
      await finalizarEntrada(entradaAtual.id)

      setEntradaAtual(null)
      setItens([])
      setFornecedorId('')
      setObservacao('')
      setCarregando(true)
      setRecarregar((valor) => valor + 1)
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível finalizar a entrada.',
      )
    } finally {
      setSalvando(false)
    }
  }

  function tentarNovamente() {
    setErro('')
    setErroCarregamento('')
    setCarregando(true)
    setRecarregar((valor) => valor + 1)
  }

  function obterNomeFornecedor(fornecedorIdAtual: string): string {
    return nomePorFornecedor.get(fornecedorIdAtual) ?? 'Fornecedor indisponível'
  }

  function obterNomeProduto(produtoId: string): string {
    return nomePorProduto.get(produtoId) ?? 'Produto indisponível'
  }

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
            Estoque
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Entradas de mercadoria
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {entradas.length} movimentações · {quantidadeFinalizadas}{' '}
            finalizadas.
          </p>
        </div>
        {entradaAtual && (
          <span className="inline-flex min-h-9 items-center gap-2 self-start rounded-full bg-warning/15 px-3 text-sm font-medium text-warning-foreground sm:self-auto">
            <span className="size-2 rounded-full bg-warning" />
            Entrada em aberto
          </span>
        )}
      </header>

      {mensagemErro && (
        <div
          className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between"
          role="alert"
        >
          <span>{mensagemErro}</span>
          {erroCarregamento && (
            <button
              className="min-h-9 shrink-0 rounded-md border border-destructive/30 px-3 font-medium hover:bg-destructive/10"
              onClick={tentarNovamente}
              type="button"
            >
              Tentar novamente
            </button>
          )}
        </div>
      )}

      {!entradaAtual ? (
        <section className="rounded-xl border border-border bg-card p-5 text-card-foreground shadow-sm sm:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold">Nova entrada</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Selecione o fornecedor para iniciar o recebimento de mercadorias.
            </p>
          </div>
          <form
            className="grid grid-cols-1 items-end gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto]"
            onSubmit={handleCriarEntrada}
          >
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Fornecedor
              <select
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
                disabled={carregando || fornecedores.length === 0 || salvando}
                onChange={(event) =>
                  setFornecedorId(event.currentTarget.value)
                }
                required
                value={fornecedorId}
              >
                <option value="">
                  {fornecedores.length === 0
                    ? 'Nenhum fornecedor disponível'
                    : 'Selecione um fornecedor'}
                </option>
                {fornecedores.map((fornecedor) => (
                  <option key={fornecedor.id} value={fornecedor.id}>
                    {fornecedor.nome}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              Observação
              <input
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-normal outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                onChange={(event) =>
                  setObservacao(event.currentTarget.value)
                }
                placeholder="Opcional"
                value={observacao}
              />
            </label>
            <button
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
              disabled={salvando || carregando || fornecedores.length === 0}
              type="submit"
            >
              <Plus aria-hidden="true" className="size-4" />
              {salvando ? 'Criando...' : 'Criar entrada'}
            </button>
          </form>
        </section>
      ) : (
        <section className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm">
          <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                Recebimento em andamento
              </p>
              <h2 className="text-lg font-semibold">Entrada em aberto</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Fornecedor: {obterNomeFornecedor(entradaAtual.fornecedor_id)}
              </p>
              {entradaAtual.observacao && (
                <p className="mt-1 text-sm text-muted-foreground">
                  {entradaAtual.observacao}
                </p>
              )}
            </div>
            <div className="rounded-lg bg-muted/60 px-4 py-3 sm:min-w-48">
              <p className="text-xs text-muted-foreground">
                Total dos itens adicionados
              </p>
              <p className="mt-1 text-xl font-semibold tabular-nums">
                {moeda.format(totaisEmCentavos(itens) / 100)}
              </p>
            </div>
          </div>

          <div className="grid gap-6 p-5 sm:p-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <form
              className="flex flex-col gap-4 rounded-lg border border-border bg-background p-4"
              onSubmit={handleAdicionarItem}
            >
              <div>
                <h3 className="font-semibold">Adicionar item</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Escolha um produto e informe quantidade e custo unitário.
                </p>
              </div>
              <label className="flex flex-col gap-1.5 text-sm font-medium">
                Produto
                <select
                  className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  disabled={salvando}
                  onChange={(event) =>
                    setItemForm((atual) => ({
                      ...atual,
                      produto_id: event.currentTarget.value,
                    }))
                  }
                  required
                  value={itemForm.produto_id}
                >
                  <option value="">Selecione um produto</option>
                  {produtos
                    .filter((produto) => produto.ativo)
                    .map((produto) => (
                      <option key={produto.id} value={produto.id}>
                        {produto.nome} ({produto.unidade})
                      </option>
                    ))}
                </select>
              </label>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1.5 text-sm font-medium">
                  Quantidade
                  <input
                    className="h-10 rounded-lg border border-input bg-background px-3 text-sm font-normal tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    disabled={salvando}
                    min="0.001"
                    onChange={(event) =>
                      setItemForm((atual) => ({
                        ...atual,
                        quantidade: event.currentTarget.value,
                      }))
                    }
                    required
                    step="0.001"
                    type="number"
                    value={itemForm.quantidade}
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-medium">
                  Custo unitário
                  <span className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      R$
                    </span>
                    <input
                      className="h-10 w-full rounded-lg border border-input bg-background pl-10 pr-3 text-sm font-normal tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      disabled={salvando}
                      min="0"
                      onChange={(event) =>
                        setItemForm((atual) => ({
                          ...atual,
                          custo_unitario: event.currentTarget.value,
                        }))
                      }
                      required
                      step="0.01"
                      type="number"
                      value={itemForm.custo_unitario}
                    />
                  </span>
                </label>
              </div>
              <button
                className="inline-flex min-h-10 items-center justify-center gap-2 self-start rounded-lg border border-border px-4 text-sm font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                disabled={salvando || !produtos.some((produto) => produto.ativo)}
                type="submit"
              >
                <Plus aria-hidden="true" className="size-4" />
                {salvando ? 'Adicionando...' : 'Adicionar item'}
              </button>
            </form>

            <div className="min-w-0">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold">Itens da entrada</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {itens.length} {itens.length === 1 ? 'item' : 'itens'}
                  </p>
                </div>
              </div>
              {itens.length === 0 ? (
                <div className="flex min-h-36 flex-col items-center justify-center rounded-lg border border-dashed border-border p-5 text-center">
                  <Package
                    aria-hidden="true"
                    className="mb-2 size-5 text-muted-foreground"
                  />
                  <p className="text-sm font-medium">Nenhum item adicionado</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Os itens recebidos aparecerão aqui.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full min-w-[520px] text-left text-sm">
                    <thead className="bg-muted/50 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      <tr>
                        <th className="px-3 py-3">Produto</th>
                        <th className="px-3 py-3 text-right">Quantidade</th>
                        <th className="px-3 py-3 text-right">Custo unit.</th>
                        <th className="px-3 py-3 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {itens.map((item) => (
                        <tr key={item.id}>
                          <td className="max-w-44 truncate px-3 py-3 font-medium">
                            {obterNomeProduto(item.produto_id)}
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums">
                            {quantidadeFormatada.format(item.quantidade)}
                          </td>
                          <td className="px-3 py-3 text-right tabular-nums">
                            {moeda.format(item.custo_unitario)}
                          </td>
                          <td className="px-3 py-3 text-right font-medium tabular-nums">
                            {moeda.format(item.valor_total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 border-t border-border bg-muted/20 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-sm text-muted-foreground">
              A entrada atualiza o estoque ao ser finalizada.
            </p>
            <button
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
              disabled={salvando || itens.length === 0}
              onClick={() => void handleFinalizar()}
              type="button"
            >
              <ArrowDownToLine aria-hidden="true" className="size-4" />
              {salvando ? 'Finalizando...' : 'Finalizar entrada'}
            </button>
          </div>
        </section>
      )}

      <section className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm">
        <div className="border-b border-border p-4 sm:p-5">
          <div className="mb-4">
            <h2 className="text-lg font-semibold">Histórico de entradas</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Consulte as movimentações recebidas e seu status.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="relative min-w-0 flex-1 sm:max-w-md">
              <Search
                aria-hidden="true"
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              />
              <input
                className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                onChange={(event) => {
                  setBusca(event.currentTarget.value)
                  setPagina(1)
                }}
                placeholder="Buscar por fornecedor ou observação..."
                type="search"
                value={busca}
              />
            </label>
            <label className="sr-only" htmlFor="entradas-status">
              Filtrar por status
            </label>
            <select
              className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-48"
              id="entradas-status"
              onChange={(event) => {
                setFiltroStatus(event.currentTarget.value as FiltroStatus)
                setPagina(1)
              }}
              value={filtroStatus}
            >
              <option value="TODOS">Todos os status</option>
              {Object.entries(rotulosStatus).map(([status, rotulo]) => (
                <option key={status} value={status}>
                  {rotulo}
                </option>
              ))}
            </select>
          </div>
        </div>

        {carregando ? (
          <div
            aria-live="polite"
            className="flex min-h-48 items-center justify-center text-sm text-muted-foreground"
          >
            Carregando entradas...
          </div>
        ) : erroCarregamento && entradas.length === 0 ? (
          <div className="flex min-h-48 items-center justify-center p-6 text-sm text-muted-foreground">
            O histórico de entradas não está disponível.
          </div>
        ) : entradasFiltradas.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center gap-3 p-6 text-center">
            <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <ArrowDownToLine aria-hidden="true" className="size-5" />
            </span>
            <div>
              <h3 className="font-medium">
                {entradas.length === 0
                  ? 'Nenhuma entrada cadastrada'
                  : 'Nenhuma entrada encontrada'}
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {entradas.length === 0
                  ? 'As entradas finalizadas aparecerão neste histórico.'
                  : 'Ajuste a busca ou o status selecionado.'}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-muted/50 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Entrada</th>
                    <th className="px-4 py-3">Fornecedor</th>
                    <th className="px-4 py-3">Observação</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Valor total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {entradasDaPagina.map((entrada) => (
                    <tr className="hover:bg-muted/30" key={entrada.id}>
                      <td className="px-4 py-3">
                        <span className="block font-medium">
                          {dataFormatada.format(new Date(entrada.data))}
                        </span>
                        <span className="mt-0.5 block font-mono text-xs text-muted-foreground">
                          {entrada.id.slice(0, 8).toUpperCase()}
                        </span>
                      </td>
                      <td className="max-w-52 truncate px-4 py-3 font-medium">
                        {obterNomeFornecedor(entrada.fornecedor_id)}
                      </td>
                      <td className="max-w-56 truncate px-4 py-3 text-muted-foreground">
                        {entrada.observacao || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={entrada.status} />
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">
                        {moeda.format(entrada.valor_total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="flex flex-col gap-3 p-3 md:hidden">
              {entradasDaPagina.map((entrada) => (
                <li
                  className="rounded-lg border border-border bg-background p-4"
                  key={entrada.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">
                        {obterNomeFornecedor(entrada.fornecedor_id)}
                      </p>
                      <p className="mt-1 inline-flex items-center gap-1.5 text-xs tabular-nums text-muted-foreground">
                        <CalendarDays aria-hidden="true" className="size-3.5" />
                        {dataFormatada.format(new Date(entrada.data))}
                      </p>
                    </div>
                    <StatusBadge status={entrada.status} />
                  </div>
                  {entrada.observacao && (
                    <p className="mt-3 text-sm text-muted-foreground">
                      {entrada.observacao}
                    </p>
                  )}
                  <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                    <span className="text-xs text-muted-foreground">
                      Total
                    </span>
                    <span className="font-semibold tabular-nums">
                      {moeda.format(entrada.valor_total)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>

            <nav
              aria-label="Paginação das entradas"
              className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm text-muted-foreground sm:flex-row"
            >
              <p>
                Exibindo{' '}
                <span className="font-medium text-foreground">
                  {inicioPagina + 1}
                </span>
                –
                <span className="font-medium text-foreground">
                  {inicioPagina + entradasDaPagina.length}
                </span>{' '}
                de{' '}
                <span className="font-medium text-foreground">
                  {entradasFiltradas.length}
                </span>{' '}
                entradas
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
      </section>
    </section>
  )
}

function StatusBadge({ status }: { status: EntradaMercadoria['status'] }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${estilosStatus[status]}`}
    >
      {rotulosStatus[status]}
    </span>
  )
}

export default Entradas
