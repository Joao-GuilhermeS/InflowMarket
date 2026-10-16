import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  Minus,
  Package,
  Plus,
  Printer,
  Search,
  ShoppingCart,
  Trash2,
  UserRound,
  X,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCarrinho } from '../hooks/useCarrinho'
import type { ItemCarrinho } from '../hooks/useCarrinho'
import { listarClientes } from '../services/ClienteService'
import type { Cliente } from '../services/ClienteService'
import { listarProdutos } from '../services/ProdutoService'
import type { Produto } from '../services/ProdutoService'
import {
  finalizarVenda,
  listarVendedores,
} from '../services/VendaService'
import type { Vendedor } from '../services/VendaService'

type FormaPagamento = 'DINHEIRO' | 'CARTAO' | 'PIX'
type CampoRapido = 'quantidade' | 'preco_unitario'

const formasPagamento: { value: FormaPagamento; label: string }[] = [
  { value: 'DINHEIRO', label: 'Dinheiro' },
  { value: 'CARTAO', label: 'Cartão' },
  { value: 'PIX', label: 'Pix' },
]

const moeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function formatarMoeda(valor: number) {
  return moeda.format(valor)
}

function normalizarTexto(valor: string) {
  return valor.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

function clienteBalcao(cliente: Cliente) {
  return (
    cliente.tipo === 'BALCAO' ||
    normalizarTexto(cliente.nome.trim()) === 'balcao'
  )
}

function dataVencimento(dias: number) {
  const data = new Date()
  data.setDate(data.getDate() + dias)
  return new Intl.DateTimeFormat('pt-BR').format(data)
}

function PDV() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const {
    itens,
    total,
    quantidadeTotal,
    adicionarProduto,
    definirQuantidade,
    definirPreco,
    removerProduto,
    limpar,
  } = useCarrinho()

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [clienteId, setClienteId] = useState('')
  const [vendedorId, setVendedorId] = useState('')
  const [buscaCliente, setBuscaCliente] = useState('')
  const [buscaProduto, setBuscaProduto] = useState('')
  const [tipoVenda, setTipoVenda] = useState<'AVISTA' | 'PRAZO'>('AVISTA')
  const [formaPagamento, setFormaPagamento] =
    useState<FormaPagamento>('DINHEIRO')
  const [prazoDias, setPrazoDias] = useState(7)
  const [carregando, setCarregando] = useState(true)
  const [recarregarDados, setRecarregarDados] = useState(0)
  const [finalizando, setFinalizando] = useState(false)
  const [erro, setErro] = useState('')
  const [aviso, setAviso] = useState('')
  const [clienteAberto, setClienteAberto] = useState(false)
  const [produtoAberto, setProdutoAberto] = useState(false)
  const [vendaConcluida, setVendaConcluida] = useState<string | null>(null)
  const [alvoRapido, setAlvoRapido] = useState<{
    item: ItemCarrinho
    campo: CampoRapido
    texto: string
  } | null>(null)
  const finalizandoRef = useRef(false)
  const buscaProdutoRef = useRef<HTMLInputElement>(null)
  const tenantId = usuario?.tenant_id
  const usuarioId = usuario?.id

  useEffect(() => {
    if (!tenantId || !usuarioId) return

    let ativo = true

    async function carregarDados(tenantId: string, usuarioId: string) {
      try {
        const [clientesData, produtosData, vendedoresData] =
          await Promise.all([
            listarClientes(),
            listarProdutos(),
            listarVendedores(tenantId),
          ])
        if (!ativo) return

        const clientesAtivos = clientesData.filter(
          (cliente) => cliente.ativo && cliente.tenant_id === tenantId,
        )
        const produtosAtivos = produtosData.filter(
          (produto) => produto.ativo && produto.tenant_id === tenantId,
        )

        setClientes(clientesAtivos)
        setProdutos(produtosAtivos)
        setVendedores(vendedoresData)
        setErro('')

        const balcao = clientesAtivos.find(clienteBalcao)
        const clienteInicial = balcao ?? clientesAtivos[0]
        if (clienteInicial) {
          setClienteId(clienteInicial.id)
          setBuscaCliente(clienteInicial.nome)
        }

        const vendedorInicial =
          vendedoresData.find((vendedor) => vendedor.id === usuarioId) ??
          vendedoresData[0]
        if (vendedorInicial) setVendedorId(vendedorInicial.id)
      } catch (error) {
        if (!ativo) return
        setErro(
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar os dados do PDV.',
        )
      } finally {
        if (ativo) setCarregando(false)
      }
    }

    void carregarDados(tenantId, usuarioId)
    return () => {
      ativo = false
    }
  }, [recarregarDados, tenantId, usuarioId])

  const clienteSelecionado = useMemo(
    () => clientes.find((cliente) => cliente.id === clienteId) ?? null,
    [clientes, clienteId],
  )

  const ehBalcao = clienteSelecionado
    ? clienteBalcao(clienteSelecionado)
    : false

  const clientesFiltrados = useMemo(() => {
    const consulta = normalizarTexto(buscaCliente.trim())
    if (!consulta) return clientes.slice(0, 8)

    return clientes
      .filter((cliente) => normalizarTexto(cliente.nome).includes(consulta))
      .slice(0, 8)
  }, [buscaCliente, clientes])

  const produtosFiltrados = useMemo(() => {
    const consulta = normalizarTexto(buscaProduto.trim())
    if (!consulta) return []

    return produtos
      .filter((produto) => normalizarTexto(produto.nome).includes(consulta))
      .slice(0, 8)
  }, [buscaProduto, produtos])

  useEffect(() => {
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === 'F2') {
        event.preventDefault()
        buscaProdutoRef.current?.focus()
      }

      if (event.key === 'Escape') {
        if (vendaConcluida) {
          handleNovaVenda()
        }
        setClienteAberto(false)
        setProdutoAberto(false)
      }

      if (event.key === 'Enter' && event.ctrlKey) {
        event.preventDefault()
        void handleFinalizar()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  })

  function handleAdicionarProduto(produto: Produto) {
    adicionarProduto(produto)
    setBuscaProduto('')
    setProdutoAberto(false)
    setAviso(`${produto.nome} adicionado ao carrinho`)
    window.setTimeout(() => setAviso(''), 2400)
  }

  function handleBuscaProdutoKeyDown(
    event: KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key !== 'Enter') return
    event.preventDefault()

    const consulta = normalizarTexto(buscaProduto.trim())
    const exato = produtos.find(
      (produto) => normalizarTexto(produto.nome) === consulta,
    )
    const produto = exato ?? produtosFiltrados[0]
    if (produto) handleAdicionarProduto(produto)
  }

  function handleSelecionarCliente(cliente: Cliente) {
    setClienteId(cliente.id)
    setBuscaCliente(cliente.nome)
    setClienteAberto(false)

    if (clienteBalcao(cliente) && tipoVenda === 'PRAZO') {
      setTipoVenda('AVISTA')
      setPrazoDias(7)
      setAviso('Cliente Balcão: a venda foi alterada para à vista')
      window.setTimeout(() => setAviso(''), 3000)
    }
  }

  function handleSelecionarTipo(tipo: 'AVISTA' | 'PRAZO') {
    if (tipo === 'PRAZO' && ehBalcao) return
    setTipoVenda(tipo)
  }

  function handleQuantidade(item: ItemCarrinho, valor: string) {
    const quantidade = Number(valor.replace(',', '.'))
    setAlvoRapido({ item, campo: 'quantidade', texto: valor })
    if (Number.isFinite(quantidade) && quantidade > 0) {
      definirQuantidade(item.produto.id, quantidade)
    }
  }

  function handlePreco(item: ItemCarrinho, valor: string) {
    const preco = Number(valor.replace(',', '.'))
    setAlvoRapido({ item, campo: 'preco_unitario', texto: valor })
    if (Number.isFinite(preco) && preco >= 0) {
      definirPreco(item.produto.id, preco)
    }
  }

  function handleTecladoRapido(tecla: string) {
    if (!alvoRapido) return

    const texto =
      tecla === 'apagar'
        ? alvoRapido.texto.slice(0, -1)
        : tecla === ','
          ? alvoRapido.texto.includes(',') || alvoRapido.texto.includes('.')
            ? alvoRapido.texto
            : `${alvoRapido.texto},`
          : `${alvoRapido.texto}${tecla}`

    setAlvoRapido({ ...alvoRapido, texto })
    const valor = Number(texto.replace(',', '.'))
    if (!Number.isFinite(valor)) return

    if (alvoRapido.campo === 'quantidade' && valor > 0) {
      definirQuantidade(alvoRapido.item.produto.id, valor)
    } else if (alvoRapido.campo === 'preco_unitario' && valor >= 0) {
      definirPreco(alvoRapido.item.produto.id, valor)
    }
  }

  async function handleFinalizar() {
    if (finalizandoRef.current || vendaConcluida) return

    if (!tenantId) {
      setErro('Seu usuário não está vinculado a uma loja.')
      return
    }

    if (!clienteSelecionado) {
      setErro('Selecione um cliente para a venda.')
      return
    }

    if (!vendedorId) {
      setErro('Selecione um vendedor.')
      return
    }

    if (itens.length === 0) {
      setErro('Adicione pelo menos um produto ao carrinho.')
      return
    }

    if (itens.some((item) => item.preco_unitario <= 0)) {
      setErro('Informe um preço maior que zero para cada produto.')
      return
    }

    if (itens.some((item) => item.quantidade <= 0)) {
      setErro('Informe uma quantidade válida para cada produto.')
      return
    }

    if (total <= 0) {
      setErro('O valor total da venda deve ser maior que zero.')
      return
    }

    try {
      setErro('')
      finalizandoRef.current = true
      setFinalizando(true)
      const vendaId = await finalizarVenda({
        tenantId,
        clienteId: clienteSelecionado.id,
        vendedorId,
        tipoVenda,
        formaPagamento: tipoVenda === 'AVISTA' ? formaPagamento : null,
        prazoDias: tipoVenda === 'PRAZO' ? prazoDias : null,
        itens,
      })
      setVendaConcluida(vendaId)
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível finalizar a venda.',
      )
    } finally {
      finalizandoRef.current = false
      setFinalizando(false)
    }
  }

  function handleNovaVenda() {
    limpar()
    setVendaConcluida(null)
    setErro('')
    setFormaPagamento('DINHEIRO')
    setTipoVenda('AVISTA')
    setPrazoDias(7)
    const balcao = clientes.find(clienteBalcao)
    const inicial = balcao ?? clientes[0]
    setClienteId(inicial?.id ?? '')
    setBuscaCliente(inicial?.nome ?? '')
    setAlvoRapido(null)
    buscaProdutoRef.current?.focus()
  }

  if (!tenantId) {
    return (
      <section className="pdv-page">
        <div className="page-heading">
          <div>
            <div className="eyebrow">OPERAÇÃO DE CAIXA</div>
            <h1>Nova venda</h1>
          </div>
        </div>
        <div className="alert alert--error" role="alert">
          <AlertTriangle size={18} />
          Seu usuário não está vinculado a uma loja e não pode vender.
        </div>
      </section>
    )
  }

  if (carregando) {
    return (
      <div className="pdv-loading">
        <span className="loading-spinner" aria-hidden="true" />
        <span>Preparando o caixa...</span>
      </div>
    )
  }

  function handleRetry() {
    setErro('')
    setCarregando(true)
    setRecarregarDados((valor) => valor + 1)
  }

  return (
    <section className="pdv-page">
      <div className="page-heading pdv-heading">
        <div>
          <div className="eyebrow">OPERAÇÃO DE CAIXA</div>
          <h1>Nova venda</h1>
          <p>Atenda rápido, confira o carrinho e finalize em poucos toques.</p>
        </div>
        <div className="pdv-shortcut">
          <span>Atalho de busca</span>
          <kbd>F2</kbd>
        </div>
      </div>

      {erro && (
        <div className="alert alert--error" role="alert">
          <AlertTriangle size={18} />
          <span>{erro}</span>
          {erro.includes('Não foi possível carregar') && (
            <button className="alert-action" onClick={handleRetry}>
              Tentar novamente
            </button>
          )}
        </div>
      )}

      {aviso && (
        <div className="toast-message" role="status">
          <CheckCircle2 size={18} />
          {aviso}
        </div>
      )}

      {clientes.length === 0 && !erro && (
        <div className="alert alert--warning" role="status">
          <AlertTriangle size={18} />
          Cadastre um cliente, incluindo o cliente Balcão, antes de vender.
        </div>
      )}

      {produtos.length === 0 && !erro && (
        <div className="alert alert--warning" role="status">
          <Package size={18} />
          Não há produtos ativos nesta loja.
        </div>
      )}

      {vendedores.length === 0 && !erro && (
        <div className="alert alert--warning" role="status">
          <UserRound size={18} />
          Não há vendedores ativos associados a esta loja.
        </div>
      )}

      <div className="pdv-layout">
        <div className="pdv-main-column">
          <section className="pdv-card pdv-sale-details">
            <div className="card-title-row">
              <span className="section-icon">
                <UserRound size={17} />
              </span>
              <div>
                <h2>Atendimento</h2>
                <p>Cliente e vendedor desta venda</p>
              </div>
            </div>

            <div className="sale-details-grid">
              <div className="field-group customer-field">
                <label htmlFor="cliente-busca">Cliente</label>
                <div className="autocomplete-wrap">
                  <div className="input-with-icon">
                    <UserRound size={17} />
                    <input
                      autoComplete="off"
                      id="cliente-busca"
                      onBlur={() =>
                        window.setTimeout(() => setClienteAberto(false), 150)
                      }
                      onChange={(event) => {
                        setBuscaCliente(event.currentTarget.value)
                        setClienteId('')
                        setClienteAberto(true)
                      }}
                      onFocus={() => setClienteAberto(true)}
                      placeholder="Buscar cliente..."
                      value={buscaCliente}
                    />
                    <ChevronDown size={16} />
                  </div>
                  {clienteAberto && clientesFiltrados.length > 0 && (
                    <div className="autocomplete-list">
                      {clientesFiltrados.map((cliente) => (
                        <button
                          key={cliente.id}
                          className="autocomplete-option"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => handleSelecionarCliente(cliente)}
                        >
                          <span>{cliente.nome}</span>
                          <span>
                            {clienteBalcao(cliente) ? 'BALCÃO' : 'CLIENTE'}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {ehBalcao && (
                  <span className="field-hint field-hint--green">
                    À vista obrigatório para cliente Balcão
                  </span>
                )}
              </div>

              <div className="field-group">
                <label htmlFor="vendedor">Vendedor</label>
                <select
                  id="vendedor"
                  onChange={(event) => setVendedorId(event.currentTarget.value)}
                  value={vendedorId}
                >
                  <option value="">Selecione o vendedor</option>
                  {vendedores.map((vendedor) => (
                    <option key={vendedor.id} value={vendedor.id}>
                      {vendedor.nome}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="pdv-card product-search-card">
            <div className="card-title-row">
              <span className="section-icon">
                <Search size={17} />
              </span>
              <div>
                <h2>Adicionar produtos</h2>
                <p>Pesquise pelo nome do produto</p>
              </div>
            </div>

            <div className="product-search-wrap">
              <Search className="product-search-icon" size={20} />
              <input
                autoComplete="off"
                id="busca-produto"
                onBlur={() =>
                  window.setTimeout(() => setProdutoAberto(false), 150)
                }
                onChange={(event) => {
                  setBuscaProduto(event.currentTarget.value)
                  setProdutoAberto(true)
                }}
                onFocus={() => setProdutoAberto(true)}
                onKeyDown={handleBuscaProdutoKeyDown}
                placeholder="Digite o nome do produto..."
                ref={buscaProdutoRef}
                value={buscaProduto}
              />
              <kbd>F2</kbd>
              {produtoAberto && produtosFiltrados.length > 0 && (
                <div className="product-results">
                  {produtosFiltrados.map((produto) => (
                    <button
                      key={produto.id}
                      className="product-result"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleAdicionarProduto(produto)}
                    >
                      <span className="product-result-icon">
                        <Package size={17} />
                      </span>
                      <span className="product-result-copy">
                        <strong>{produto.nome}</strong>
                        <small>
                          Estoque: {Number(produto.quantidade_estoque)}{' '}
                          {produto.unidade}
                        </small>
                      </span>
                      <span
                        className={
                          Number(produto.quantidade_estoque) <= 0
                            ? 'stock-badge stock-badge--out'
                            : 'stock-badge'
                        }
                      >
                        {Number(produto.quantidade_estoque) <= 0
                          ? 'Sem estoque'
                          : `${produto.unidade}`}
                      </span>
                      <Plus size={18} />
                    </button>
                  ))}
                </div>
              )}
              {produtoAberto &&
                buscaProduto.trim() &&
                produtosFiltrados.length === 0 && (
                  <div className="product-results-empty">
                    Nenhum produto encontrado.
                  </div>
                )}
            </div>
          </section>

          <section className="pdv-card cart-card">
            <div className="card-title-row cart-title-row">
              <span className="section-icon">
                <ShoppingCart size={17} />
              </span>
              <div>
                <h2>Carrinho</h2>
                <p>
                  {itens.length} {itens.length === 1 ? 'produto' : 'produtos'}{' '}
                  · {quantidadeTotal} itens
                </p>
              </div>
              {itens.length > 0 && (
                <button
                  className="clear-cart-button"
                  onClick={limpar}
                  type="button"
                >
                  <Trash2 size={15} />
                  Limpar
                </button>
              )}
            </div>

            {itens.length === 0 ? (
              <div className="empty-cart">
                <span className="empty-cart-icon">
                  <ShoppingCart size={24} />
                </span>
                <strong>Seu carrinho está vazio</strong>
                <span>Busque um produto acima para começar a venda.</span>
              </div>
            ) : (
              <>
                <div className="cart-table-wrap">
                  <table className="cart-table">
                    <thead>
                      <tr>
                        <th>Produto</th>
                        <th>Quantidade</th>
                        <th>Preço unitário</th>
                        <th>Subtotal</th>
                        <th aria-label="Remover" />
                      </tr>
                    </thead>
                    <tbody>
                      {itens.map((item) => {
                        const estoque = Number(
                          item.produto.quantidade_estoque,
                        )
                        const estoqueInsuficiente =
                          estoque < 0 || item.quantidade > estoque

                        return (
                          <tr key={item.produto.id}>
                            <td>
                              <div className="cart-product">
                                <strong>{item.produto.nome}</strong>
                                <span>
                                  {item.produto.unidade}
                                  {estoqueInsuficiente && (
                                    <span
                                      className="stock-warning"
                                      title={`Estoque disponível: ${estoque} ${item.produto.unidade}. A venda não será bloqueada.`}
                                    >
                                      <AlertTriangle size={13} />
                                      Estoque insuficiente
                                    </span>
                                  )}
                                </span>
                              </div>
                            </td>
                            <td>
                              <div className="quantity-control">
                                <button
                                  aria-label={`Diminuir quantidade de ${item.produto.nome}`}
                                  onClick={() =>
                                    definirQuantidade(
                                      item.produto.id,
                                      Math.max(
                                        0.001,
                                        Number(
                                          (
                                            item.quantidade -
                                            (item.produto.unidade === 'UN'
                                              ? 1
                                              : 0.25)
                                          ).toFixed(3),
                                        ),
                                      ),
                                    )
                                  }
                                  type="button"
                                >
                                  <Minus size={14} />
                                </button>
                                <input
                                  aria-label={`Quantidade de ${item.produto.nome}`}
                                  inputMode="decimal"
                                  onChange={(event) =>
                                    handleQuantidade(
                                      item,
                                      event.currentTarget.value,
                                    )
                                  }
                                  onFocus={() =>
                                    setAlvoRapido({
                                      item,
                                      campo: 'quantidade',
                                      texto: String(item.quantidade),
                                    })
                                  }
                                  type="number"
                                  min="0.001"
                                  step={item.produto.unidade === 'UN' ? 1 : 0.001}
                                  value={item.quantidade}
                                />
                                <button
                                  aria-label={`Aumentar quantidade de ${item.produto.nome}`}
                                  onClick={() =>
                                    definirQuantidade(
                                      item.produto.id,
                                      Number(
                                        (
                                          item.quantidade +
                                          (item.produto.unidade === 'UN'
                                            ? 1
                                            : 0.25)
                                        ).toFixed(3),
                                      ),
                                    )
                                  }
                                  type="button"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                            </td>
                            <td>
                              <div className="price-input-wrap">
                                <span>R$</span>
                                <input
                                  aria-label={`Preço unitário de ${item.produto.nome}`}
                                  inputMode="decimal"
                                  min="0"
                                  onChange={(event) =>
                                    handlePreco(item, event.currentTarget.value)
                                  }
                                  onFocus={() =>
                                    setAlvoRapido({
                                      item,
                                      campo: 'preco_unitario',
                                      texto: String(item.preco_unitario),
                                    })
                                  }
                                  type="number"
                                  step="0.01"
                                  value={item.preco_unitario}
                                />
                              </div>
                              {item.preco_unitario === 0 && (
                                <span className="price-hint">
                                  Informe o preço
                                </span>
                              )}
                            </td>
                            <td className="cart-subtotal">
                              {formatarMoeda(
                                item.quantidade * item.preco_unitario,
                              )}
                            </td>
                            <td>
                              <button
                                aria-label={`Remover ${item.produto.nome}`}
                                className="remove-item-button"
                                onClick={() =>
                                  removerProduto(item.produto.id)
                                }
                                type="button"
                              >
                                <X size={17} />
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="touch-keypad" aria-label="Teclado numérico">
                  <div className="touch-keypad-label">
                    {alvoRapido
                      ? `Editando ${alvoRapido.campo === 'quantidade' ? 'quantidade' : 'preço'} · ${alvoRapido.item.produto.nome}`
                      : 'Toque em quantidade ou preço para editar'}
                  </div>
                  <div className="touch-keypad-keys">
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', 'apagar'].map(
                      (tecla) => (
                        <button
                          key={tecla}
                          onClick={() => handleTecladoRapido(tecla)}
                          onMouseDown={(event) => event.preventDefault()}
                          type="button"
                        >
                          {tecla === 'apagar' ? <X size={17} /> : tecla}
                        </button>
                      ),
                    )}
                  </div>
                </div>
              </>
            )}
          </section>
        </div>

        <aside className="pdv-checkout">
          <section className="pdv-card checkout-card">
            <div className="checkout-header">
              <span className="checkout-header-icon">
                <CircleDollarSign size={19} />
              </span>
              <div>
                <h2>Fechamento</h2>
                <p>Revise e conclua a venda</p>
              </div>
            </div>

            <div className="checkout-total">
              <span>Total da venda</span>
              <strong>{formatarMoeda(total)}</strong>
              <small>
                {quantidadeTotal} {quantidadeTotal === 1 ? 'item' : 'itens'}
              </small>
            </div>

            <div className="field-group">
              <label>Tipo de venda</label>
              <div className="sale-type-options">
                <button
                  className={
                    tipoVenda === 'AVISTA'
                      ? 'sale-type-option sale-type-option--selected'
                      : 'sale-type-option'
                  }
                  onClick={() => handleSelecionarTipo('AVISTA')}
                  type="button"
                >
                  <CheckCircle2 size={17} />
                  <span>
                    <strong>À vista</strong>
                    <small>Pagamento agora</small>
                  </span>
                </button>
                <button
                  className={[
                    'sale-type-option',
                    tipoVenda === 'PRAZO'
                      ? 'sale-type-option--selected'
                      : '',
                    ehBalcao ? 'sale-type-option--disabled' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  disabled={ehBalcao}
                  onClick={() => handleSelecionarTipo('PRAZO')}
                  title={
                    ehBalcao
                      ? 'Cliente Balcão não pode comprar a prazo'
                      : undefined
                  }
                  type="button"
                >
                  <Clock3 size={17} />
                  <span>
                    <strong>A prazo</strong>
                    <small>{ehBalcao ? 'Indisponível' : 'Receber depois'}</small>
                  </span>
                </button>
              </div>
            </div>

            {tipoVenda === 'AVISTA' ? (
              <div className="field-group payment-group">
                <label>Forma de pagamento</label>
                <div className="payment-options">
                  {formasPagamento.map((forma) => (
                    <button
                      key={forma.value}
                      className={
                        formaPagamento === forma.value
                          ? 'payment-option payment-option--selected'
                          : 'payment-option'
                      }
                      onClick={() => setFormaPagamento(forma.value)}
                      type="button"
                    >
                      {formaPagamento === forma.value && <Check size={14} />}
                      {forma.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="field-group payment-group">
                <label htmlFor="prazo-dias">Prazo para pagamento</label>
                <div className="deadline-control">
                  <input
                    id="prazo-dias"
                    max="365"
                    min="0"
                    onChange={(event) => {
                      const dias = Number(event.currentTarget.value)
                      if (Number.isInteger(dias) && dias >= 0 && dias <= 365) {
                        setPrazoDias(dias)
                      }
                    }}
                    type="number"
                    value={prazoDias}
                  />
                  <span>dias</span>
                </div>
                <span className="field-hint">
                  Vencimento em {dataVencimento(prazoDias)}
                </span>
              </div>
            )}

            <div className="checkout-divider" />
            <div className="checkout-breakdown">
              <span>Itens ({quantidadeTotal})</span>
              <strong>{formatarMoeda(total)}</strong>
            </div>
            <div className="checkout-breakdown checkout-breakdown--total">
              <span>Total a cobrar</span>
              <strong>{formatarMoeda(total)}</strong>
            </div>

            <button
              className="finish-sale-button"
              disabled={
                finalizando ||
                Boolean(vendaConcluida) ||
                itens.length === 0 ||
                !clienteId ||
                !vendedorId ||
                total <= 0
              }
              onClick={() => void handleFinalizar()}
              type="button"
            >
              {finalizando ? (
                <>
                  <span className="button-spinner" />
                  Finalizando...
                </>
              ) : (
                <>
                  Finalizar venda
                  <ArrowRight size={19} />
                </>
              )}
            </button>
            <span className="finish-shortcut">Ctrl + Enter para finalizar</span>
          </section>

          <div className="checkout-note">
            <CheckCircle2 size={16} />
            <span>
              O estoque pode ficar negativo; a venda não será bloqueada por
              falta de saldo.
            </span>
          </div>
        </aside>
      </div>

      {vendaConcluida && (
        <div
          className="modal-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              handleNovaVenda()
            }
          }}
        >
          <div
            aria-labelledby="sale-success-title"
            aria-modal="true"
            className="success-modal"
            role="dialog"
          >
            <button
              aria-label="Fechar"
              className="modal-close"
              onClick={handleNovaVenda}
              type="button"
            >
              <X size={19} />
            </button>
            <span className="success-icon">
              <CheckCircle2 size={30} />
            </span>
            <div className="eyebrow">VENDA CONCLUÍDA</div>
            <h2 id="sale-success-title">Tudo certo por aqui!</h2>
            <p>
              A venda foi finalizada com sucesso. Deseja imprimir o romaneio ou
              iniciar outra venda?
            </p>
            <div className="success-modal-actions">
              <button
                className="secondary-button"
                onClick={handleNovaVenda}
                type="button"
              >
                Nova venda
              </button>
              <button
                className="primary-button"
                onClick={() =>
                  navigate(`/vendas/${vendaConcluida}/romaneio`)
                }
                type="button"
              >
                <Printer size={17} />
                Ver romaneio
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default PDV
