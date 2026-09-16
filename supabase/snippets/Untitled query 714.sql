select
    e.status,
    e.valor_total,
    p.quantidade_estoque,
    ie.quantidade,
    ie.custo_unitario,
    ie.valor_total as item_valor_total
from public.entrada_mercadoria e
join public.item_entrada ie
    on ie.entrada_id = e.id
join public.produto p
    on p.id = ie.produto_id
where e.id = '44444444-4444-4444-444444444444';