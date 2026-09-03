CREATE POLICY tenant_select
ON public.tenant
FOR SELECT
TO authenticated
USING (
    public.is_desenvolvedor()
    OR id = public.get_current_tenant_id()
);

CREATE POLICY tenant_update
ON public.tenant
FOR UPDATE
TO authenticated
USING (
    public.is_desenvolvedor()
    OR (
        id = public.get_current_tenant_id()
        AND public.is_gerente_ou_desenvolvedor()
    )
)
WITH CHECK (
    public.is_desenvolvedor()
    OR (
        id = public.get_current_tenant_id()
        AND public.is_gerente_ou_desenvolvedor()
    )
);

CREATE POLICY usuario_select
ON public.usuario
FOR SELECT
TO authenticated
USING (
    public.is_desenvolvedor()
    OR tenant_id = public.get_current_tenant_id()
);

CREATE POLICY usuario_insert
ON public.usuario
FOR INSERT
TO authenticated
WITH CHECK (
    public.is_desenvolvedor()
    OR (
        tenant_id = public.get_current_tenant_id()
        AND public.is_gerente_ou_desenvolvedor()
    )
);

CREATE POLICY usuario_update
ON public.usuario
FOR UPDATE
TO authenticated
USING (
    public.is_desenvolvedor()
    OR (
        tenant_id = public.get_current_tenant_id()
        AND public.is_gerente_ou_desenvolvedor()
    )
)
WITH CHECK (
    public.is_desenvolvedor()
    OR (
        tenant_id = public.get_current_tenant_id()
        AND public.is_gerente_ou_desenvolvedor()
    )
);

CREATE POLICY usuario_delete
ON public.usuario
FOR DELETE
TO authenticated
USING (
    public.is_desenvolvedor()
    OR (
        tenant_id = public.get_current_tenant_id()
        AND public.is_gerente_ou_desenvolvedor()
    )
);

CREATE POLICY cliente_select
ON public.cliente
FOR SELECT
TO authenticated
USING (
    public.tem_acesso_tenant(tenant_id)
);

CREATE POLICY cliente_insert
ON public.cliente
FOR INSERT
TO authenticated
WITH CHECK (
    public.tem_acesso_tenant(tenant_id)
);

CREATE POLICY cliente_update
ON public.cliente
FOR UPDATE
TO authenticated
USING (
    public.tem_acesso_tenant(tenant_id)
)
WITH CHECK (
    public.tem_acesso_tenant(tenant_id)
);

CREATE POLICY cliente_delete
ON public.cliente
FOR DELETE
TO authenticated
USING (
    public.tem_acesso_tenant(tenant_id)
    AND public.is_gerente_ou_desenvolvedor()
);

CREATE POLICY produto_select
ON public.produto
FOR SELECT
TO authenticated
USING (
    public.tem_acesso_tenant(tenant_id)
);

CREATE POLICY produto_insert
ON public.produto
FOR INSERT
TO authenticated
WITH CHECK (
    public.tem_acesso_tenant(tenant_id)
    AND public.is_gerente_ou_desenvolvedor()
);

CREATE POLICY produto_update
ON public.produto
FOR UPDATE
TO authenticated
USING (
    public.tem_acesso_tenant(tenant_id)
    AND public.is_gerente_ou_desenvolvedor()
)
WITH CHECK (
    public.tem_acesso_tenant(tenant_id)
);

CREATE POLICY produto_delete
ON public.produto
FOR DELETE
TO authenticated
USING (
    public.tem_acesso_tenant(tenant_id)
    AND public.is_gerente_ou_desenvolvedor()
);

CREATE POLICY fornecedor_select
ON public.fornecedor
FOR SELECT
TO authenticated
USING (
    public.tem_acesso_tenant(tenant_id)
);

CREATE POLICY fornecedor_insert
ON public.fornecedor
FOR INSERT
TO authenticated
WITH CHECK (
    public.tem_acesso_tenant(tenant_id)
    AND public.is_gerente_ou_desenvolvedor()
);

CREATE POLICY fornecedor_update
ON public.fornecedor
FOR UPDATE
TO authenticated
USING (
    public.tem_acesso_tenant(tenant_id)
    AND public.is_gerente_ou_desenvolvedor()
)
WITH CHECK (
    public.tem_acesso_tenant(tenant_id)
);

CREATE POLICY fornecedor_delete
ON public.fornecedor
FOR DELETE
TO authenticated
USING (
    public.tem_acesso_tenant(tenant_id)
    AND public.is_gerente_ou_desenvolvedor()
);

CREATE POLICY entrada_select
ON public.entrada_mercadoria
FOR SELECT
TO authenticated
USING (
    public.tem_acesso_tenant(tenant_id)
);

CREATE POLICY entrada_insert
ON public.entrada_mercadoria
FOR INSERT
TO authenticated
WITH CHECK (
    public.tem_acesso_tenant(tenant_id)
);

CREATE POLICY entrada_update
ON public.entrada_mercadoria
FOR UPDATE
TO authenticated
USING (
    public.tem_acesso_tenant(tenant_id)
    AND public.is_gerente_ou_desenvolvedor()
)
WITH CHECK (
    public.tem_acesso_tenant(tenant_id)
);

CREATE POLICY entrada_delete
ON public.entrada_mercadoria
FOR DELETE
TO authenticated
USING (
    public.tem_acesso_tenant(tenant_id)
    AND public.is_gerente_ou_desenvolvedor()
);

CREATE POLICY item_entrada_select
ON public.item_entrada
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.entrada_mercadoria e
        WHERE e.id = entrada_id
        AND public.tem_acesso_tenant(e.tenant_id)
    )
);

CREATE POLICY item_entrada_insert
ON public.item_entrada
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.entrada_mercadoria e
        WHERE e.id = entrada_id
        AND public.tem_acesso_tenant(e.tenant_id)
    )
);

CREATE POLICY item_entrada_update
ON public.item_entrada
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.entrada_mercadoria e
        WHERE e.id = entrada_id
        AND public.tem_acesso_tenant(e.tenant_id)
        AND public.is_gerente_ou_desenvolvedor()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.entrada_mercadoria e
        WHERE e.id = entrada_id
        AND public.tem_acesso_tenant(e.tenant_id)
    )
);

CREATE POLICY venda_select
ON public.venda
FOR SELECT
TO authenticated
USING (
    public.tem_acesso_tenant(tenant_id)
);

CREATE POLICY venda_insert
ON public.venda
FOR INSERT
TO authenticated
WITH CHECK (
    public.tem_acesso_tenant(tenant_id)
);

CREATE POLICY venda_update
ON public.venda
FOR UPDATE
TO authenticated
USING (
    public.tem_acesso_tenant(tenant_id)
    AND public.is_gerente_ou_desenvolvedor()
)
WITH CHECK (
    public.tem_acesso_tenant(tenant_id)
);

CREATE POLICY venda_delete
ON public.venda
FOR DELETE
TO authenticated
USING (
    public.tem_acesso_tenant(tenant_id)
    AND public.is_gerente_ou_desenvolvedor()
);

CREATE POLICY item_venda_select
ON public.item_venda
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.venda v
        WHERE v.id = venda_id
        AND public.tem_acesso_tenant(v.tenant_id)
    )
);

CREATE POLICY item_venda_insert
ON public.item_venda
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.venda v
        WHERE v.id = venda_id
        AND public.tem_acesso_tenant(v.tenant_id)
    )
);

CREATE POLICY item_venda_update
ON public.item_venda
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.venda v
        WHERE v.id = venda_id
        AND public.tem_acesso_tenant(v.tenant_id)
        AND public.is_gerente_ou_desenvolvedor()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.venda v
        WHERE v.id = venda_id
        AND public.tem_acesso_tenant(v.tenant_id)
    )
);

CREATE POLICY romaneio_select
ON public.romaneio
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.venda v
        WHERE v.id = venda_id
        AND public.tem_acesso_tenant(v.tenant_id)
    )
);

CREATE POLICY romaneio_insert
ON public.romaneio
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.venda v
        WHERE v.id = venda_id
        AND public.tem_acesso_tenant(v.tenant_id)
    )
);

CREATE POLICY pagamento_select
ON public.pagamento
FOR SELECT
TO authenticated
USING (
    public.tem_acesso_tenant(tenant_id)
);

CREATE POLICY pagamento_insert
ON public.pagamento
FOR INSERT
TO authenticated
WITH CHECK (
    public.tem_acesso_tenant(tenant_id)
    AND public.is_gerente_ou_desenvolvedor()
);

CREATE POLICY pagamento_update
ON public.pagamento
FOR UPDATE
TO authenticated
USING (
    public.tem_acesso_tenant(tenant_id)
    AND public.is_gerente_ou_desenvolvedor()
)
WITH CHECK (
    public.tem_acesso_tenant(tenant_id)
);

CREATE POLICY pagamento_aplicacao_select
ON public.pagamento_aplicacao
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.pagamento p
        WHERE p.id = pagamento_id
        AND public.tem_acesso_tenant(p.tenant_id)
    )
);

CREATE POLICY pagamento_aplicacao_insert
ON public.pagamento_aplicacao
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.pagamento p
        WHERE p.id = pagamento_id
        AND public.tem_acesso_tenant(p.tenant_id)
        AND public.is_gerente_ou_desenvolvedor()
    )
);

CREATE POLICY devolucao_select
ON public.devolucao
FOR SELECT
TO authenticated
USING (
    public.tem_acesso_tenant(tenant_id)
);

CREATE POLICY devolucao_insert
ON public.devolucao
FOR INSERT
TO authenticated
WITH CHECK (
    public.tem_acesso_tenant(tenant_id)
    AND public.is_gerente_ou_desenvolvedor()
);

CREATE POLICY devolucao_update
ON public.devolucao
FOR UPDATE
TO authenticated
USING (
    public.tem_acesso_tenant(tenant_id)
    AND public.is_gerente_ou_desenvolvedor()
)
WITH CHECK (
    public.tem_acesso_tenant(tenant_id)
);

CREATE POLICY item_devolucao_select
ON public.item_devolucao
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.devolucao d
        WHERE d.id = devolucao_id
        AND public.tem_acesso_tenant(d.tenant_id)
    )
);

CREATE POLICY item_devolucao_insert
ON public.item_devolucao
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.devolucao d
        WHERE d.id = devolucao_id
        AND public.tem_acesso_tenant(d.tenant_id)
        AND public.is_gerente_ou_desenvolvedor()
    )
);

CREATE POLICY cobranca_select
ON public.cobranca
FOR SELECT
TO authenticated
USING (
    public.tem_acesso_tenant(tenant_id)
);

CREATE POLICY cobranca_insert
ON public.cobranca
FOR INSERT
TO authenticated
WITH CHECK (
    public.tem_acesso_tenant(tenant_id)
);

CREATE POLICY cobranca_update
ON public.cobranca
FOR UPDATE
TO authenticated
USING (
    public.tem_acesso_tenant(tenant_id)
)
WITH CHECK (
    public.tem_acesso_tenant(tenant_id)
);

CREATE POLICY cobranca_venda_select
ON public.cobranca_venda
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.cobranca c
        WHERE c.id = cobranca_id
        AND public.tem_acesso_tenant(c.tenant_id)
    )
);

CREATE POLICY cobranca_venda_insert
ON public.cobranca_venda
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.cobranca c
        WHERE c.id = cobranca_id
        AND public.tem_acesso_tenant(c.tenant_id)
    )
);

CREATE POLICY conta_cliente_select
ON public.conta_cliente
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.cliente c
        WHERE c.id = cliente_id
        AND public.tem_acesso_tenant(c.tenant_id)
    )
);

CREATE POLICY conta_cliente_update
ON public.conta_cliente
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1
        FROM public.cliente c
        WHERE c.id = cliente_id
        AND public.tem_acesso_tenant(c.tenant_id)
        AND public.is_gerente_ou_desenvolvedor()
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1
        FROM public.cliente c
        WHERE c.id = cliente_id
        AND public.tem_acesso_tenant(c.tenant_id)
    )
);

CREATE POLICY movimentacao_estoque_select
ON public.movimentacao_estoque
FOR SELECT
TO authenticated
USING (
    public.tem_acesso_tenant(tenant_id)
);

CREATE POLICY movimentacao_estoque_insert
ON public.movimentacao_estoque
FOR INSERT
TO authenticated
WITH CHECK (
    public.tem_acesso_tenant(tenant_id)
);

CREATE POLICY historico_select
ON public.historico
FOR SELECT
TO authenticated
USING (
    public.tem_acesso_tenant(tenant_id)
);

CREATE POLICY historico_insert
ON public.historico
FOR INSERT
TO authenticated
WITH CHECK (
    public.tem_acesso_tenant(tenant_id)
);
