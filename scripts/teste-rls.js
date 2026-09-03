require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('SUPABASE_URL ou SUPABASE_KEY não configurado no .env');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testarUsuario(email, senha, nome) {
    console.log(`\nTestando: ${nome}`);

    const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password: senha
    });

    if (loginError) {
        console.error('Erro no login:', loginError.message);
        return;
    }

    const { data, error } = await supabase
        .from('usuario')
        .select(`
            id,
            nome,
            email,
            perfil,
            tenant_id,
            tenant:tenant_id (
                id,
                nome
            )
        `);

    if (error) {
        console.error('Erro ao consultar usuario:', error.message);
    } else {
        console.log('Dados retornados:');
        console.log(JSON.stringify(data, null, 2));
    }

    await supabase.auth.signOut();
}

async function main() {
    await testarUsuario(
        process.env.GERENTE_A_EMAIL,
        process.env.GERENTE_A_SENHA,
        'Gerente A'
    );

    await testarUsuario(
        process.env.VENDEDOR_A_EMAIL,
        process.env.VENDEDOR_A_SENHA,
        'Vendedor A'
    );

    await testarUsuario(
        process.env.GERENTE_B_EMAIL,
        process.env.GERENTE_B_SENHA,
        'Gerente B'
    );
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});