import { supabase } from '../lib/supabase'

export interface Produto {
  id: string
  tenant_id: string
  nome: string
  descricao: string | null
  unidade: string
  quantidade_estoque: number
  ativo: boolean
  data_criacao: string
}

export interface CriarProduto {
  tenant_id: string
  nome: string
  descricao?: string
  unidade: string
  ativo?: boolean
}

export async function listarProdutos(): Promise<Produto[]> {
  const { data, error } = await supabase
    .from('produto')
    .select('*')
    .order('nome')

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}

export async function criarProduto(
  produto: CriarProduto,
): Promise<Produto> {
  const { data, error } = await supabase
    .from('produto')
    .insert({
      tenant_id: produto.tenant_id,
      nome: produto.nome,
      descricao: produto.descricao || null,
      unidade: produto.unidade,
      ativo: produto.ativo ?? true,
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function atualizarProduto(
  id: string,
  produto: Partial<Omit<CriarProduto, 'tenant_id'>>,
): Promise<Produto> {
  const { data, error } = await supabase
    .from('produto')
    .update(produto)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function excluirProduto(id: string): Promise<void> {
  const { error } = await supabase
    .from('produto')
    .delete()
    .eq('id', id)

  if (error) {
    throw new Error(error.message)
  }
}