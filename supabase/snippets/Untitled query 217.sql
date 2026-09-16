insert into public.usuario (
    auth_user_id,
    tenant_id,
    nome,
    email,
    perfil,
    ativo
)
values (
    'f10f701e-4302-4936-9c74-a5461daf887b',
    '11111111-1111-1111-1111-111111111111',
    'Gerente Teste',
    'gerente.teste@inflow.local',
    'GERENTE',
    true
);

insert into public.fornecedor (
    id,
    tenant_id,
    nome
)
values (
    '22222222-2222-2222-2222-222222222222',
    '11111111-1111-1111-1111-111111111111',
    'Fornecedor Teste'
);

insert into public.produto (
    id,
    tenant_id,
    nome,
    unidade,
    quantidade_estoque
)
values (
    '33333333-3333-3333-3333-333333333333',
    '11111111-1111-1111-1111-111111111111',
    'Produto Teste',
    'UN',
    0
);

insert into public.entrada_mercadoria (
    id,
    tenant_id,
    fornecedor_id,
    usuario_id,
    observacao,
    status
)
values (
    '44444444-4444-4444-4444-444444444444',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222',
    (
        select id
        from public.usuario
        where auth_user_id = 'f10f701e-4302-4936-9c74-a5461daf887b'
    ),
    'Entrada de teste',
    'ABERTA'
);

insert into public.item_entrada (
    id,
    entrada_id,
    produto_id,
    quantidade,
    custo_unitario,
    valor_total
)
values (
    '55555555-5555-5555-5555-555555555555',
    '44444444-4444-4444-4444-444444444444',
    '33333333-3333-3333-3333-333333333333',
    10,
    25.50,
    255.00
);