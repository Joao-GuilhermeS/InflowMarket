import { useEffect, useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
  Search,
  Trash2,
  Truck,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  atualizarFornecedor,
  criarFornecedor,
  excluirFornecedor,
  listarFornecedores,
} from '../services/FornecedorService'
import type {
  CriarFornecedor,
  Fornecedor,
} from '../services/FornecedorService'
import { FornecedorFormDialog } from '../components/fornecedores/fornecedor-form-dialog'

type StatusFiltro = 'todos' | 'ativos' | 'inativos'

const TAMANHO_PAGINA = 8

function normalizarBusca(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
}

function apenasDigitos(valor: string): string {
  return valor.replace(/\D/g, '')
}

function iniciais(nome: string): string {
  return nome
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toLocaleUpperCase('pt-BR') ?? '')
    .join('')
}

function Fornecedores() {
  const { usuario } = useAuth()
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [erroCarregamento, setErroCarregamento] = useState('')
  const [busca, setBusca] = useState('')
  const [statusFiltro, setStatusFiltro] = useState<StatusFiltro>('todos')
  const [dialogoAberto, setDialogoAberto] = useState(false)
  const [fornecedorEditando, setFornecedorEditando] =
    useState<Fornecedor | null>(null)
  const [recarregar, setRecarregar] = useState(0)
  const [pagina, setPagina] = useState(1)

  useEffect(() => {
    let ativo = true

    listarFornecedores()
      .then((dados) => {
        if (!ativo) return
        setFornecedores(dados)
        setErroCarregamento('')
      })
      .catch((error: unknown) => {
        if (!ativo) return
        setErroCarregamento(
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar os fornecedores.',
        )
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => {
      ativo = false
    }
  }, [recarregar])

  const fornecedoresFiltrados = useMemo(() => {
    const consulta = normalizarBusca(busca.trim())
    const digitos = apenasDigitos(busca)

    return fornecedores.filter((fornecedor) => {
      if (statusFiltro === 'ativos' && !fornecedor.ativo) return false
      if (statusFiltro === 'inativos' && fornecedor.ativo) return false
      if (!consulta) return true

      return (
        [
          fornecedor.nome,
          fornecedor.email ?? '',
          fornecedor.endereco ?? '',
        ].some((valor) => normalizarBusca(valor).includes(consulta)) ||
        (digitos.length > 0 &&
          (apenasDigitos(fornecedor.documento ?? '').includes(digitos) ||
            apenasDigitos(fornecedor.telefone ?? '').includes(digitos)))
      )
    })
  }, [busca, fornecedores, statusFiltro])

  const quantidadeAtivos = fornecedores.filter(
    (fornecedor) => fornecedor.ativo,
  ).length
  const quantidadePaginas = Math.max(
    1,
    Math.ceil(fornecedoresFiltrados.length / TAMANHO_PAGINA),
  )
  const paginaAtual = Math.min(pagina, quantidadePaginas)
  const inicioPagina = (paginaAtual - 1) * TAMANHO_PAGINA
  const fornecedoresDaPagina = fornecedoresFiltrados.slice(
    inicioPagina,
    inicioPagina + TAMANHO_PAGINA,
  )
  const mensagemErro = erroCarregamento || erro

  function abrirNovoFornecedor() {
    setErro('')
    setFornecedorEditando(null)
    setDialogoAberto(true)
  }

  function abrirEdicao(fornecedor: Fornecedor) {
    setErro('')
    setFornecedorEditando(fornecedor)
    setDialogoAberto(true)
  }

  async function salvarFornecedor(
    dados: Omit<CriarFornecedor, 'tenant_id'>,
  ): Promise<void> {
    if (!usuario?.tenant_id) {
      setErro('Usuário não possui um tenant associado.')
      return
    }

    try {
      setErro('')
      setSalvando(true)

      if (fornecedorEditando) {
        await atualizarFornecedor(fornecedorEditando.id, dados)
      } else {
        await criarFornecedor({
          ...dados,
          tenant_id: usuario.tenant_id,
        })
      }

      setDialogoAberto(false)
      setFornecedorEditando(null)
      setCarregando(true)
      setRecarregar((valor) => valor + 1)
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível salvar o fornecedor.',
      )
    } finally {
      setSalvando(false)
    }
  }

  async function removerFornecedor(fornecedor: Fornecedor) {
    const confirmar = window.confirm(
      `Deseja realmente excluir o fornecedor "${fornecedor.nome}"?`,
    )

    if (!confirmar) return

    try {
      setErro('')
      await excluirFornecedor(fornecedor.id)
      setCarregando(true)
      setRecarregar((valor) => valor + 1)
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível excluir o fornecedor.',
      )
    }
  }

  function tentarNovamente() {
    setErro('')
    setErroCarregamento('')
    setCarregando(true)
    setRecarregar((valor) => valor + 1)
  }

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
            Compras
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Fornecedores
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {fornecedores.length}{' '}
            {usuario?.tenant_id
              ? 'fornecedores cadastrados nesta loja.'
              : 'fornecedores visíveis para sua conta.'}
            {quantidadeAtivos > 0 && (
              <>
                {' · '}
                <span className="font-medium text-success-foreground">
                  {quantidadeAtivos} ativos
                </span>
              </>
            )}
          </p>
        </div>
        <button
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={abrirNovoFornecedor}
          type="button"
        >
          <Plus aria-hidden="true" className="size-4" />
          Novo fornecedor
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
              onChange={(event) => {
                setBusca(event.currentTarget.value)
                setPagina(1)
              }}
              placeholder="Buscar por nome, documento, telefone ou e-mail..."
              type="search"
              value={busca}
            />
          </label>
          <label className="sr-only" htmlFor="fornecedores-status">
            Filtrar por status
          </label>
          <select
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-44"
            id="fornecedores-status"
            onChange={(event) => {
              setStatusFiltro(event.currentTarget.value as StatusFiltro)
              setPagina(1)
            }}
            value={statusFiltro}
          >
            <option value="todos">Todos os status</option>
            <option value="ativos">Ativos</option>
            <option value="inativos">Inativos</option>
          </select>
        </div>

        {carregando ? (
          <div
            aria-live="polite"
            className="flex min-h-48 items-center justify-center text-sm text-muted-foreground"
          >
            Carregando fornecedores...
          </div>
        ) : erroCarregamento && fornecedores.length === 0 ? (
          <div className="flex min-h-48 items-center justify-center p-6 text-sm text-muted-foreground">
            A lista de fornecedores não está disponível.
          </div>
        ) : fornecedoresFiltrados.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center gap-3 p-6 text-center">
            <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Truck aria-hidden="true" className="size-5" />
            </span>
            <div>
              <h2 className="font-medium">
                {fornecedores.length === 0
                  ? 'Nenhum fornecedor cadastrado'
                  : 'Nenhum fornecedor encontrado'}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {fornecedores.length === 0
                  ? 'Cadastre seu primeiro fornecedor para começar.'
                  : 'Ajuste a busca ou o status selecionado.'}
              </p>
            </div>
            {fornecedores.length === 0 && (
              <button
                className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium hover:bg-accent"
                onClick={abrirNovoFornecedor}
                type="button"
              >
                <Plus aria-hidden="true" className="size-4" />
                Novo fornecedor
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[960px] text-left text-sm">
                <thead className="bg-muted/50 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Nome</th>
                    <th className="px-4 py-3">Documento</th>
                    <th className="px-4 py-3">Telefone</th>
                    <th className="px-4 py-3">E-mail</th>
                    <th className="px-4 py-3">Endereço</th>
                    <th className="px-4 py-3">Status</th>
                    <th aria-label="Ações" className="px-4 py-3 text-right" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {fornecedoresDaPagina.map((fornecedor) => (
                    <tr className="hover:bg-muted/30" key={fornecedor.id}>
                      <td className="px-4 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                            {iniciais(fornecedor.nome)}
                          </span>
                          <span className="truncate font-medium">
                            {fornecedor.nome}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs tabular-nums">
                        {fornecedor.documento || '—'}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {fornecedor.telefone || '—'}
                      </td>
                      <td className="max-w-56 truncate px-4 py-3 text-muted-foreground">
                        {fornecedor.email || '—'}
                      </td>
                      <td className="max-w-56 truncate px-4 py-3 text-muted-foreground">
                        {fornecedor.endereco || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge ativo={fornecedor.ativo} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <AcoesFornecedor
                            fornecedor={fornecedor}
                            onEditar={abrirEdicao}
                            onExcluir={removerFornecedor}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="flex flex-col gap-3 p-3 md:hidden">
              {fornecedoresDaPagina.map((fornecedor) => (
                <li
                  className="rounded-lg border border-border bg-background p-4"
                  key={fornecedor.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                        {iniciais(fornecedor.nome)}
                      </span>
                      <span className="truncate font-medium">
                        {fornecedor.nome}
                      </span>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <AcoesFornecedor
                        fornecedor={fornecedor}
                        onEditar={abrirEdicao}
                        onExcluir={removerFornecedor}
                      />
                    </div>
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    <div className="min-w-0">
                      <dt className="text-xs text-muted-foreground">
                        Documento
                      </dt>
                      <dd className="truncate font-mono text-xs">
                        {fornecedor.documento || '—'}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs text-muted-foreground">
                        Telefone
                      </dt>
                      <dd className="truncate">
                        {fornecedor.telefone || '—'}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs text-muted-foreground">E-mail</dt>
                      <dd className="truncate">{fornecedor.email || '—'}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs text-muted-foreground">
                        Endereço
                      </dt>
                      <dd className="truncate">
                        {fornecedor.endereco || '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Status</dt>
                      <dd className="mt-1">
                        <StatusBadge ativo={fornecedor.ativo} />
                      </dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>

            <nav
              aria-label="Paginação dos fornecedores"
              className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm text-muted-foreground sm:flex-row"
            >
              <p>
                Exibindo{' '}
                <span className="font-medium text-foreground">
                  {inicioPagina + 1}
                </span>
                –
                <span className="font-medium text-foreground">
                  {inicioPagina + fornecedoresDaPagina.length}
                </span>{' '}
                de{' '}
                <span className="font-medium text-foreground">
                  {fornecedoresFiltrados.length}
                </span>{' '}
                fornecedores
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

      {dialogoAberto && (
        <FornecedorFormDialog
          erro={erro}
          fornecedor={fornecedorEditando}
          onClose={() => {
            if (salvando) return
            setDialogoAberto(false)
            setFornecedorEditando(null)
            setErro('')
          }}
          onSubmit={salvarFornecedor}
          salvando={salvando}
        />
      )}
    </section>
  )
}

function StatusBadge({ ativo }: { ativo: boolean }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${
        ativo
          ? 'bg-success/10 text-success-foreground'
          : 'bg-muted text-muted-foreground'
      }`}
    >
      {ativo ? 'Ativo' : 'Inativo'}
    </span>
  )
}

function AcoesFornecedor({
  fornecedor,
  onEditar,
  onExcluir,
}: {
  fornecedor: Fornecedor
  onEditar: (fornecedor: Fornecedor) => void
  onExcluir: (fornecedor: Fornecedor) => void
}) {
  return (
    <>
      <button
        aria-label={`Editar ${fornecedor.nome}`}
        className="flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => onEditar(fornecedor)}
        title="Editar"
        type="button"
      >
        <Pencil aria-hidden="true" className="size-4" />
      </button>
      <button
        aria-label={`Excluir ${fornecedor.nome}`}
        className="flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => void onExcluir(fornecedor)}
        title="Excluir"
        type="button"
      >
        <Trash2 aria-hidden="true" className="size-4" />
      </button>
    </>
  )
}

export default Fornecedores
