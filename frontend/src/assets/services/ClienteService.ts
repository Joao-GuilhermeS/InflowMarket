import { supabase } from  '../../lib/supabase'


export interface Cliente {
  id: string
  tenant_id: string
  nome: string
  cpf_cnpj: string | null
  telefone: string | null
  email: string | null
  endereco: string | null
  tipo: 'NORMAL' | 'BALCAO'
  ativo: boolean
  data_criacao: string
}

export interface CriarCliente {
  tenant_id: string
  nome: string
  cpf_cnpj?: string
  telefone?: string
  email?: string
  endereco?: string
  tipo?: 'NORMAL' | 'BALCAO'
  ativo?: boolean
}

export async function listarClientes(): Promise<Cliente[]> {
  const { data, error } = await supabase
    .from('cliente')
    .select('*')
    .order('nome')

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}

export async function criarCliente(
  cliente: CriarCliente,
): Promise<Cliente> {
  const { data, error } = await supabase
    .from('cliente')
    .insert({
      tenant_id: cliente.tenant_id,
      nome: cliente.nome,
      cpf_cnpj: cliente.cpf_cnpj || null,
      telefone: cliente.telefone || null,
      email: cliente.email || null,
      endereco: cliente.endereco || null,
      tipo: cliente.tipo ?? 'NORMAL',
      ativo: cliente.ativo ?? true,
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function atualizarCliente(
  id: string,
  cliente: Partial<Omit<CriarCliente, 'tenant_id'>>,
): Promise<Cliente> {
  const { data, error } = await supabase
    .from('cliente')
    .update(cliente)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function excluirCliente(id: string): Promise<void> {
  const { error } = await supabase
    .from('cliente')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }
}