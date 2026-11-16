function aplicarTemaSalvo() {
    const temaSalvo = localStorage.getItem('tema') || 'light';
    document.documentElement.setAttribute('data-bs-theme', temaSalvo);
    atualizarBotaoTema(temaSalvo);
}

function alternarTema() {
    const temaAtual = document.documentElement.getAttribute('data-bs-theme') || 'light';
    const novoTema = temaAtual === 'dark' ? 'light' : 'dark';

    document.documentElement.setAttribute('data-bs-theme', novoTema);
    localStorage.setItem('tema', novoTema);
    atualizarBotaoTema(novoTema);
}

function atualizarBotaoTema(tema) {
    const btnTema = document.getElementById('btnAlternarTema');
    if (!btnTema) return;
    if (tema === 'dark') {
        btnTema.innerHTML = '☀️';
        btnTema.setAttribute('title', 'Mudar para Tema Claro');
    } else {
        btnTema.innerHTML = '🌙';
        btnTema.setAttribute('title', 'Mudar para Tema Escuro');
    }
}

aplicarTemaSalvo();

function atualizarCabecalhoUsuario() {
    const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
    const dropdownMenu = document.getElementById('menuUsuario');
    const dropdownToggle = document.getElementById('toggleUsuario');

    if (!dropdownMenu || !dropdownToggle) return;

    if (usuarioLogado && (usuarioLogado.nome || usuarioLogado.email)) {
        const primeiroNome = (usuarioLogado.nome || usuarioLogado.email.split('@')[0]).split(' ')[0];
        dropdownToggle.innerHTML = `Olá, ${primeiroNome}`;
        
        dropdownMenu.innerHTML = `
            <li><a class="dropdown-item" href="dados_pessoais.html">Meus Dados</a></li>
            <li><a class="dropdown-item" href="meus_pedidos.html">Meus Pedidos</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item text-danger fw-bold" href="#" onclick="logout(); return false;">Sair</a></li>
        `;
    } else {
        dropdownToggle.innerHTML = `Olá, Visitante`;
        dropdownMenu.innerHTML = `
            <li><a class="dropdown-item" href="novo_usuario.html">Cadastrar</a></li>
            <li><a class="dropdown-item" href="login.html">Entrar</a></li>
        `;
    }
}

function logout() {
    localStorage.removeItem('usuarioLogado');
    alert('Você saiu da sua conta.');
    window.location.href = 'index.html';
}

async function cadastrarUsuario(event) {
    if (event) event.preventDefault();

    const nome = document.getElementById('nomeCadastro').value.trim();
    const email = document.getElementById('emailCadastro').value.trim();
    const telefone = document.getElementById('telefoneCadastro') ? document.getElementById('telefoneCadastro').value.trim() : '';
    const senha = document.getElementById('senhaCadastro').value;
    const confirmacaoSenha = document.getElementById('confirmaSenha').value;

    if (!nome || !email || !senha || !confirmacaoSenha) {
        alert('Por favor, preencha todos os campos obrigatórios!');
        return false;
    }

    if (senha !== confirmacaoSenha) {
        alert('Erro: A confirmação de senha não coincide com a senha digitada!');
        return false;
    }

    if (senha.length < 6) {
        alert('A senha deve ter pelo menos 6 caracteres!');
        return false;
    }

    const resposta = await apiPost('/api/register', {
        nome: nome,
        email: email,
        senha: senha,
        confirmacaoSenha: confirmacaoSenha
    });

    if (resposta.status === 201) {
        alert('Cadastro realizado com sucesso! Faça login para continuar.');
        window.location.href = 'login.html';
    } else if (resposta.status === 400) {
        alert(resposta.mensagem || 'Dados inválidos. Verifique os campos preenchidos.');
    } else if (resposta.status === 409) {
        alert('Atenção: Este e-mail já está cadastrado!');
    } else if (resposta.status === 422) {
        alert('A senha deve ter pelo menos 6 caracteres!');
    } else {
        alert(resposta.mensagem || 'Erro ao realizar cadastro. Tente novamente.');
    }

    return false;
}

async function realizarLogin(event) {
    if (event) event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;

    if (!email || !senha) {
        alert('Preencha o e-mail e a senha!');
        return false;
    }

    const resposta = await apiPost('/api/login', {
        email: email,
        senha: senha
    });

    if (resposta.status === 200) {
        const usuario = (resposta.dados && resposta.dados.usuario) ? resposta.dados.usuario : { nome: email.split('@')[0], email: email };
        localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
        alert(resposta.mensagem || 'Login realizado com sucesso!');
        window.location.href = 'index.html';
    } else if (resposta.status === 400) {
        alert('E-mail ou senha ausentes. Verifique os campos preenchidos.');
    } else if (resposta.status === 401) {
        alert('Credenciais inválidas! Verifique o e-mail e a senha digitados.');
    } else {
        alert(resposta.mensagem || 'Erro ao realizar login. Tente novamente.');
    }

    return false;
}

function atualizarCabecalhoCarrinho() {
    const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    let totalItens = 0;
    for (let i = 0; i < carrinho.length; i++) {
        totalItens += carrinho[i].quantidade;
    }

    const badge = document.getElementById('carrinho-badge');
    if (badge) {
        if (totalItens > 0) {
            badge.innerText = totalItens;
            badge.classList.remove('d-none');
        } else {
            badge.classList.add('d-none');
        }
    }
}

let temporizadorDebounce = null;

function buscarComDebounce() {
    clearTimeout(temporizadorDebounce);
    temporizadorDebounce = setTimeout(() => {
        aplicarFiltrosProdutos();
    }, 400);
}

function aplicarFiltrosProdutos() {
    const campoBusca = document.getElementById('campoBusca');
    const filtroCategoria = document.getElementById('filtroCategoria');

    const termo = campoBusca ? campoBusca.value.trim() : '';
    const categoria = filtroCategoria ? filtroCategoria.value : '';

    carregarProdutos(termo, categoria);
}

async function carregarProdutos(termo = '', categoria = '') {
    const container = document.getElementById('lista-produtos');
    if (!container) return;

    let url = '/api/products';
    const params = [];
    if (termo) params.push(`search=${encodeURIComponent(termo)}`);
    if (categoria) params.push(`category=${encodeURIComponent(categoria)}`);
    if (params.length > 0) {
        url += '?' + params.join('&');
    }

    container.innerHTML = '<div class="col-12 text-center py-5"><div class="spinner-border text-dark" role="status"></div><p class="mt-2 text-muted">Carregando produtos...</p></div>';

    const resposta = await apiGet(url);

    if (!resposta.ok || !resposta.dados || !resposta.dados.products) {
        container.innerHTML = '<div class="col-12 text-center py-5"><p class="text-danger fw-bold">Não foi possível carregar os produtos no momento.</p></div>';
        return;
    }

    const produtos = resposta.dados.products;

    if (produtos.length === 0) {
        container.innerHTML = '<div class="col-12 text-center py-5"><p class="text-muted fs-5">Nenhum produto encontrado.</p></div>';
        return;
    }

    let html = '';
    for (let i = 0; i < produtos.length; i++) {
        const prod = produtos[i];
        const precoFormatado = Number(prod.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const esgotado = prod.stock === 0;

        html += `
            <div class="col-12 col-md-6 col-lg-3 d-flex">
                <div class="card w-100 border-0 shadow-sm rounded-4 p-2 ${esgotado ? 'opacity-75' : ''}">
                    <input type="hidden" name="produto_id" value="${prod.id}">
                    <div class="position-relative">
                        <img src="${prod.image}" class="card-img-top rounded-3" alt="${prod.name}" style="height: 200px; object-fit: contain;">
                        ${esgotado ? '<span class="badge bg-danger position-absolute top-0 end-0 m-2">Esgotado</span>' : ''}
                    </div>
                    <div class="card-body d-flex flex-column p-3">
                        <span class="badge bg-light text-dark align-self-start mb-2 border">${prod.category}</span>
                        <h3 class="card-title fs-5 text-center fw-bold">${prod.name}</h3>
                        <p class="card-text text-center flex-grow-1 texto-produto text-muted">
                            ${prod.description}
                        </p>
                        <span class="d-block text-center fw-bold fs-5 mb-3 text-dark">${precoFormatado}</span>
                        ${esgotado ? `
                            <button type="button" class="btn btn-secondary w-100 mt-auto fw-medium" disabled>
                                Esgotado
                            </button>
                        ` : `
                            <button type="button" class="btn btn-dark w-100 mt-auto fw-medium"
                                onclick="adicionarAoCarrinho('${prod.id}', '${prod.name.replace(/'/g, "\\'")}', ${prod.price}, '${prod.image}')">
                                Adicionar ao Carrinho
                            </button>
                        `}
                    </div>
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
}

function adicionarAoCarrinho(id, nome, preco, imagem) {
    let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];

    const idProd = String(id);
    const itemExistente = carrinho.find(item => String(item.id) === idProd);

    if (itemExistente) {
        itemExistente.quantidade += 1;
    } else {
        carrinho.push({
            id: idProd,
            nome: nome,
            preco: Number(preco),
            imagem: imagem,
            quantidade: 1
        });
    }

    localStorage.setItem('carrinho', JSON.stringify(carrinho));
    atualizarCabecalhoCarrinho();
    exibirToastAdicionado(nome);
}

function exibirToastAdicionado(nomeProduto) {
    const toastEl = document.getElementById('toastAdicionado');
    if (toastEl) {
        const toastNome = document.getElementById('toastProdutoNome');
        if (toastNome) toastNome.innerText = nomeProduto;
        const toast = new bootstrap.Toast(toastEl);
        toast.show();
    } else {
        alert(`"${nomeProduto}" foi adicionado ao carrinho!`);
    }
}

function carregarCarrinho() {
    const listaContainer = document.getElementById('itens-carrinho');
    const totalItensEl = document.getElementById('resumo-total-itens');
    const valorTotalEl = document.getElementById('resumo-valor-total');
    const parcelamentoEl = document.getElementById('resumo-parcelamento');
    const btnFinalizar = document.getElementById('btnFinalizarCompra');
    const subtotalEl = document.getElementById('resumo-subtotal');

    if (!listaContainer) return;

    if (localStorage.getItem('carrinho') === null) {
        const produtosIniciais = [
            {
                id: '1',
                nome: 'Nintendo Switch Lite',
                preco: 1366.67,
                imagem: 'assets/img/nintendo switch lite.jpg',
                quantidade: 1
            },
            {
                id: '2',
                nome: 'Nintendo Switch',
                preco: 2299.45,
                imagem: 'assets/img/nintendo switch.jpg',
                quantidade: 1
            }
        ];
        localStorage.setItem('carrinho', JSON.stringify(produtosIniciais));
    }

    let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];

    if (carrinho.length === 0) {
        listaContainer.innerHTML = `
            <div class="card border-0 shadow-sm rounded-4 p-5 text-center bg-white">
                <h4 class="fw-bold mb-3">Seu carrinho está vazio</h4>
                <p class="text-muted mb-4">Você ainda não adicionou nenhum item ao seu carrinho de compras.</p>
                <div>
                    <a href="produtos.html" class="btn btn-dark px-4 py-2 rounded-3">Ver Produtos Disponíveis</a>
                </div>
            </div>
        `;
        if (totalItensEl) totalItensEl.innerText = '0';
        if (valorTotalEl) valorTotalEl.innerText = 'R$ 0,00';
        if (subtotalEl) subtotalEl.innerText = 'R$ 0,00';
        if (parcelamentoEl) parcelamentoEl.innerHTML = '10x de R$ 0,00';
        if (btnFinalizar) btnFinalizar.disabled = true;
        return;
    }

    let html = '';
    let totalGeral = 0;
    let qtdTotal = 0;

    for (let i = 0; i < carrinho.length; i++) {
        const item = carrinho[i];
        const subtotal = item.preco * item.quantidade;
        totalGeral += subtotal;
        qtdTotal += item.quantidade;

        html += `
            <div class="card mb-3 border-0 shadow-sm rounded-4">
                <div class="row g-0 align-items-center p-3">
                    <div class="col-4 col-md-3 text-center">
                        <img src="${item.imagem}" class="img-fluid rounded-3" alt="${item.nome}" style="max-height: 110px; object-fit: contain;">
                    </div>
                    <div class="col-8 col-md-9">
                        <div class="card-body d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center py-0">
                            <div>
                                <h5 class="card-title fw-bold fs-5 mb-1">${item.nome}</h5>
                                <span class="fs-6 fw-medium text-dark d-block mb-2">R$ ${item.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                <div class="d-flex align-items-center gap-2">
                                    <button type="button" class="btn btn-sm btn-outline-secondary px-2 py-0" onclick="alterarQuantidade('${item.id}', -1)">-</button>
                                    <span class="badge bg-light text-dark border px-3 py-1 fs-6">${item.quantidade}</span>
                                    <button type="button" class="btn btn-sm btn-outline-secondary px-2 py-0" onclick="alterarQuantidade('${item.id}', 1)">+</button>
                                </div>
                            </div>
                            <div class="text-md-end mt-3 mt-md-0">
                                <span class="d-block fw-bold fs-5 mb-2">Subtotal: R$ ${subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                <button type="button" class="btn btn-outline-danger btn-sm" onclick="removerDoCarrinho('${item.id}')">
                                    Remover
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    listaContainer.innerHTML = html;

    if (totalItensEl) totalItensEl.innerText = qtdTotal;
    if (subtotalEl) subtotalEl.innerText = `R$ ${totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (parcelamentoEl) {
        const parcela = totalGeral / 10;
        parcelamentoEl.innerHTML = `10x sem juros<br>de R$ ${parcela.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (btnFinalizar) btnFinalizar.disabled = false;

    atualizarTotalComFrete();
}

function alterarQuantidade(id, delta) {
    let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    const item = carrinho.find(i => String(i.id) === String(id));

    if (item) {
        item.quantidade += delta;
        if (item.quantidade <= 0) {
            carrinho = carrinho.filter(i => String(i.id) !== String(id));
        }
        localStorage.setItem('carrinho', JSON.stringify(carrinho));
        atualizarCabecalhoCarrinho();
        carregarCarrinho();
    }
}

function removerDoCarrinho(id) {
    let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    carrinho = carrinho.filter(item => String(item.id) !== String(id));
    localStorage.setItem('carrinho', JSON.stringify(carrinho));
    atualizarCabecalhoCarrinho();
    carregarCarrinho();
}

let freteSelecionado = null;

async function calcularFrete() {
    const campoCep = document.getElementById('campoCep');
    const resultadoDiv = document.getElementById('resultado-frete');

    if (!campoCep || !resultadoDiv) return;

    const cep = campoCep.value.trim();

    if (!cep) {
        alert('Digite um CEP para calcular o frete!');
        return;
    }

    resultadoDiv.innerHTML = '<div class="text-center"><div class="spinner-border spinner-border-sm text-dark" role="status"></div> Calculando...</div>';

    const resposta = await apiPost('/api/frete', { cep: cep });

    if (resposta.status === 200 && resposta.dados && resposta.dados.fretes) {
        const fretes = resposta.dados.fretes;
        let html = '';

        for (let i = 0; i < fretes.length; i++) {
            const f = fretes[i];
            const valorFormatado = Number(f.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

            html += `
                <div class="form-check border rounded-3 p-2 ps-4 mb-1">
                    <input class="form-check-input" type="radio" name="freteOpcao" id="frete${i}" 
                        value="${f.valor}" data-servico="${f.servico}" onchange="selecionarFrete(${f.valor}, '${f.servico}')">
                    <label class="form-check-label small w-100" for="frete${i}">
                        <strong>${f.servico}</strong> - ${valorFormatado}<br>
                        <span class="text-muted">${f.prazo}</span>
                    </label>
                </div>
            `;
        }

        resultadoDiv.innerHTML = html;
    } else if (resposta.status === 400) {
        alert('CEP inválido! Use o formato 00000-000.');
        resultadoDiv.innerHTML = '';
    } else if (resposta.status === 404) {
        alert('CEP não encontrado na base de dados.');
        resultadoDiv.innerHTML = '';
    } else if (resposta.status === 422) {
        alert('Não realizamos entregas para esta região.');
        resultadoDiv.innerHTML = '';
    } else {
        alert(resposta.mensagem || 'Erro ao calcular frete.');
        resultadoDiv.innerHTML = '';
    }
}

function selecionarFrete(valor, servico) {
    freteSelecionado = { valor: valor, servico: servico };
    atualizarTotalComFrete();
}

function atualizarTotalComFrete() {
    const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    let subtotal = 0;
    for (let i = 0; i < carrinho.length; i++) {
        subtotal += carrinho[i].preco * carrinho[i].quantidade;
    }

    const valorTotalEl = document.getElementById('resumo-valor-total');
    const linhaFrete = document.getElementById('linha-frete');
    const resumoFrete = document.getElementById('resumo-frete');
    const parcelamentoEl = document.getElementById('resumo-parcelamento');

    let total = subtotal;

    if (freteSelecionado && linhaFrete && resumoFrete) {
        total += freteSelecionado.valor;
        resumoFrete.innerText = `R$ ${freteSelecionado.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        linhaFrete.classList.remove('d-none');
    }

    if (valorTotalEl) {
        valorTotalEl.innerText = `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    if (parcelamentoEl) {
        const parcela = total / 10;
        parcelamentoEl.innerHTML = `10x sem juros<br>de R$ ${parcela.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
}

function finalizarCompra(event) {
    if (event) event.preventDefault();
    let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    if (carrinho.length === 0) {
        alert('Seu carrinho está vazio!');
        return false;
    }
    localStorage.removeItem('carrinho');
    window.location.href = 'sucesso-pedido.html';
    return false;
}

document.addEventListener('DOMContentLoaded', () => {
    aplicarTemaSalvo();
    atualizarCabecalhoUsuario();
    atualizarCabecalhoCarrinho();

    if (document.getElementById('itens-carrinho')) {
        carregarCarrinho();
    }

    if (document.getElementById('lista-produtos')) {
        const urlParams = new URLSearchParams(window.location.search);
        const termoUrl = urlParams.get('search') || urlParams.get('busca') || '';
        const categoriaUrl = urlParams.get('category') || urlParams.get('categoria') || '';

        const campoBusca = document.getElementById('campoBusca');
        const filtroCategoria = document.getElementById('filtroCategoria');

        if (campoBusca && termoUrl) campoBusca.value = termoUrl;
        if (filtroCategoria && categoriaUrl) filtroCategoria.value = categoriaUrl;

        carregarProdutos(termoUrl, categoriaUrl);
    }

    if (document.getElementById('perfilNome')) {
        const usuarioLogado = JSON.parse(localStorage.getItem('usuarioLogado'));
        if (usuarioLogado) {
            document.getElementById('perfilNome').value = usuarioLogado.nome || '';
            document.getElementById('perfilEmail').value = usuarioLogado.email || '';
            if (document.getElementById('perfilTelefone')) {
                document.getElementById('perfilTelefone').value = usuarioLogado.telefone || '';
            }
        }
    }
});
