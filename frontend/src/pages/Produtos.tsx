import { useEffect, useMemo, useState } from 'react'
import { Package, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  atualizarProduto,
  criarProduto,
  excluirProduto,
  listarProdutos,
} from '../services/ProdutoService'
import type {
  CriarProduto,
  Produto,
} from '../services/ProdutoService'
import { ProdutoFormDialog } from '../components/produtos/produto-form-dialog'
import { StockIndicator } from '../components/produtos/stock-indicator'

type StatusFiltro = 'todos' | 'ativos' | 'inativos'
type EstoqueFiltro = 'todos' | 'zerados'

function normalizarBusca(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
}

function Produtos() {
  const { usuario } = useAuth()
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [erroCarregamento, setErroCarregamento] = useState('')
  const [termoBusca, setTermoBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState<StatusFiltro>('todos')
  const [estoqueFiltro, setEstoqueFiltro] = useState<EstoqueFiltro>('todos')
  const [dialogoAberto, setDialogoAberto] = useState(false)
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null)
  const [recarregar, setRecarregar] = useState(0)

  useEffect(() => {
    let ativo = true

    listarProdutos()
      .then((dados) => {
        if (!ativo) return
        setProdutos(dados)
        setErroCarregamento('')
      })
      .catch((error: unknown) => {
        if (!ativo) return
        setErroCarregamento(
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar os produtos.',
        )
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => {
      ativo = false
    }
  }, [recarregar])

  const produtosFiltrados = useMemo(() => {
    const busca = normalizarBusca(termoBusca.trim())

    return produtos.filter((produto) => {
      if (statusFiltro === 'ativos' && !produto.ativo) return false
      if (statusFiltro === 'inativos' && produto.ativo) return false
      if (estoqueFiltro === 'zerados' && produto.quantidade_estoque > 0) {
        return false
      }
      if (!busca) return true

      return [produto.nome, produto.descricao ?? '', produto.unidade].some(
        (valor) => normalizarBusca(valor).includes(busca),
      )
    })
  }, [estoqueFiltro, produtos, statusFiltro, termoBusca])

  const produtosSemEstoque = produtos.filter(
    (produto) => produto.ativo && produto.quantidade_estoque <= 0,
  ).length

  function abrirNovoProduto() {
    setErro('')
    setProdutoEditando(null)
    setDialogoAberto(true)
  }

  function abrirEdicao(produto: Produto) {
    setErro('')
    setProdutoEditando(produto)
    setDialogoAberto(true)
  }

  async function salvarProduto(dados: Omit<CriarProduto, 'tenant_id'>) {
    if (!usuario?.tenant_id) {
      setErro('Usuário não possui um tenant associado.')
      return
    }

    try {
      setErro('')
      setSalvando(true)

      if (produtoEditando) {
        await atualizarProduto(produtoEditando.id, dados)
      } else {
        await criarProduto({
          ...dados,
          tenant_id: usuario.tenant_id,
        })
      }

      setDialogoAberto(false)
      setProdutoEditando(null)
      setCarregando(true)
      setRecarregar((valor) => valor + 1)
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível salvar o produto.',
      )
    } finally {
      setSalvando(false)
    }
  }

  async function removerProduto(produto: Produto) {
    const confirmar = window.confirm(
      `Deseja realmente excluir o produto "${produto.nome}"?`,
    )

    if (!confirmar) return

    try {
      setErro('')
      await excluirProduto(produto.id)
      setCarregando(true)
      setRecarregar((valor) => valor + 1)
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível excluir o produto.',
      )
    }
  }

  function tentarNovamente() {
    setErro('')
    setErroCarregamento('')
    setCarregando(true)
    setRecarregar((valor) => valor + 1)
  }

  const mensagemErro = erroCarregamento || erro

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
            Catálogo
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Produtos
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {produtos.length} produtos no catálogo
            {produtosSemEstoque > 0 && (
              <>
                {' · '}
                <span className="font-medium text-warning-foreground">
                  {produtosSemEstoque} sem estoque
                </span>
              </>
            )}
          </p>
        </div>
        <button
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={abrirNovoProduto}
          type="button"
        >
          <Plus aria-hidden="true" className="size-4" />
          Novo produto
        </button>
      </header>

      {mensagemErro && (
        <div
          className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between"
          role="alert"
        >
          <span>{mensagemErro}</span>
          {erroCarregamento && !dialogoAberto && (
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

      <section className="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm">
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <label className="relative min-w-0 flex-1 sm:max-w-md">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            />
            <input
              className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) => setTermoBusca(event.currentTarget.value)}
              placeholder="Buscar por nome ou descrição..."
              type="search"
              value={termoBusca}
            />
          </label>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <select
              aria-label="Filtrar por status"
              className="h-10 min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) =>
                setStatusFiltro(event.currentTarget.value as StatusFiltro)
              }
              value={statusFiltro}
            >
              <option value="todos">Todos status</option>
              <option value="ativos">Ativos</option>
              <option value="inativos">Inativos</option>
            </select>
            <select
              aria-label="Filtrar por estoque"
              className="h-10 min-w-0 rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onChange={(event) =>
                setEstoqueFiltro(event.currentTarget.value as EstoqueFiltro)
              }
              value={estoqueFiltro}
            >
              <option value="todos">Todo estoque</option>
              <option value="zerados">Sem estoque</option>
            </select>
          </div>
        </div>

        {carregando ? (
          <div
            aria-live="polite"
            className="flex min-h-48 items-center justify-center text-sm text-muted-foreground"
          >
            Carregando produtos...
          </div>
        ) : erroCarregamento && produtos.length === 0 ? (
          <div className="flex min-h-48 items-center justify-center p-6 text-sm text-muted-foreground">
            A lista de produtos não está disponível.
          </div>
        ) : produtosFiltrados.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center gap-3 p-6 text-center">
            <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Package aria-hidden="true" className="size-5" />
            </span>
            <div>
              <h2 className="font-medium">
                {produtos.length === 0
                  ? 'Nenhum produto cadastrado'
                  : 'Nenhum produto encontrado'}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {produtos.length === 0
                  ? 'Cadastre o primeiro produto para preencher o catálogo.'
                  : 'Ajuste a busca ou os filtros aplicados.'}
              </p>
            </div>
            {produtos.length === 0 && (
              <button
                className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium hover:bg-accent"
                onClick={abrirNovoProduto}
                type="button"
              >
                <Plus aria-hidden="true" className="size-4" />
                Novo produto
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-muted/50 text-xs font-medium text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="hidden max-w-64 px-4 py-3 md:table-cell">
                    Descrição
                  </th>
                  <th className="px-4 py-3">Unidade</th>
                  <th className="px-4 py-3">Estoque</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {produtosFiltrados.map((produto) => (
                  <tr className="hover:bg-muted/30" key={produto.id}>
                    <td className="px-4 py-3">
                      <span className="block truncate font-medium">
                        {produto.nome}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground md:hidden">
                        {produto.descricao || 'Sem descrição'}
                      </span>
                    </td>
                    <td className="hidden max-w-64 truncate px-4 py-3 text-muted-foreground md:table-cell">
                      {produto.descricao || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex rounded-md border border-border px-2 py-0.5 text-xs">
                        {produto.unidade}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <StockIndicator produto={produto} />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                          produto.ativo
                            ? 'bg-success/10 text-success-foreground'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {produto.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          aria-label={`Editar ${produto.nome}`}
                          className="flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          onClick={() => abrirEdicao(produto)}
                          title="Editar"
                          type="button"
                        >
                          <Pencil aria-hidden="true" className="size-4" />
                        </button>
                        <button
                          aria-label={`Excluir ${produto.nome}`}
                          className="flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          onClick={() => void removerProduto(produto)}
                          title="Excluir"
                          type="button"
                        >
                          <Trash2 aria-hidden="true" className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!carregando && produtosFiltrados.length > 0 && (
          <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
            Exibindo {produtosFiltrados.length} de {produtos.length} produtos
          </div>
        )}
      </section>

      {dialogoAberto && (
        <ProdutoFormDialog
          erro={erro}
          onClose={() => {
            if (salvando) return
            setDialogoAberto(false)
            setProdutoEditando(null)
            setErro('')
          }}
          onSubmit={salvarProduto}
          produto={produtoEditando}
          salvando={salvando}
        />
      )}
    </section>
  )
}

export default Produtos
