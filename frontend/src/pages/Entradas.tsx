import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import {
  adicionarItemEntrada,
  criarEntrada,
  finalizarEntrada,
  listarEntradas,
  listarItensEntrada,
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

  const carregarDados = useCallback(async () => {
    try {
      setErro('')
      setCarregando(true)

      const [entradasData, fornecedoresData, produtosData] =
        await Promise.all([
          listarEntradas(),
          listarFornecedores(),
          listarProdutos(),
        ])

      setEntradas(entradasData)
      setFornecedores(fornecedoresData)
      setProdutos(produtosData)
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar os dados.',
      )
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    carregarDados()
  }, [carregarDados])

  async function handleCriarEntrada() {
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
        observacao: observacao || undefined,
      })

      setEntradaAtual(entrada)
      setItens([])
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

  async function carregarItens(entradaId: string) {
    try {
      const dados = await listarItensEntrada(entradaId)
      setItens(dados)
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar os itens.',
      )
    }
  }

  async function handleAdicionarItem() {
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

      await adicionarItemEntrada({
        entrada_id: entradaAtual.id,
        produto_id: itemForm.produto_id,
        quantidade,
        custo_unitario: custoUnitario,
      })

      setItemForm({
        produto_id: '',
        quantidade: '',
        custo_unitario: '',
      })

      await carregarItens(entradaAtual.id)
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
    if (!entradaAtual) {
      return
    }

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

      await carregarDados()
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

  function obterNomeProduto(produtoId: string) {
    return (
      produtos.find((produto) => produto.id === produtoId)?.nome ??
      'Produto não encontrado'
    )
  }

  function calcularTotalItens() {
    return itens.reduce(
      (total, item) => total + Number(item.valor_total),
      0,
    )
  }

  return (
    <main>
      <h1>Entradas de mercadoria</h1>

      {erro && <p>{erro}</p>}

      {!entradaAtual && (
        <section>
          <h2>Nova entrada</h2>

          <div>
            <label htmlFor="fornecedor">Fornecedor</label>

            <select
              id="fornecedor"
              value={fornecedorId}
              onChange={(event) =>
                setFornecedorId(event.currentTarget.value)
              }
            >
              <option value="">Selecione</option>

              {fornecedores.map((fornecedor) => (
                <option
                  key={fornecedor.id}
                  value={fornecedor.id}
                >
                  {fornecedor.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="observacao">Observação</label>

            <textarea
              id="observacao"
              value={observacao}
              onChange={(event) =>
                setObservacao(event.currentTarget.value)
              }
            />
          </div>

          <button
            type="button"
            onClick={handleCriarEntrada}
            disabled={salvando}
          >
            Criar entrada
          </button>
        </section>
      )}

      {entradaAtual && (
        <section>
          <h2>Entrada em aberto</h2>

          <p>
            Fornecedor:{' '}
            {
              fornecedores.find(
                (fornecedor) =>
                  fornecedor.id === entradaAtual.fornecedor_id,
              )?.nome
            }
          </p>

          <h3>Adicionar item</h3>

          <div>
            <label htmlFor="produto">Produto</label>

            <select
              id="produto"
              value={itemForm.produto_id}
              onChange={(event) =>
                setItemForm({
                  ...itemForm,
                  produto_id: event.currentTarget.value,
                })
              }
            >
              <option value="">Selecione</option>

              {produtos
                .filter((produto) => produto.ativo)
                .map((produto) => (
                  <option
                    key={produto.id}
                    value={produto.id}
                  >
                    {produto.nome}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label htmlFor="quantidade">Quantidade</label>

            <input
              id="quantidade"
              type="number"
              min="0.001"
              step="0.001"
              value={itemForm.quantidade}
              onChange={(event) =>
                setItemForm({
                  ...itemForm,
                  quantidade: event.currentTarget.value,
                })
              }
            />
          </div>

          <div>
            <label htmlFor="custo">Custo unitário</label>

            <input
              id="custo"
              type="number"
              min="0"
              step="0.01"
              value={itemForm.custo_unitario}
              onChange={(event) =>
                setItemForm({
                  ...itemForm,
                  custo_unitario: event.currentTarget.value,
                })
              }
            />
          </div>

          <button
            type="button"
            onClick={handleAdicionarItem}
            disabled={salvando}
          >
            Adicionar item          </button>

          <h3>Itens da entrada</h3>

          {itens.length === 0 ? (
            <p>Nenhum item adicionado.</p>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Produto</th>
                  <th>Quantidade</th>
                  <th>Custo unitário</th>
                  <th>Total</th>
                </tr>
              </thead>

              <tbody>
                {itens.map((item) => (
                  <tr key={item.id}>
                    <td>{obterNomeProduto(item.produto_id)}</td>
                    <td>{item.quantidade}</td>
                    <td>
                      R$ {Number(item.custo_unitario).toFixed(2)}
                    </td>
                    <td>
                      R$ {Number(item.valor_total).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <p>
            Total:{' '}
            <strong>
              R$ {calcularTotalItens().toFixed(2)}
            </strong>
          </p>

          <button
            type="button"
            onClick={handleFinalizar}
            disabled={salvando || itens.length === 0}
          >
            Finalizar entrada
          </button>
        </section>
      )}

      <section>
        <h2>Histórico de entradas</h2>

        {carregando ? (
          <p>Carregando...</p>
        ) : entradas.length === 0 ? (
          <p>Nenhuma entrada cadastrada.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Status</th>
                <th>Valor total</th>
              </tr>
            </thead>

            <tbody>
              {entradas.map((entrada) => (
                <tr key={entrada.id}>
                  <td>
                    {new Date(entrada.data).toLocaleString('pt-BR')}
                  </td>
                  <td>{entrada.status}</td>
                  <td>
                    R$ {Number(entrada.valor_total).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  )
}

export default Entradas