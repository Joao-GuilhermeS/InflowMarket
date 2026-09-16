CREATE UNIQUE INDEX IF NOT EXISTS uq_usuario_auth_user_id
ON public.usuario(auth_user_id)
WHERE auth_user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.get_current_usuario()
RETURNS public.usuario
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT u
    FROM public.usuario u
    WHERE u.auth_user_id = auth.uid()
    AND u.ativo = true
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT u.tenant_id
    FROM public.usuario u
    WHERE u.auth_user_id = auth.uid()
    AND u.ativo = true
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_current_perfil()
RETURNS public.perfil_usuario
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT u.perfil
    FROM public.usuario u
    WHERE u.auth_user_id = auth.uid()
    AND u.ativo = true
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_desenvolvedor()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER''''''''''''''''''''''''    
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.usuario u
        WHERE u.auth_user_id = auth.uid()
        AND u.perfil = 'DESENVOLVEDOR'::public.perfil_usuario
        AND u.ativo = true
    );
$$;

CREATE OR REPLACE FUNCTION public.is_gerente_ou_desenvolvedor()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.usuario u
        WHERE u.auth_user_id = auth.uid()
        AND u.ativo = true
        AND u.perfil IN (
            'GERENTE'::public.perfil_usuario,
            'DESENVOLVEDOR'::public.perfil_usuario
        )
    );
$$;

CREATE OR REPLACE FUNCTION public.tem_acesso_tenant(p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT
        public.is_desenvolvedor()
        OR EXISTS (
            SELECT 1
            FROM public.usuario u
            WHERE u.auth_user_id = auth.uid()
            AND u.ativo = true
            AND u.tenant_id = p_tenant_id
        );
$$;

ALTER TABLE public.tenant ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conta_cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.produto ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fornecedor ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entrada_mercadoria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_entrada ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.venda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_venda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.romaneio ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagamento_aplicacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.devolucao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.item_devolucao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cobranca ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cobranca_venda ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.movimentacao_estoque ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.historico ENABLE ROW LEVEL SECURITY;