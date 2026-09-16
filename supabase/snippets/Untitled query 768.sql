insert into public.venda (
    id,
    tenant_id,
    cliente_id,
    vendedor_id,
    numero,
    tipo_venda,
    forma_pagamento,
    valor_total,
    valor_pago,
    saldo,
    status
)
values (
    '88888888-8888-8888-8888-888888888888',
    '11111111-1111-1111-1111-111111111111',
    '66666666-6666-6666-6666-666666666666',
    (
        select id
        from public.usuario
        where auth_user_id = 'cc769369-5499-4a0b-9e5d-a3a7da0852c9'
    ),
    1,
    'AVISTA',
    'PIX',
    0,
    0,
    0,
    'EM_ABERTO'
);

insert into public.item_venda (
    id,
    venda_id,
    produto_id,
    quantidade,
    preco_unitario,
    valor_total
)
values (
    '99999999-9999-9999-9999-999999999999',
    '88888888-8888-8888-8888-888888888888',
    '77777777-7777-7777-7777-777777777777',
    5,
    10.00,
    0
);