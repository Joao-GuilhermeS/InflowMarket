import { useCallback, useEffect, useState } from 'react'
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

function Produtos() {
  const { usuario } = useAuth()

  const [produtos, setProdutos] = useState<Produto[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [unidade, setUnidade] = useState('UN')

  const [editandoId, setEditandoId] = useState<string | null>(null)

  const carregarProdutos = useCallback(async () => {
    try {
      setErro('')
      setCarregando(true)

      const dados = await listarProdutos()
      setProdutos(dados)
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar os produtos.',
      )
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    carregarProdutos()
  }, [carregarProdutos])

  function limparFormulario() {
    setNome('')
    setDescricao('')
    setUnidade('UN')
    setEditandoId(null)
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (!usuario?.tenant_id) {
      setErro('Usuário não possui um tenant associado.')
      return
    }

    try {
      setErro('')

      if (editandoId) {
        await atualizarProduto(editandoId, {
          nome,
          descricao: descricao || undefined,
          unidade,
        })
      } else {
        const novoProduto: CriarProduto = {
          tenant_id: usuario.tenant_id,
          nome,
          descricao: descricao || undefined,
          unidade,
        }

        await criarProduto(novoProduto)
      }

      limparFormulario()
      await carregarProdutos()
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível salvar o produto.',
      )
    }
  }

  function iniciarEdicao(produto: Produto) {
    setEditandoId(produto.id)
    setNome(produto.nome)
    setDescricao(produto.descricao ?? '')
    setUnidade(produto.unidade)
  }

  async function handleExcluir(id: string) {
    const confirmar = window.confirm(
      'Deseja realmente excluir este produto?',
    )

    if (!confirmar) {
      return
    }

    try {
      setErro('')
      await excluirProduto(id)
      await carregarProdutos()
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível excluir o produto.',
      )
    }
  }

  return (
    <main>
      <h1>Produtos</h1>

      {erro && <p>{erro}</p>}

      <section>
        <h2>{editandoId ? 'Editar produto' : 'Novo produto'}</h2>

        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="nome">Nome</label>

            <input
              id="nome"
              type="text"
              value={nome}
              onChange={(event) =>
                setNome(event.currentTarget.value)
              }
              required
            />
          </div>

          <div>
            <label htmlFor="descricao">Descrição</label>

            <input
              id="descricao"
              type="text"
              value={descricao}
              onChange={(event) =>
                setDescricao(event.currentTarget.value)
              }
            />
          </div>

          <div>
            <label htmlFor="unidade">Unidade</label>

            <input
              id="unidade"
              type="text"
              value={unidade}
              onChange={(event) =>
                setUnidade(event.currentTarget.value)
              }
              required
            />
          </div>

          <button type="submit">
            {editandoId
              ? 'Salvar alterações'
              : 'Cadastrar produto'}
          </button>

          {editandoId && (
            <button type="button" onClick={limparFormulario}>
              Cancelar
            </button>
          )}
        </form>
      </section>

      <section>
        <h2>Produtos cadastrados</h2>

        {carregando ? (
          <p>Carregando produtos...</p>
        ) : produtos.length === 0 ? (
          <p>Nenhum produto cadastrado.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Descrição</th>
                <th>Unidade</th>
                <th>Estoque</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {produtos.map((produto) => (
                <tr key={produto.id}>
                  <td>{produto.nome}</td>
                  <td>{produto.descricao ?? '-'}</td>
                  <td>{produto.unidade}</td>
                  <td>{produto.quantidade_estoque}</td>
                  <td>
                    {produto.ativo ? 'Ativo' : 'Inativo'}
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => iniciarEdicao(produto)}
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => handleExcluir(produto.id)}
                    >
                      Excluir
                    </button>
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

export default Produtos