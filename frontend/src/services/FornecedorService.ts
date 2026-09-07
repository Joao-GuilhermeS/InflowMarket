import { supabase } from '../lib/supabase'

export interface Fornecedor {
  id: string
  tenant_id: string
  nome: string
  documento: string | null
  telefone: string | null
  email: string | null
  endereco: string | null
  ativo: boolean
  data_criacao: string
}

export interface CriarFornecedor {
  tenant_id: string
  nome: string
  documento?: string
  telefone?: string
  email?: string
  endereco?: string
  ativo?: boolean
}

export async function listarFornecedores(): Promise<Fornecedor[]> {
  const { data, error } = await supabase
    .from('fornecedor')
    .select('*')
    .order('nome')

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}

export async function criarFornecedor(
  fornecedor: CriarFornecedor,
): Promise<Fornecedor> {
  const { data, error } = await supabase
    .from('fornecedor')
    .insert({
      tenant_id: fornecedor.tenant_id,
      nome: fornecedor.nome,
      documento: fornecedor.documento || null,
      telefone: fornecedor.telefone || null,
      email: fornecedor.email || null,
      endereco: fornecedor.endereco || null,
      ativo: fornecedor.ativo ?? true,
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function atualizarFornecedor(
  id: string,
  fornecedor: Partial<Omit<CriarFornecedor, 'tenant_id'>>,
): Promise<Fornecedor> {
  const { data, error } = await supabase
    .from('fornecedor')
    .update(fornecedor)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function excluirFornecedor(id: string): Promise<void> {
  const { error } = await supabase
    .from('fornecedor')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }
}