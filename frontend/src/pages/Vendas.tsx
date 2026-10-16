import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Eye, Search, ShoppingBag } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { listarVendas } from '../services/VendaService'
import type { VendaResumo } from '../services/VendaService'

type FiltroPeriodo = '30' | '90' | 'todos'
type FiltroStatus = 'TODOS' | VendaResumo['status']

const moeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

const rotulosStatus: Record<VendaResumo['status'], string> = {
  EM_ABERTO: 'Em aberto',
  PAGA: 'Paga',
  VENCIDA: 'Vencida',
  CANCELADA: 'Cancelada',
}

function Vendas() {
  const { usuario } = useAuth()
  const [vendas, setVendas] = useState<VendaResumo[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [buscaCliente, setBuscaCliente] = useState('')
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('TODOS')
  const [filtroPeriodo, setFiltroPeriodo] = useState<FiltroPeriodo>('30')
  const [recarregar, setRecarregar] = useState(0)
  const [dataReferencia] = useState(() => Date.now())
  const tenantId = usuario?.tenant_id

  useEffect(() => {
    if (!tenantId) return

    let ativo = true

    async function carregarVendas(tenantId: string) {
      try {
        const dados = await listarVendas(tenantId)
        if (!ativo) return
        setVendas(dados)
        setErro('')
      } catch (error) {
        if (!ativo) return
        setErro(
          error instanceof Error
            ? error.message
            : 'Não foi possível carregar as vendas.',
        )
      } finally {
        if (ativo) setCarregando(false)
      }
    }

    void carregarVendas(tenantId)
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
    const consulta = buscaCliente.trim().toLocaleLowerCase('pt-BR')

    return vendas.filter((venda) => {
      const dataVenda = new Date(venda.dataVenda)
      const combinaPeriodo = !limite || dataVenda >= limite
      const combinaStatus =
        filtroStatus === 'TODOS' || venda.status === filtroStatus
      const combinaCliente =
        !consulta || venda.cliente.toLocaleLowerCase('pt-BR').includes(consulta)

      return combinaPeriodo && combinaStatus && combinaCliente
    })
  }, [buscaCliente, dataReferencia, filtroPeriodo, filtroStatus, vendas])

  if (!tenantId) {
    return (
      <section>
        <div className="page-heading">
          <div>
            <div className="eyebrow">OPERAÇÃO</div>
            <h1>Vendas</h1>
          </div>
        </div>
        <div className="alert alert--error" role="alert">
          Seu usuário não está vinculado a uma loja.
        </div>
      </section>
    )
  }

  return (
    <section className="sales-page">
      <div className="page-heading">
        <div>
          <div className="eyebrow">OPERAÇÃO DE CAIXA</div>
          <h1>Vendas</h1>
          <p>Acompanhe as vendas registradas pela sua loja.</p>
        </div>
        <Link className="primary-button new-sale-link" to="/pdv">
          <ShoppingBag size={17} />
          Nova venda
        </Link>
      </div>

      {erro && (
        <div className="alert alert--error" role="alert">
          {erro}
          <button
            className="alert-action"
            onClick={() => {
              setErro('')
              setCarregando(true)
              setRecarregar((valor) => valor + 1)
            }}
            type="button"
          >
            Tentar novamente
          </button>
        </div>
      )}

      <div className="sales-filters">
        <label className="sales-search">
          <Search size={17} />
          <input
            onChange={(event) => setBuscaCliente(event.currentTarget.value)}
            placeholder="Filtrar por cliente..."
            value={buscaCliente}
          />
        </label>

        <label className="sales-filter">
          <span>Status</span>
          <select
            onChange={(event) =>
              setFiltroStatus(event.currentTarget.value as FiltroStatus)
            }
            value={filtroStatus}
          >
            <option value="TODOS">Todos os status</option>
            {Object.entries(rotulosStatus).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <label className="sales-filter">
          <CalendarDays size={15} />
          <select
            aria-label="Período das vendas"
            onChange={(event) =>
              setFiltroPeriodo(event.currentTarget.value as FiltroPeriodo)
            }
            value={filtroPeriodo}
          >
            <option value="30">Últimos 30 dias</option>
            <option value="90">Últimos 90 dias</option>
            <option value="todos">Todo o período</option>
          </select>
        </label>
      </div>

      <div className="sales-table-card">
        <div className="sales-table-heading">
          <div>
            <strong>Histórico de vendas</strong>
            <span>
              {vendasFiltradas.length} registro
              {vendasFiltradas.length === 1 ? '' : 's'}
            </span>
          </div>
          <span>Até 100 vendas mais recentes</span>
        </div>

        {carregando ? (
          <div className="sales-loading">
            <span className="loading-spinner" aria-hidden="true" />
            Carregando vendas...
          </div>
        ) : vendasFiltradas.length === 0 ? (
          <div className="sales-empty">
            <ShoppingBag size={24} />
            <strong>Nenhuma venda encontrada</strong>
            <span>
              Ajuste os filtros ou registre uma nova venda no caixa.
            </span>
          </div>
        ) : (
          <div className="sales-table-wrap">
            <table className="sales-table">
              <thead>
                <tr>
                  <th>Venda</th>
                  <th>Data</th>
                  <th>Cliente</th>
                  <th>Vendedor</th>
                  <th>Tipo</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th aria-label="Ações" />
                </tr>
              </thead>
              <tbody>
                {vendasFiltradas.map((venda) => (
                  <tr key={venda.id}>
                    <td className="sales-number">#{venda.numero}</td>
                    <td>
                      {new Intl.DateTimeFormat('pt-BR', {
                        dateStyle: 'short',
                        timeStyle: 'short',
                      }).format(new Date(venda.dataVenda))}
                    </td>
                    <td>{venda.cliente}</td>
                    <td>{venda.vendedor}</td>
                    <td>
                      {venda.tipoVenda === 'AVISTA' ? 'À vista' : 'A prazo'}
                    </td>
                    <td>
                      <span
                        className={`sale-status sale-status--${venda.status.toLowerCase()}`}
                      >
                        {rotulosStatus[venda.status]}
                      </span>
                    </td>
                    <td className="sales-value">
                      {moeda.format(venda.valorTotal)}
                    </td>
                    <td>
                      <Link
                        aria-label={`Ver romaneio da venda ${venda.numero}`}
                        className="sales-receipt-link"
                        title="Ver romaneio"
                        to={`/vendas/${venda.id}/romaneio`}
                      >
                        <Eye size={17} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}

export default Vendas
