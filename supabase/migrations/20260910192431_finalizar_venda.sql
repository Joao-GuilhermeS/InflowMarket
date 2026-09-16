create table if not exists public.tenant_contador (
    tenant_id uuid primary key
        references public.tenant(id)
        on delete cascade,

    proximo_numero_venda bigint not null default 1,
    proximo_numero_romaneio bigint not null default 1
);

alter table public.tenant_contador enable row level security;

create or replace function public.obter_proximo_numero_venda(
    p_tenant_id uuid
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
    v_numero bigint;
begin
    insert into public.tenant_contador (
        tenant_id
    )
    values (
        p_tenant_id
    )
    on conflict (tenant_id) do nothing;

    select proximo_numero_venda
    into v_numero
    from public.tenant_contador
    where tenant_id = p_tenant_id
    for update;

    update public.tenant_contador
    set proximo_numero_venda = proximo_numero_venda + 1
    where tenant_id = p_tenant_id;

    return v_numero;
end;
$$;

create or replace function public.obter_proximo_numero_romaneio(
    p_tenant_id uuid
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
    v_numero bigint;
begin
    insert into public.tenant_contador (
        tenant_id
    )
    values (
        p_tenant_id
    )
    on conflict (tenant_id) do nothing;

    select proximo_numero_romaneio
    into v_numero
    from public.tenant_contador
    where tenant_id = p_tenant_id
    for update;

    update public.tenant_contador
    set proximo_numero_romaneio = proximo_numero_romaneio + 1
    where tenant_id = p_tenant_id;

    return v_numero;
end;
$$;

create or replace function public.finalizar_venda(
    p_venda_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_usuario_id uuid;
    v_tenant_id uuid;
    v_venda public.venda%rowtype;
    v_cliente public.cliente%rowtype;
    v_item public.item_venda%rowtype;
    v_produto public.produto%rowtype;

    v_numero_venda bigint;
    v_numero_romaneio bigint;

    v_valor_item numeric(15,2);
    v_valor_total numeric(15,2) := 0;

    v_data_vencimento date;
begin
    if auth.uid() is null then
        raise exception 'Usuário não autenticado';
    end if;

    select
        u.id,
        u.tenant_id
    into
        v_usuario_id,
        v_tenant_id
    from public.usuario u
    where u.auth_user_id = auth.uid()
      and u.ativo = true;

    if v_usuario_id is null then
        raise exception 'Usuário não cadastrado ou inativo';
    end if;

    select *
    into v_venda
    from public.venda
    where id = p_venda_id
    for update;

    if v_venda.id is null then
        raise exception 'Venda não encontrada';
    end if;

    if v_tenant_id is not null
       and v_venda.tenant_id <> v_tenant_id then
        raise exception 'Venda pertence a outro tenant';
    end if;

    if not exists (
        select 1
        from public.usuario u
        where u.id = v_venda.vendedor_id
          and u.tenant_id = v_venda.tenant_id
          and u.ativo = true
    ) then
        raise exception 'Vendedor inválido para esta venda';
    end if;

    if v_venda.status <> 'EM_ABERTO' then
        raise exception 'Somente vendas em aberto podem ser finalizadas';
    end if;

    select *
    into v_cliente
    from public.cliente
    where id = v_venda.cliente_id
      and tenant_id = v_venda.tenant_id
      and ativo = true;

    if v_cliente.id is null then
        raise exception 'Cliente inválido para esta venda';
    end if;

    if v_cliente.tipo = 'BALCAO'
       and v_venda.tipo_venda <> 'AVISTA' then
        raise exception 'Cliente Balcão só pode realizar vendas à vista';
    end if;

    if v_venda.tipo_venda = 'AVISTA'
       and v_venda.forma_pagamento is null then
        raise exception 'Forma de pagamento obrigatória para venda à vista';
    end if;

    if v_venda.tipo_venda = 'PRAZO'
       and v_venda.forma_pagamento is not null then
        raise exception 'Venda a prazo não deve possuir forma de pagamento';
    end if;

    if v_venda.tipo_venda = 'PRAZO'
       and v_venda.prazo_dias is null then
        raise exception 'Prazo é obrigatório para venda a prazo';
    end if;

    if v_venda.tipo_venda = 'AVISTA'
       and v_venda.prazo_dias is not null then
        raise exception 'Venda à vista não deve possuir prazo';
    end if;

    if v_venda.tipo_venda = 'PRAZO'
       and v_venda.prazo_dias < 0 then
        raise exception 'Prazo não pode ser negativo';
    end if;

    if not exists (
        select 1
        from public.item_venda iv
        where iv.venda_id = p_venda_id
    ) then
        raise exception 'A venda deve possuir pelo menos um item';
    end if;

    for v_item in
        select *
        from public.item_venda
        where venda_id = p_venda_id
        order by id
    loop
        if v_item.quantidade <= 0 then
            raise exception 'A quantidade do item deve ser maior que zero';
        end if;

        if v_item.preco_unitario < 0 then
            raise exception 'O preço unitário não pode ser negativo';
        end if;

        select *
        into v_produto
        from public.produto
        where id = v_item.produto_id
          and tenant_id = v_venda.tenant_id
        for update;

        if v_produto.id is null then
            raise exception 'Produto inválido para esta venda';
        end if;

        v_valor_item :=
            round(
                v_item.quantidade * v_item.preco_unitario,
                2
            );

        update public.item_venda
        set valor_total = v_valor_item
        where id = v_item.id;

        v_valor_total :=
            v_valor_total + v_valor_item;

        update public.produto
        set quantidade_estoque =
            quantidade_estoque - v_item.quantidade
        where id = v_produto.id;

        insert into public.movimentacao_estoque (
            tenant_id,
            produto_id,
            usuario_id,
            item_venda_id,
            tipo,
            quantidade,
            saldo_anterior,
            saldo_posterior
        )
        values (
            v_venda.tenant_id,
            v_produto.id,
            v_usuario_id,
            v_item.id,
            'VENDA',
            v_item.quantidade,
            v_produto.quantidade_estoque,
            v_produto.quantidade_estoque - v_item.quantidade
        );
    end loop;

    if v_valor_total <= 0 then
        raise exception 'O valor total da venda deve ser maior que zero';
    end if;

    v_numero_venda :=
        public.obter_proximo_numero_venda(
            v_venda.tenant_id
        );

    v_numero_romaneio :=
        public.obter_proximo_numero_romaneio(
            v_venda.tenant_id
        );

    update public.venda
    set
        numero = v_numero_venda,
        valor_total = v_valor_total,
        data_atualizacao = now()
    where id = p_venda_id;

    if v_venda.tipo_venda = 'AVISTA' then

        update public.venda
        set
            valor_pago = v_valor_total,
            saldo = 0,
            status = 'PAGA'
        where id = p_venda_id;

        insert into public.pagamento (
            tenant_id,
            cliente_id,
            usuario_id,
            valor,
            forma_pagamento,
            observacao,
            status
        )
        values (
            v_venda.tenant_id,
            v_venda.cliente_id,
            v_usuario_id,
            v_valor_total,
            v_venda.forma_pagamento,
            'Pagamento referente à venda ' || v_numero_venda,
            'REGISTRADO'
        );

    else

        v_data_vencimento :=
            v_venda.data_venda::date
            + v_venda.prazo_dias;

        update public.venda
        set
            valor_pago = 0,
            saldo = v_valor_total,
            data_vencimento = v_data_vencimento,
            status = 'EM_ABERTO'
        where id = p_venda_id;

        insert into public.conta_cliente (
            cliente_id,
            saldo_devedor
        )
        values (
            v_venda.cliente_id,
            v_valor_total
        )
        on conflict (cliente_id)
        do update
        set
            saldo_devedor =
                public.conta_cliente.saldo_devedor
                + excluded.saldo_devedor,
            data_atualizacao = now();

    end if;

    insert into public.romaneio (
        venda_id,
        numero
    )
    values (
        p_venda_id,
        v_numero_romaneio
    );

    return p_venda_id;
end;
$$;

revoke all
on function public.obter_proximo_numero_venda(uuid)
from public;

revoke all
on function public.obter_proximo_numero_romaneio(uuid)
from public;

revoke all
on function public.finalizar_venda(uuid)
from public;

grant execute
on function public.obter_proximo_numero_venda(uuid)
to authenticated;

grant execute
on function public.obter_proximo_numero_romaneio(uuid)
to authenticated;

grant execute
on function public.finalizar_venda(uuid)
to authenticated;