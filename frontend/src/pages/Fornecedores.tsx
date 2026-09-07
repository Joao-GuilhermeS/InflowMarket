import { useCallback, useEffect, useState } from 'react'
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

function Fornecedores() {
  const { usuario } = useAuth()

  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const [nome, setNome] = useState('')
  const [documento, setDocumento] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [endereco, setEndereco] = useState('')

  const [editandoId, setEditandoId] = useState<string | null>(null)

  const carregarFornecedores = useCallback(async () => {
    try {
      setErro('')
      setCarregando(true)

      const dados = await listarFornecedores()
      setFornecedores(dados)
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar os fornecedores.',
      )
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    carregarFornecedores()
  }, [carregarFornecedores])

  function limparFormulario() {
    setNome('')
    setDocumento('')
    setTelefone('')
    setEmail('')
    setEndereco('')
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
        await atualizarFornecedor(editandoId, {
          nome,
          documento: documento || undefined,
          telefone: telefone || undefined,
          email: email || undefined,
          endereco: endereco || undefined,
        })
      } else {
        const novoFornecedor: CriarFornecedor = {
          tenant_id: usuario.tenant_id,
          nome,
          documento: documento || undefined,
          telefone: telefone || undefined,
          email: email || undefined,
          endereco: endereco || undefined,
        }

        await criarFornecedor(novoFornecedor)
      }

      limparFormulario()
      await carregarFornecedores()
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível salvar o fornecedor.',
      )
    }
  }

  function iniciarEdicao(fornecedor: Fornecedor) {
    setEditandoId(fornecedor.id)
    setNome(fornecedor.nome)
    setDocumento(fornecedor.documento ?? '')
    setTelefone(fornecedor.telefone ?? '')
    setEmail(fornecedor.email ?? '')
    setEndereco(fornecedor.endereco ?? '')
  }

  async function handleExcluir(id: string) {
    const confirmar = window.confirm(
      'Deseja realmente excluir este fornecedor?',
    )

    if (!confirmar) {
      return
    }

    try {
      setErro('')
      await excluirFornecedor(id)
      await carregarFornecedores()
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível excluir o fornecedor.',
      )
    }
  }

  return (
    <main>
      <h1>Fornecedores</h1>

      {erro && <p>{erro}</p>}

      <section>
        <h2>{editandoId ? 'Editar fornecedor' : 'Novo fornecedor'}</h2>

        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="nome">Nome</label>
            <input
              id="nome"
              type="text"
              value={nome}
              onChange={(event) => setNome(event.currentTarget.value)}
              required
            />
          </div>

          <div>
            <label htmlFor="documento">Documento</label>
            <input
              id="documento"
              type="text"
              value={documento}
              onChange={(event) =>
                setDocumento(event.currentTarget.value)
              }
            />
          </div>

          <div>
            <label htmlFor="telefone">Telefone</label>
            <input
              id="telefone"
              type="text"
              value={telefone}
              onChange={(event) =>
                setTelefone(event.currentTarget.value)
              }
            />
          </div>

          <div>
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.currentTarget.value)
              }
            />
          </div>

          <div>
            <label htmlFor="endereco">Endereço</label>
            <input
              id="endereco"
              type="text"
              value={endereco}
              onChange={(event) =>
                setEndereco(event.currentTarget.value)
              }
            />
          </div>

          <button type="submit">
            {editandoId
              ? 'Salvar alterações'
              : 'Cadastrar fornecedor'}
          </button>

          {editandoId && (
            <button type="button" onClick={limparFormulario}>
              Cancelar
            </button>
          )}
        </form>
      </section>

      <section>
        <h2>Fornecedores cadastrados</h2>

        {carregando ? (
          <p>Carregando fornecedores...</p>
        ) : fornecedores.length === 0 ? (
          <p>Nenhum fornecedor cadastrado.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Documento</th>
                <th>Telefone</th>
                <th>E-mail</th>
                <th>Endereço</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {fornecedores.map((fornecedor) => (
                <tr key={fornecedor.id}>
                  <td>{fornecedor.nome}</td>
                  <td>{fornecedor.documento ?? '-'}</td>
                  <td>{fornecedor.telefone ?? '-'}</td>
                  <td>{fornecedor.email ?? '-'}</td>
                  <td>{fornecedor.endereco ?? '-'}</td>
                  <td>
                    {fornecedor.ativo ? 'Ativo' : 'Inativo'}
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={() => iniciarEdicao(fornecedor)}
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => handleExcluir(fornecedor.id)}
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

export default Fornecedores