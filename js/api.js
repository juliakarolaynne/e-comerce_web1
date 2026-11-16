const API_URL = 'https://ppw-1-tads.vercel.app';

async function requisicao(endpoint, metodo = 'GET', dados = null) {
    const configuracao = {
        method: metodo,
        headers: {}
    };

    if (dados) {
        configuracao.headers['Content-Type'] = 'application/json';
        configuracao.body = JSON.stringify(dados);
    }

    try {
        const resposta = await fetch(API_URL + endpoint, configuracao);
        const json = await resposta.json().catch(() => ({}));

        return {
            ok: resposta.ok,
            status: resposta.status,
            dados: json,
            mensagem: json.mensagem || ''
        };
    } catch (erro) {
        return {
            ok: false,
            status: 500,
            dados: null,
            mensagem: 'Erro ao conectar com o servidor.'
        };
    }
}

async function apiGet(endpoint) {
    return requisicao(endpoint, 'GET');
}

async function apiPost(endpoint, dados) {
    return requisicao(endpoint, 'POST', dados);
}

async function apiPut(endpoint, dados) {
    return requisicao(endpoint, 'PUT', dados);
}

async function apiDelete(endpoint, dados = null) {
    return requisicao(endpoint, 'DELETE', dados);
}
