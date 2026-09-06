--MIGRATION: 20260824192142_initial_schema.sql      

create extension if not exists "pgcrypto";

-- ENUMS


create type public.perfil_usuario as enum (
    'DESENVOLVEDOR',
    'GERENTE',
    'VENDEDOR'
);

create type public.tipo_cliente as enum (
    'NORMAL',
    'BALCAO'    
);

create type public.status_entrada as enum (
    'ABERTA',
    'FINALIZADA',
    'CANCELADA'
);

create type public.tipo_venda as enum (
    'AVISTA',
    'PRAZO'
);

create type public.forma_pagamento as enum (
    'DINHEIRO',
    'CARTAO',
    'PIX'
);

create type public.status_venda as enum (
    'EM_ABERTO',
    'PAGA',
    'VENCIDA',
    'CANCELADA'
);

create type public.status_pagamento as enum (
    'REGISTRADO',
    'CANCELADO'
);

create type public.status_devolucao as enum (
    'REGISTRADA',
    'CANCELADA'
);

create type public.status_cobranca as enum (
    'REALIZADA',
    'PENDENTE',
    'CANCELADA'
);

create type public.forma_contato_cobranca as enum (
    'TELEFONE',
    'WHATSAPP',
    'PRESENCIAL',
    'OUTRO'
);

create type public.tipo_movimentacao_estoque as enum (
    'ENTRADA',
    'VENDA',
    'DEVOLUCAO',
    'CANCELAMENTO',
    'AJUSTE'
);



-- TENANT


create table public.tenant (
    id uuid primary key default gen_random_uuid(),

    nome varchar(150) not null,
    documento varchar(30),
    telefone varchar(30),
    email varchar(150),
    endereco text,
    logo text,

    ativo boolean not null default true,

    data_criacao timestamptz not null default now()
);



-- USUARIO


create table public.usuario (
    id uuid primary key default gen_random_uuid(),

    auth_user_id uuid not null unique
        references auth.users(id)
        on delete cascade,

    tenant_id uuid
        references public.tenant(id)
        on delete restrict,

    nome varchar(150) not null,
    email varchar(150) not null,

    perfil public.perfil_usuario not null,

    ativo boolean not null default true,

    data_criacao timestamptz not null default now(),

    constraint usuario_perfil_tenant_check
    check (
        (perfil = 'DESENVOLVEDOR' and tenant_id is null)
        or
        (perfil in ('GERENTE', 'VENDEDOR') and tenant_id is not null)
    )
);



-- CLIENTE


create table public.cliente (
    id uuid primary key default gen_random_uuid(),

    tenant_id uuid not null
        references public.tenant(id)
        on delete restrict,

    nome varchar(150) not null,
    cpf_cnpj varchar(30),
    telefone varchar(30),
    email varchar(150),
    endereco text,

    tipo public.tipo_cliente not null default 'NORMAL',

    ativo boolean not null default true,

    data_criacao timestamptz not null default now()
);


-- CONTA CLIENTE


create table public.conta_cliente (
    id uuid primary key default gen_random_uuid(),

    cliente_id uuid not null unique
        references public.cliente(id)
        on delete restrict,

    saldo_devedor numeric(15,2) not null default 0,

    data_criacao timestamptz not null default now(),
    data_atualizacao timestamptz not null default now(),

    constraint conta_cliente_saldo_check
    check (saldo_devedor >= 0)
);



-- PRODUTO


create table public.produto (
    id uuid primary key default gen_random_uuid(),

    tenant_id uuid not null
        references public.tenant(id)
        on delete restrict,

    nome varchar(150) not null,
    descricao text,
    unidade varchar(30) not null,

    quantidade_estoque numeric(15,3) not null default 0,

    ativo boolean not null default true,

    data_criacao timestamptz not null default now(),

    constraint produto_estoque_check
    check (quantidade_estoque >= -999999999)
);



-- FORNECEDOR

create table public.fornecedor (
    id uuid primary key default gen_random_uuid(),

    tenant_id uuid not null
        references public.tenant(id)
        on delete restrict,

    nome varchar(150) not null,
    documento varchar(30),
    telefone varchar(30),
    email varchar(150),
    endereco text,

    ativo boolean not null default true,

    data_criacao timestamptz not null default now()
);


-- ENTRADA DE MERCADORIA

create table public.entrada_mercadoria (
    id uuid primary key default gen_random_uuid(),

    tenant_id uuid not null
        references public.tenant(id)
        on delete restrict,

    fornecedor_id uuid not null
        references public.fornecedor(id)
        on delete restrict,

    usuario_id uuid not null
        references public.usuario(id)
        on delete restrict,

    data timestamptz not null default now(),

    valor_total numeric(15,2) not null default 0,

    observacao text,

    status public.status_entrada not null default 'ABERTA',

    constraint entrada_valor_check
    check (valor_total >= 0)
);


-- 
-- ITEM ENTRADA
-- 

create table public.item_entrada (
    id uuid primary key default gen_random_uuid(),

    entrada_id uuid not null
        references public.entrada_mercadoria(id)
        on delete cascade,

    produto_id uuid not null
        references public.produto(id)
        on delete restrict,

    quantidade numeric(15,3) not null,

    custo_unitario numeric(15,2) not null,

    valor_total numeric(15,2) not null,

    constraint item_entrada_quantidade_check
    check (quantidade > 0),

    constraint item_entrada_custo_check
    check (custo_unitario >= 0),

    constraint item_entrada_valor_check
    check (valor_total >= 0)
);



-- VENDA


create table public.venda (
    id uuid primary key default gen_random_uuid(),

    tenant_id uuid not null
        references public.tenant(id)
        on delete restrict,

    cliente_id uuid not null
        references public.cliente(id)
        on delete restrict,

    vendedor_id uuid not null
        references public.usuario(id)
        on delete restrict,

    numero bigint not null,

    data_venda timestamptz not null default now(),

    tipo_venda public.tipo_venda not null,

    forma_pagamento public.forma_pagamento,

    prazo_dias integer,

    data_vencimento date,

    valor_total numeric(15,2) not null default 0,

    valor_pago numeric(15,2) not null default 0,

    saldo numeric(15,2) not null default 0,

    status public.status_venda not null default 'EM_ABERTO',

    data_criacao timestamptz not null default now(),

    data_atualizacao timestamptz not null default now(),

    constraint venda_numero_positive_check
    check (numero > 0),

    constraint venda_valor_total_check
    check (valor_total >= 0),

    constraint venda_valor_pago_check
    check (valor_pago >= 0),

    constraint venda_saldo_check
    check (saldo >= 0),

    constraint venda_prazo_check
    check (
        (tipo_venda = 'AVISTA' and prazo_dias is null)
        or
        (tipo_venda = 'PRAZO' and prazo_dias is not null and prazo_dias >= 0)
    ),

    constraint venda_forma_pagamento_check
    check (
        (tipo_venda = 'PRAZO' and forma_pagamento is null)
        or
        (tipo_venda = 'AVISTA' and forma_pagamento is not null)
    )
);



-- ITEM VENDA


create table public.item_venda (
    id uuid primary key default gen_random_uuid(),

    venda_id uuid not null
        references public.venda(id)
        on delete cascade,

    produto_id uuid not null
        references public.produto(id)
        on delete restrict,

    quantidade numeric(15,3) not null,

    preco_unitario numeric(15,2) not null,

    valor_total numeric(15,2) not null,

    constraint item_venda_quantidade_check
    check (quantidade > 0),

    constraint item_venda_preco_check
    check (preco_unitario >= 0),

    constraint item_venda_valor_check
    check (valor_total >= 0)
);



-- ROMANEIO


create table public.romaneio (
    id uuid primary key default gen_random_uuid(),

    venda_id uuid not null unique
        references public.venda(id)
        on delete restrict,

    numero bigint not null,

    data_geracao timestamptz not null default now(),

    constraint romaneio_numero_check
    check (numero > 0)
);



-- PAGAMENTO


create table public.pagamento (
    id uuid primary key default gen_random_uuid(),

    tenant_id uuid not null
        references public.tenant(id)
        on delete restrict,

    cliente_id uuid not null
        references public.cliente(id)
        on delete restrict,

    usuario_id uuid not null
        references public.usuario(id)
        on delete restrict,

    valor numeric(15,2) not null,

    forma_pagamento public.forma_pagamento not null,

    data timestamptz not null default now(),

    observacao text,

    status public.status_pagamento not null default 'REGISTRADO',

    constraint pagamento_valor_check
    check (valor > 0)
);



-- PAGAMENTO APLICAÇÃO


create table public.pagamento_aplicacao (
    id uuid primary key default gen_random_uuid(),

    pagamento_id uuid not null
        references public.pagamento(id)
        on delete cascade,

    venda_id uuid not null
        references public.venda(id)
        on delete restrict,

    valor_aplicado numeric(15,2) not null,

    constraint pagamento_aplicacao_valor_check
    check (valor_aplicado > 0)
);



-- DEVOLUÇÃO / ESTORNO


create table public.devolucao (
    id uuid primary key default gen_random_uuid(),

    tenant_id uuid not null
        references public.tenant(id)
        on delete restrict,

    venda_id uuid not null
        references public.venda(id)
        on delete restrict,

    usuario_id uuid not null
        references public.usuario(id)
        on delete restrict,

    valor_total numeric(15,2) not null,

    motivo text,

    estorno_externo boolean not null default true,

    data timestamptz not null default now(),

    status public.status_devolucao not null default 'REGISTRADA',

    constraint devolucao_valor_check
    check (valor_total >= 0)
);



-- ITEM DEVOLUÇÃO


create table public.item_devolucao (
    id uuid primary key default gen_random_uuid(),

    devolucao_id uuid not null
        references public.devolucao(id)
        on delete cascade,

    item_venda_id uuid not null
        references public.item_venda(id)
        on delete restrict,

    produto_id uuid not null
        references public.produto(id)
        on delete restrict,

    quantidade numeric(15,3) not null,

    valor_unitario numeric(15,2) not null,

    valor_total numeric(15,2) not null,

    constraint item_devolucao_quantidade_check
    check (quantidade > 0),

    constraint item_devolucao_valor_check
    check (valor_total >= 0)
);



-- COBRANÇA


create table public.cobranca (
    id uuid primary key default gen_random_uuid(),

    tenant_id uuid not null
        references public.tenant(id)
        on delete restrict,

    cliente_id uuid not null
        references public.cliente(id)
        on delete restrict,

    usuario_id uuid not null
        references public.usuario(id)
        on delete restrict,

    data timestamptz not null default now(),

    forma_contato public.forma_contato_cobranca not null,

    status public.status_cobranca not null default 'REALIZADA',

    valor_cobrado numeric(15,2),

    observacao text,

    proxima_cobranca date,

    constraint cobranca_valor_check
    check (valor_cobrado is null or valor_cobrado >= 0)
);


-- COBRANÇA VENDA

create table public.cobranca_venda (
    id uuid primary key default gen_random_uuid(),

    cobranca_id uuid not null
        references public.cobranca(id)
        on delete cascade,

    venda_id uuid not null
        references public.venda(id)
        on delete restrict,

    unique (cobranca_id, venda_id)
);


-- MOVIMENTAÇÃO DE ESTOQUE

create table public.movimentacao_estoque (
    id uuid primary key default gen_random_uuid(),

    tenant_id uuid not null
        references public.tenant(id)
        on delete restrict,

    produto_id uuid not null
        references public.produto(id)
        on delete restrict,

    usuario_id uuid not null
        references public.usuario(id)
        on delete restrict,

    item_entrada_id uuid
        references public.item_entrada(id)
        on delete restrict,

    item_venda_id uuid
        references public.item_venda(id)
        on delete restrict,

    item_devolucao_id uuid
        references public.item_devolucao(id)
        on delete restrict,

    tipo public.tipo_movimentacao_estoque not null,

    quantidade numeric(15,3) not null,

    saldo_anterior numeric(15,3) not null,

    saldo_posterior numeric(15,3) not null,

    data timestamptz not null default now(),

    constraint movimentacao_quantidade_check
    check (quantidade > 0),

    constraint movimentacao_origem_check
    check (
        (tipo = 'ENTRADA' and item_entrada_id is not null
            and item_venda_id is null
            and item_devolucao_id is null)

        or

        (tipo in ('VENDA', 'CANCELAMENTO')
            and item_venda_id is not null
            and item_entrada_id is null
            and item_devolucao_id is null)

        or

        (tipo = 'DEVOLUCAO'
            and item_devolucao_id is not null
            and item_entrada_id is null
            and item_venda_id is null)

        or

        (tipo = 'AJUSTE'
            and item_entrada_id is null
            and item_venda_id is null
            and item_devolucao_id is null)
    )
);



-- HISTÓRICO


create table public.historico (
    id uuid primary key default gen_random_uuid(),

    tenant_id uuid not null
        references public.tenant(id)
        on delete restrict,

    usuario_id uuid
        references public.usuario(id)
        on delete restrict,

    entidade varchar(100) not null,

    entidade_id uuid not null,

    tipo_operacao varchar(100) not null,

    descricao text not null,

    valor_anterior jsonb,

    valor_novo jsonb,

    data_hora timestamptz not null default now()
);



-- ÍNDICES


create index idx_usuario_tenant
    on public.usuario(tenant_id);

create index idx_cliente_tenant
    on public.cliente(tenant_id);

create index idx_produto_tenant
    on public.produto(tenant_id);

create index idx_fornecedor_tenant
    on public.fornecedor(tenant_id);

create index idx_entrada_tenant
    on public.entrada_mercadoria(tenant_id);

create index idx_entrada_fornecedor
    on public.entrada_mercadoria(fornecedor_id);

create index idx_item_entrada_entrada
    on public.item_entrada(entrada_id);

create index idx_item_entrada_produto
    on public.item_entrada(produto_id);

create index idx_venda_tenant
    on public.venda(tenant_id);

create index idx_venda_cliente
    on public.venda(cliente_id);

create index idx_venda_vendedor
    on public.venda(vendedor_id);

create index idx_venda_status
    on public.venda(status);

create index idx_venda_vencimento
    on public.venda(data_vencimento);

create index idx_item_venda_venda
    on public.item_venda(venda_id);

create index idx_item_venda_produto
    on public.item_venda(produto_id);

create index idx_pagamento_cliente
    on public.pagamento(cliente_id);

create index idx_pagamento_data
    on public.pagamento(data);

create index idx_pagamento_aplicacao_pagamento
    on public.pagamento_aplicacao(pagamento_id);

create index idx_pagamento_aplicacao_venda
    on public.pagamento_aplicacao(venda_id);

create index idx_devolucao_venda
    on public.devolucao(venda_id);

create index idx_item_devolucao_devolucao
    on public.item_devolucao(devolucao_id);

create index idx_item_devolucao_item_venda
    on public.item_devolucao(item_venda_id);

create index idx_cobranca_cliente
    on public.cobranca(cliente_id);

create index idx_cobranca_data
    on public.cobranca(data);

create index idx_cobranca_venda_cobranca
    on public.cobranca_venda(cobranca_id);

create index idx_cobranca_venda_venda
    on public.cobranca_venda(venda_id);

create index idx_estoque_produto
    on public.movimentacao_estoque(produto_id);

create index idx_estoque_data
    on public.movimentacao_estoque(data);

create index idx_historico_tenant
    on public.historico(tenant_id);

create index idx_historico_entidade
    on public.historico(entidade, entidade_id);

create index idx_historico_data
    on public.historico(data_hora);



-- RLS



alter table public.tenant enable row level security;
alter table public.usuario enable row level security;
alter table public.cliente enable row level security;
alter table public.conta_cliente enable row level security;
alter table public.produto enable row level security;
alter table public.fornecedor enable row level security;
alter table public.entrada_mercadoria enable row level security;
alter table public.item_entrada enable row level security;
alter table public.venda enable row level security;
alter table public.item_venda enable row level security;
alter table public.romaneio enable row level security;
alter table public.pagamento enable row level security;
alter table public.pagamento_aplicacao enable row level security;
alter table public.devolucao enable row level security;
alter table public.item_devolucao enable row level security;
alter table public.cobranca enable row level security;
alter table public.cobranca_venda enable row level security;
alter table public.movimentacao_estoque enable row level security;
alter table public.historico enable row level security;