begin;

-- IDs fixos somente para o cenário de teste
do $$
declare
    v_tenant_id uuid := '11111111-1111-1111-1111-111111111111';
    v_usuario_id uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    v_cliente_id uuid := '66666666-6666-6666-6666-666666666666';
    v_produto_id uuid := '77777777-7777-7777-7777-777777777777';
    v_venda_id uuid := '88888888-8888-8888-8888-888888888888';
    v_item_id uuid := '99999999-9999-9999-9999-999999999999';
    v_auth_user_id uuid := 'cc769369-5499-4a0b-9e5d-a3a7da0852c9';
begin

    -- Limpeza preventiva
    delete from public.pagamento
    where tenant_id = v_tenant_id;

    delete from public.romaneio
    where venda_id = v_venda_id;

    delete from public.movimentacao_estoque
    where tenant_id = v_tenant_id;

    delete from public.item_venda
    where id = v_item_id;

    delete from public.venda
    where id = v_venda_id;

    delete from public.cliente
    where id = v_cliente_id;

    delete from public.produto
    where id = v_produto_id;

    delete from public.usuario
    where id = v_usuario_id;

    delete from public.tenant
    where id = v_tenant_id;


    -- Tenant
    insert into public.tenant (
        id,
        nome
    )
    values (
        v_tenant_id,
        'Tenant Teste Venda'
    );


    -- Usuário da aplicação
    insert into public.usuario (
        id,
        auth_user_id,
        tenant_id,
        nome,
        email,
        perfil,
        ativo
    )
    values (
        v_usuario_id,
        v_auth_user_id,
        v_tenant_id,
        'Vendedor Teste',
        'vendedor.teste@inflow.local',
        'VENDEDOR',
        true
    );


    -- Cliente
    insert into public.cliente (
        id,
        tenant_id,
        nome,
        tipo,
        ativo
    )
    values (
        v_cliente_id,
        v_tenant_id,
        'Cliente Teste Venda',
        'NORMAL',
        true
    );


    -- Produto com estoque insuficiente propositalmente
    insert into public.produto (
        id,
        tenant_id,
        nome,
        unidade,
        quantidade_estoque,
        ativo
    )
    values (
        v_produto_id,
        v_tenant_id,
        'Produto Teste Venda',
        'UN',
        2,
        true
    );


    -- Venda
    insert into public.venda (
        id,
        tenant_id,
        cliente_id,
        vendedor_id,
        numero,
        tipo_venda,
        forma_pagamento,
        prazo_dias,
        data_vencimento,
        valor_total,
        valor_pago,
        saldo,
        status
    )
    values (
        v_venda_id,
        v_tenant_id,
        v_cliente_id,
        v_usuario_id,
        1,
        'AVISTA',
        'PIX',
        null,
        null,
        0,
        0,
        0,
        'EM_ABERTO'
    );


    -- Item: 5 unidades, estoque atual = 2
    insert into public.item_venda (
        id,
        venda_id,
        produto_id,
        quantidade,
        preco_unitario,
        valor_total
    )
    values (
        v_item_id,
        v_venda_id,
        v_produto_id,
        5,
        10.00,
        0
    );

end;
$$;

-- Simula o usuário autenticado
select set_config(
    'request.jwt.claim.sub',
    'cc769369-5499-4a0b-9e5d-a3a7da0852c9',
    true
);

-- Finaliza a venda
select public.finalizar_venda(
    '88888888-8888-8888-8888-888888888888'::uuid
);

-- Validação completa
select
    v.status as venda_status,
    v.numero as venda_numero,
    v.valor_total,
    v.valor_pago,
    v.saldo,

    p.quantidade_estoque,

    coalesce(pg.valor, 0) as pagamento,

    r.numero as romaneio_numero,

    me.tipo as movimento_tipo,
    me.quantidade as movimento_quantidade,
    me.saldo_anterior,
    me.saldo_posterior

from public.venda v

join public.item_venda iv
    on iv.venda_id = v.id

join public.produto p
    on p.id = iv.produto_id

left join public.pagamento pg
    on pg.cliente_id = v.cliente_id
   and pg.tenant_id = v.tenant_id
   and pg.status = 'REGISTRADO'

left join public.romaneio r
    on r.venda_id = v.id

left join public.movimentacao_estoque me
    on me.item_venda_id = iv.id

where v.id = '88888888-8888-8888-8888-888888888888';

rollback;