import { supabase } from '../lib/supabase'

export interface EntradaMercadoria {
  id: string
  tenant_id: string
  fornecedor_id: string
  usuario_id: string
  data: string
  valor_total: number
  observacao: string | null
  status: 'ABERTA' | 'FINALIZADA' | 'CANCELADA'
}

export interface ItemEntrada {
  id: string
  entrada_id: string
  produto_id: string
  quantidade: number
  custo_unitario: number
  valor_total: number
}

export interface CriarEntrada {
  tenant_id: string
  fornecedor_id: string
  usuario_id: string
  observacao?: string
}

export interface CriarItemEntrada {
  entrada_id: string
  produto_id: string
  quantidade: number
  custo_unitario: number
}

export async function listarEntradas(): Promise<EntradaMercadoria[]> {
  const { data, error } = await supabase
    .from('entrada_mercadoria')
    .select('*')
    .order('data', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}

export async function criarEntrada(
  entrada: CriarEntrada,
): Promise<EntradaMercadoria> {
  const { data, error } = await supabase
    .from('entrada_mercadoria')
    .insert({
      tenant_id: entrada.tenant_id,
      fornecedor_id: entrada.fornecedor_id,
      usuario_id: entrada.usuario_id,
      observacao: entrada.observacao || null,
      status: 'ABERTA',
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function adicionarItemEntrada(
  item: CriarItemEntrada,
): Promise<ItemEntrada> {
  const valorTotal = Number(
    (item.quantidade * item.custo_unitario).toFixed(2),
  )

  const { data, error } = await supabase
    .from('item_entrada')
    .insert({
      entrada_id: item.entrada_id,
      produto_id: item.produto_id,
      quantidade: item.quantidade,
      custo_unitario: item.custo_unitario,
      valor_total: valorTotal,
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function listarItensEntrada(
  entradaId: string,
): Promise<ItemEntrada[]> {
  const { data, error } = await supabase
    .from('item_entrada')
    .select('*')
    .eq('entrada_id', entradaId)
    .order('id')

  if (error) {
    throw new Error(error.message)
  }

  return data ?? []
}

export async function finalizarEntrada(
  entradaId: string,
): Promise<string> {
  const { data, error } = await supabase.rpc(
    'finalizar_entrada_mercadoria',
    {
      p_entrada_id: entradaId,
    },
  )

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function excluirEntradaAberta(
  entradaId: string,
): Promise<void> {
  const { error } = await supabase
    .from('entrada_mercadoria')
    .delete()
    .eq('id', entradaId)
    .eq('status', 'ABERTA')

  if (error) {
    throw new Error(error.message)
  }
}