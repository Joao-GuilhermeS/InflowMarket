import { useCallback, useEffect, useState } from 'react'
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

function Clientes() {
  const { usuario } = useAuth()

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')

  const [nome, setNome] = useState('')
  const [cpfCnpj, setCpfCnpj] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [endereco, setEndereco] = useState('')
  const [tipo, setTipo] = useState<'NORMAL' | 'BALCAO'>('NORMAL')

  const [editandoId, setEditandoId] = useState<string | null>(null)

  const carregarClientes = useCallback(async () => {
    try {
      setErro('')
      setCarregando(true)

      const dados = await listarClientes()
      setClientes(dados)
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível carregar os clientes.',
      )
    } finally {
      setCarregando(false)
    }
  }, [])
 
  useEffect(() => {
    carregarClientes()
  }, [carregarClientes])

  function limparFormulario() {
    setNome('')
    setCpfCnpj('')
    setTelefone('')
    setEmail('')
    setEndereco('')
    setTipo('NORMAL')
    setEditandoId(null)
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!usuario?.tenant_id) {
      setErro('Usuário não possui um tenant associado.')
      return
    }

    try {
      setErro('')

      if (editandoId) {
        await atualizarCliente(editandoId, {
          nome,
          cpf_cnpj: cpfCnpj || undefined,
          telefone: telefone || undefined,
          email: email || undefined,
          endereco: endereco || undefined,
          tipo,
        })
      } else {
        const novoCliente: CriarCliente = {
          tenant_id: usuario.tenant_id,
          nome,
          cpf_cnpj: cpfCnpj || undefined,
          telefone: telefone || undefined,
          email: email || undefined,
          endereco: endereco || undefined,
          tipo,
        }

        await criarCliente(novoCliente)
      }

      limparFormulario()
      await carregarClientes()
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível salvar o cliente.',
      )
    }
  }

  function iniciarEdicao(cliente: Cliente) {
    setEditandoId(cliente.id)
    setNome(cliente.nome)
    setCpfCnpj(cliente.cpf_cnpj ?? '')
    setTelefone(cliente.telefone ?? '')
    setEmail(cliente.email ?? '')
    setEndereco(cliente.endereco ?? '')
    setTipo(cliente.tipo)
  }

  async function handleExcluir(id: string) {
    const confirmar = window.confirm(
      'Deseja realmente excluir este cliente?',
    )

    if (!confirmar) {
      return
    }

    try {
      setErro('')
      await excluirCliente(id)
      await carregarClientes()
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : 'Não foi possível excluir o cliente.',
      )
    }
  }
//da mesma forma que ele fez isso assim, é foda.
// function handleExcluir(id: string)
// const confirmar = window.confirm()
// DESEJAVÉL FAZER DA MESMA FORMA DA MESMA FORMA QUE ELE FEZ
  return (
    <main>
      <h1>Clientes</h1>

      {erro && <p>{erro}</p>}

      <section>
        <h2>{editandoId ? 'Editar cliente' : 'Novo cliente'}</h2>

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
            <label htmlFor="cpfCnpj">CPF/CNPJ</label>
            <input
              id="cpfCnpj"
              type="text"
              value={cpfCnpj}
              onChange={(event) =>
                setCpfCnpj(event.currentTarget.value)
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

          <div>
            <label htmlFor="tipo">Tipo</label>
            <select
              id="tipo"
              value={tipo}
              onChange={(event) =>
                setTipo(
                  event.currentTarget.value as 'NORMAL' | 'BALCAO',
                )
              }
            >
              <option value="NORMAL">Normal</option>
              <option value="BALCAO">Balcão</option>
            </select>
          </div>

          <button type="submit">
            {editandoId ? 'Salvar alterações' : 'Cadastrar cliente'}
          </button>

          {editandoId && (
            <button type="button" onClick={limparFormulario}>
              Cancelar
            </button>
          )}
        </form>
      </section>

      <section>
        <h2>Clientes cadastrados</h2>

        {carregando ? (
          <p>Carregando clientes...</p>
        ) : clientes.length === 0 ? (
          <p>Nenhum cliente cadastrado.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>CPF/CNPJ</th>
                <th>Telefone</th>
                <th>E-mail</th>
                <th>Tipo</th>
                <th>Ações</th>
              </tr>
            </thead>

            <tbody>
              {clientes.map((cliente) => (
                <tr key={cliente.id}>
                  <td>{cliente.nome}</td>
                  <td>{cliente.cpf_cnpj ?? '-'}</td>
                  <td>{cliente.telefone ?? '-'}</td>
                  <td>{cliente.email ?? '-'}</td>
                  <td>{cliente.tipo}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => iniciarEdicao(cliente)}
                    >
                      Editar
                    </button>

                    <button
                      type="button"
                      onClick={() => handleExcluir(cliente.id)}
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

export default Clientes