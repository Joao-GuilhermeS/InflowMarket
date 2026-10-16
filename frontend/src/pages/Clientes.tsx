import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import {
  atualizarCliente,
  criarCliente,
  excluirCliente,
  listarClientes,
} from '../services/ClienteService'
import type {
  Cliente,
  CriarCliente,
} from '../services/ClienteService'
import { ClienteFormDialog } from '../components/clientes/cliente-form-dialog'

type TipoFiltro = 'TODOS' | Cliente['tipo']

const TAMANHO_PAGINA = 8

const rotulosTipo: Record<Cliente['tipo'], string> = {
  NORMAL: 'Normal',
  BALCAO: 'Balcão',
}

const estilosTipo: Record<Cliente['tipo'], string> = {
  NORMAL: 'bg-muted text-muted-foreground',
  BALCAO: 'bg-info/10 text-info-foreground',
}

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

function Clientes() {
  const { usuario } = useAuth()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [carregando, setCarregando] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')
  const [erroCarregamento, setErroCarregamento] = useState('')
  const [busca, setBusca] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState<TipoFiltro>('TODOS')
  const [dialogoAberto, setDialogoAberto] = useState(false)
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null)
  const [recarregar, setRecarregar] = useState(0)
  const [pagina, setPagina] = useState(1)

  useEffect(() => {
    let ativo = true

    listarClientes()
      .then((dados) => {
        if (!ativo) return
        setClientes(dados)
        setErroCarregamento('')
      })
      .catch((error: unknown) => {
        if (!ativo) return
        setErroCarregamento(
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar os clientes.',
        )
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => {
      ativo = false
    }
  }, [recarregar])

  const clientesFiltrados = useMemo(() => {
    const consulta = normalizarBusca(busca.trim())
    const digitos = apenasDigitos(busca)

    return clientes.filter((cliente) => {
      if (tipoFiltro !== 'TODOS' && cliente.tipo !== tipoFiltro) return false
      if (!consulta) return true

      return (
        normalizarBusca(cliente.nome).includes(consulta) ||
        normalizarBusca(cliente.email ?? '').includes(consulta) ||
        (digitos.length > 0 &&
          (apenasDigitos(cliente.cpf_cnpj ?? '').includes(digitos) ||
            apenasDigitos(cliente.telefone ?? '').includes(digitos)))
      )
    })
  }, [busca, clientes, tipoFiltro])

  const quantidadePaginas = Math.max(
    1,
    Math.ceil(clientesFiltrados.length / TAMANHO_PAGINA),
  )
  const paginaAtual = Math.min(pagina, quantidadePaginas)
  const inicioPagina = (paginaAtual - 1) * TAMANHO_PAGINA
  const clientesDaPagina = clientesFiltrados.slice(
    inicioPagina,
    inicioPagina + TAMANHO_PAGINA,
  )

  function abrirNovoCliente() {
    setErro('')
    setClienteEditando(null)
    setDialogoAberto(true)
  }

  function abrirEdicao(cliente: Cliente) {
    setErro('')
    setClienteEditando(cliente)
    setDialogoAberto(true)
  }

  async function salvarCliente(
    dados: Omit<CriarCliente, 'tenant_id'>,
  ): Promise<void> {
    if (!usuario?.tenant_id) {
      setErro('Usuário não possui um tenant associado.')
      return
    }

    try {
      setErro('')
      setSalvando(true)

      if (clienteEditando) {
        await atualizarCliente(clienteEditando.id, dados)
      } else {
        await criarCliente({
          ...dados,
          tenant_id: usuario.tenant_id,
        })
      }

      setDialogoAberto(false)
      setClienteEditando(null)
      setCarregando(true)
      setRecarregar((valor) => valor + 1)
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível salvar o cliente.',
      )
    } finally {
      setSalvando(false)
    }
  }

  async function removerCliente(cliente: Cliente) {
    const confirmar = window.confirm(
      `Deseja realmente excluir o cliente "${cliente.nome}"?`,
    )

    if (!confirmar) return

    try {
      setErro('')
      await excluirCliente(cliente.id)
      setCarregando(true)
      setRecarregar((valor) => valor + 1)
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível excluir o cliente.',
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
            Relacionamento
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Clientes
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {clientes.length}{' '}
            {usuario?.tenant_id
              ? 'clientes cadastrados nesta loja.'
              : 'clientes visíveis para sua conta.'}
          </p>
        </div>
        <button
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={abrirNovoCliente}
          type="button"
        >
          <Plus aria-hidden="true" className="size-4" />
          Novo cliente
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
              placeholder="Buscar por nome, CPF/CNPJ ou e-mail..."
              type="search"
              value={busca}
            />
          </label>
          <label className="sr-only" htmlFor="clientes-tipo">
            Filtrar por tipo
          </label>
          <select
            className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-44"
            id="clientes-tipo"
            onChange={(event) => {
              setTipoFiltro(event.currentTarget.value as TipoFiltro)
              setPagina(1)
            }}
            value={tipoFiltro}
          >
            <option value="TODOS">Todos os tipos</option>
            {Object.entries(rotulosTipo).map(([tipo, rotulo]) => (
              <option key={tipo} value={tipo}>
                {rotulo}
              </option>
            ))}
          </select>
        </div>

        {carregando ? (
          <div
            aria-live="polite"
            className="flex min-h-48 items-center justify-center text-sm text-muted-foreground"
          >
            Carregando clientes...
          </div>
        ) : erroCarregamento && clientes.length === 0 ? (
          <div className="flex min-h-48 items-center justify-center p-6 text-sm text-muted-foreground">
            A lista de clientes não está disponível.
          </div>
        ) : clientesFiltrados.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center gap-3 p-6 text-center">
            <span className="flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Users aria-hidden="true" className="size-5" />
            </span>
            <div>
              <h2 className="font-medium">
                {clientes.length === 0
                  ? 'Nenhum cliente cadastrado'
                  : 'Nenhum cliente encontrado'}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {clientes.length === 0
                  ? 'Cadastre seu primeiro cliente para começar.'
                  : 'Ajuste a busca ou o tipo selecionado.'}
              </p>
            </div>
            {clientes.length === 0 && (
              <button
                className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium hover:bg-accent"
                onClick={abrirNovoCliente}
                type="button"
              >
                <Plus aria-hidden="true" className="size-4" />
                Novo cliente
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="bg-muted/50 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Nome</th>
                    <th className="px-4 py-3">CPF/CNPJ</th>
                    <th className="px-4 py-3">Telefone</th>
                    <th className="px-4 py-3">E-mail</th>
                    <th className="px-4 py-3">Tipo</th>
                    <th aria-label="Ações" className="px-4 py-3 text-right" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {clientesDaPagina.map((cliente) => (
                    <tr className="hover:bg-muted/30" key={cliente.id}>
                      <td className="px-4 py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                            {iniciais(cliente.nome)}
                          </span>
                          <span className="truncate font-medium">
                            {cliente.nome}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs tabular-nums">
                        {cliente.cpf_cnpj || '—'}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {cliente.telefone || '—'}
                      </td>
                      <td className="max-w-56 truncate px-4 py-3 text-muted-foreground">
                        {cliente.email || '—'}
                      </td>
                      <td className="px-4 py-3">
                        <TipoBadge tipo={cliente.tipo} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <AcoesCliente
                            cliente={cliente}
                            onEditar={abrirEdicao}
                            onExcluir={removerCliente}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="flex flex-col gap-3 p-3 md:hidden">
              {clientesDaPagina.map((cliente) => (
                <li
                  className="rounded-lg border border-border bg-background p-4"
                  key={cliente.id}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                        {iniciais(cliente.nome)}
                      </span>
                      <span className="truncate font-medium">{cliente.nome}</span>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <AcoesCliente
                        cliente={cliente}
                        onEditar={abrirEdicao}
                        onExcluir={removerCliente}
                      />
                    </div>
                  </div>
                  <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                    <div className="min-w-0">
                      <dt className="text-xs text-muted-foreground">CPF/CNPJ</dt>
                      <dd className="truncate font-mono text-xs">
                        {cliente.cpf_cnpj || '—'}
                      </dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs text-muted-foreground">Telefone</dt>
                      <dd className="truncate">{cliente.telefone || '—'}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-xs text-muted-foreground">E-mail</dt>
                      <dd className="truncate">{cliente.email || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">Tipo</dt>
                      <dd className="mt-1">
                        <TipoBadge tipo={cliente.tipo} />
                      </dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>

            <nav
              aria-label="Paginação dos clientes"
              className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm text-muted-foreground sm:flex-row"
            >
              <p>
                Exibindo{' '}
                <span className="font-medium text-foreground">
                  {inicioPagina + 1}
                </span>
                –
                <span className="font-medium text-foreground">
                  {inicioPagina + clientesDaPagina.length}
                </span>{' '}
                de{' '}
                <span className="font-medium text-foreground">
                  {clientesFiltrados.length}
                </span>{' '}
                clientes
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
        <ClienteFormDialog
          cliente={clienteEditando}
          erro={erro}
          onClose={() => {
            if (salvando) return
            setDialogoAberto(false)
            setClienteEditando(null)
            setErro('')
          }}
          onSubmit={salvarCliente}
          salvando={salvando}
        />
      )}
    </section>
  )
}

function TipoBadge({ tipo }: { tipo: Cliente['tipo'] }) {
  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium ${estilosTipo[tipo]}`}
    >
      {rotulosTipo[tipo]}
    </span>
  )
}

function AcoesCliente({
  cliente,
  onEditar,
  onExcluir,
}: {
  cliente: Cliente
  onEditar: (cliente: Cliente) => void
  onExcluir: (cliente: Cliente) => void
}) {
  return (
    <>
      <button
        aria-label={`Editar ${cliente.nome}`}
        className="flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => onEditar(cliente)}
        title="Editar"
        type="button"
      >
        <Pencil aria-hidden="true" className="size-4" />
      </button>
      <button
        aria-label={`Excluir ${cliente.nome}`}
        className="flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => void onExcluir(cliente)}
        title="Excluir"
        type="button"
      >
        <Trash2 aria-hidden="true" className="size-4" />
      </button>
    </>
  )
}

export default Clientes
