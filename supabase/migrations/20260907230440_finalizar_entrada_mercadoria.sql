create or replace function public.finalizar_entrada_mercadoria(
    p_entrada_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
    v_usuario_id uuid;
    v_tenant_id uuid;
    v_entrada public.entrada_mercadoria%rowtype;
    v_item public.item_entrada%rowtype;
    v_produto public.produto%rowtype;
    v_valor_item numeric(15,2);
    v_valor_total numeric(15,2) := 0;
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
    where u.auth_user_id = auth.uid();

    if v_usuario_id is null then
        raise exception 'Usuário não cadastrado no sistema';
    end if;

    select *
    into v_entrada
    from public.entrada_mercadoria
    where id = p_entrada_id
    for update;

    if v_entrada.id is null then
        raise exception 'Entrada de mercadoria não encontrada';
    end if;

    if v_tenant_id is not null
       and v_entrada.tenant_id <> v_tenant_id then
        raise exception 'Entrada pertence a outro tenant';
    end if;

    if v_entrada.status <> 'ABERTA' then
        raise exception 'Somente entradas abertas podem ser finalizadas';
    end if;

    if not exists (
        select 1
        from public.item_entrada ie
        where ie.entrada_id = p_entrada_id
    ) then
        raise exception 'A entrada deve possuir pelo menos um item';
    end if;

    if not exists (
        select 1
        from public.fornecedor f
        where f.id = v_entrada.fornecedor_id
          and f.tenant_id = v_entrada.tenant_id
    ) then
        raise exception 'Fornecedor inválido para esta entrada';
    end if;

    for v_item in
        select *
        from public.item_entrada
        where entrada_id = p_entrada_id
        order by id
    loop
        if v_item.quantidade <= 0 then
            raise exception 'A quantidade do item deve ser maior que zero';
        end if;

        if v_item.custo_unitario < 0 then
            raise exception 'O custo unitário não pode ser negativo';
        end if;

        select *
        into v_produto
        from public.produto
        where id = v_item.produto_id
          and tenant_id = v_entrada.tenant_id
        for update;

        if v_produto.id is null then
            raise exception 'Produto inválido para esta entrada';
        end if;

        v_valor_item :=
            round(
                v_item.quantidade * v_item.custo_unitario,
                2
            );

        update public.item_entrada
        set valor_total = v_valor_item
        where id = v_item.id;

        v_valor_total :=
            v_valor_total + v_valor_item;

        update public.produto
        set quantidade_estoque =
            quantidade_estoque + v_item.quantidade
        where id = v_produto.id;

        insert into public.movimentacao_estoque (
            tenant_id,
            produto_id,
            usuario_id,
            item_entrada_id,
            tipo,
            quantidade,
            saldo_anterior,
            saldo_posterior
        )
        values (
            v_entrada.tenant_id,
            v_produto.id,
            v_usuario_id,
            v_item.id,
            'ENTRADA',
            v_item.quantidade,
            v_produto.quantidade_estoque,
            v_produto.quantidade_estoque + v_item.quantidade
        );
    end loop;

    update public.entrada_mercadoria
    set
        valor_total = v_valor_total,
        status = 'FINALIZADA'
    where id = p_entrada_id;

    return p_entrada_id;
end;
$$;

revoke all
on function public.finalizar_entrada_mercadoria(uuid)
from public;

grant execute
on function public.finalizar_entrada_mercadoria(uuid)
to authenticated;