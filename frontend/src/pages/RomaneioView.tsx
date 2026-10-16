import { useEffect, useState } from 'react'
import { ArrowLeft, Leaf, Printer } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { buscarRomaneio } from '../services/VendaService'
import type { RomaneioVenda } from '../services/VendaService'

const moeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function dataHora(valor: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(valor))
}

function RomaneioView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [romaneio, setRomaneio] = useState<RomaneioVenda | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true

    async function carregar() {
      if (!id) {
        setErro('Identificador da venda não informado.')
        setCarregando(false)
        return
      }

      try {
        const dados = await buscarRomaneio(id)
        if (ativo) setRomaneio(dados)
      } catch (error) {
        if (ativo) {
          setErro(
            error instanceof Error
              ? error.message
              : 'Não foi possível carregar o romaneio.',
          )
        }
      } finally {
        if (ativo) setCarregando(false)
      }
    }

    void carregar()
    return () => {
      ativo = false
    }
  }, [id])

  if (carregando) {
    return (
      <div className="pdv-loading">
        <span className="loading-spinner" aria-hidden="true" />
        <span>Carregando romaneio...</span>
      </div>
    )
  }

  return (
    <section className="receipt-page">
      <div className="receipt-actions">
        <button onClick={() => navigate('/pdv')} type="button">
          <ArrowLeft size={17} />
          Voltar ao PDV
        </button>
        {romaneio && (
          <button onClick={() => window.print()} type="button">
            <Printer size={17} />
            Imprimir romaneio
          </button>
        )}
      </div>

      {erro && <div className="receipt-error" role="alert">{erro}</div>}

      {romaneio && (
        <article className="receipt-paper">
          <header className="receipt-brand">
            {romaneio.tenantLogo ? (
              <img
                alt=""
                className="receipt-tenant-logo"
                src={romaneio.tenantLogo}
              />
            ) : (
              <span className="receipt-brand-mark">
                <Leaf size={22} />
              </span>
            )}
            <div>
              <strong>{romaneio.tenantNome}</strong>
              <span>Romaneio de venda</span>
            </div>
          </header>

          <div className="receipt-meta">
            <div>
              <span>Romaneio</span>
              <strong>#{romaneio.numeroRomaneio}</strong>
            </div>
            <div>
              <span>Venda</span>
              <strong>#{romaneio.numeroVenda}</strong>
            </div>
            <div>
              <span>Data</span>
              <strong>{dataHora(romaneio.dataVenda)}</strong>
            </div>
            <div>
              <span>Cliente</span>
              <strong>{romaneio.cliente}</strong>
            </div>
            <div>
              <span>Vendedor</span>
              <strong>{romaneio.vendedor}</strong>
            </div>
            <div>
              <span>Pagamento</span>
              <strong>
                {romaneio.tipoVenda === 'AVISTA'
                  ? romaneio.formaPagamento
                    ? {
                        DINHEIRO: 'Dinheiro',
                        CARTAO: 'Cartão',
                        PIX: 'Pix',
                      }[romaneio.formaPagamento]
                    : 'À vista'
                  : `A prazo · ${romaneio.prazoDias} dias`}
              </strong>
            </div>
            {romaneio.dataVencimento && (
              <div>
                <span>Vencimento</span>
                <strong>
                  {new Intl.DateTimeFormat('pt-BR').format(
                    new Date(`${romaneio.dataVencimento}T00:00:00`),
                  )}
                </strong>
              </div>
            )}
          </div>

          <table className="receipt-table">
            <thead>
              <tr>
                <th>Produto</th>
                <th>Qtd.</th>
                <th>Unitário</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {romaneio.itens.map((item, index) => (
                <tr key={`${item.produto}-${index}`}>
                  <td>
                    {item.produto} <small>({item.unidade})</small>
                  </td>
                  <td>{item.quantidade}</td>
                  <td>{moeda.format(item.precoUnitario)}</td>
                  <td>{moeda.format(item.valorTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="receipt-total">
            <span>Total</span>
            <strong>{moeda.format(romaneio.valorTotal)}</strong>
          </div>
          <footer className="receipt-footer">
            Obrigado pela preferência!
          </footer>
        </article>
      )}
    </section>
  )
}

export default RomaneioView
