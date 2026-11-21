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

    const favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];

    let html = '';
    for (let i = 0; i < produtos.length; i++) {
        const prod = produtos[i];
        const precoFormatado = Number(prod.price).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const esgotado = prod.stock === 0;
        const ehFavorito = favoritos.some(id => String(id) === String(prod.id));

        html += `
            <div class="col-12 col-md-6 col-lg-3 d-flex">
                <div class="card w-100 border-0 shadow-sm rounded-4 p-2 ${esgotado ? 'opacity-75' : ''}">
                    <input type="hidden" name="produto_id" value="${prod.id}">
                    <div class="position-relative">
                        <button type="button" class="btn btn-sm position-absolute top-0 start-0 m-2 rounded-circle p-1 bg-white shadow-sm border-0 d-flex align-items-center justify-content-center" 
                            style="width: 34px; height: 34px; z-index: 2;" 
                            onclick="alternarFavorito('${prod.id}')" title="${ehFavorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}">
                            <span id="fav-icon-${prod.id}" style="font-size: 1.1rem; line-height: 1;">${ehFavorito ? '❤️' : '🤍'}</span>
                        </button>
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

function alternarFavorito(idProduto) {
    let favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
    const idStr = String(idProduto);
    const index = favoritos.findIndex(id => String(id) === idStr);

    const iconeEl = document.getElementById(`fav-icon-${idProduto}`);

    if (index > -1) {
        favoritos.splice(index, 1);
        if (iconeEl) iconeEl.innerText = '🤍';
    } else {
        favoritos.push(idStr);
        if (iconeEl) iconeEl.innerText = '❤️';
    }

    localStorage.setItem('favoritos', JSON.stringify(favoritos));
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
let cupomAplicado = null;
let valorDesconto = 0;
let enderecoEntregaSelecionado = null;

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

function carregarEnderecosNoCarrinho() {
    const select = document.getElementById('selectEnderecoEntrega');
    if (!select) return;
    const enderecos = JSON.parse(localStorage.getItem('enderecos')) || [];
    if (enderecos.length === 0) {
        select.innerHTML = '<option value="">Nenhum endereço salvo (digite o CEP abaixo)</option>';
        return;
    }
    let html = '<option value="">Selecione um endereço salvo...</option>';
    for (let end of enderecos) {
        html += `<option value="${end.id}">${end.nome} - ${end.rua}, ${end.numero} (${end.cidade}/${end.estado})</option>`;
    }
    html += '<option value="manual">Digitar outro CEP manualmente...</option>';
    select.innerHTML = html;
}

function selecionarEnderecoSalvo(id) {
    const campoCep = document.getElementById('campoCep');
    if (!id || id === 'manual') {
        enderecoEntregaSelecionado = null;
        return;
    }
    const enderecos = JSON.parse(localStorage.getItem('enderecos')) || [];
    const end = enderecos.find(e => String(e.id) === String(id));
    if (end) {
        enderecoEntregaSelecionado = end;
        if (campoCep) {
            campoCep.value = end.cep;
            calcularFrete();
        }
    }
}

async function aplicarCupom() {
    const campoCupom = document.getElementById('campoCupom');
    const resultadoCupom = document.getElementById('resultado-cupom');

    if (!campoCupom) return;

    const codigo = campoCupom.value.trim().toUpperCase();

    if (!codigo) {
        alert('Digite um código de cupom!');
        return;
    }

    const carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    let subtotal = 0;
    for (let i = 0; i < carrinho.length; i++) {
        subtotal += carrinho[i].preco * carrinho[i].quantidade;
    }

    const resposta = await apiPost('/api/cupom', { codigo: codigo, subtotal: subtotal });

    if (resposta.status === 200 && resposta.dados && resposta.dados.cupom) {
        const cupom = resposta.dados.cupom;
        cupomAplicado = cupom;

        if (resultadoCupom) {
            resultadoCupom.innerHTML = `<span class="text-success small fw-bold">✓ ${resposta.dados.mensagem}</span>`;
        }

        campoCupom.disabled = true;
        atualizarTotalComFrete();
    } else if (resposta.status === 400) {
        alert(resposta.mensagem || 'O código do cupom é obrigatório.');
        if (resultadoCupom) resultadoCupom.innerHTML = '';
    } else if (resposta.status === 404) {
        alert('Cupom inválido ou não encontrado.');
        if (resultadoCupom) resultadoCupom.innerHTML = '';
    } else if (resposta.status === 410) {
        alert('Este cupom já expirou.');
        if (resultadoCupom) resultadoCupom.innerHTML = '';
    } else if (resposta.status === 422) {
        alert(resposta.mensagem || 'Subtotal insuficiente para este cupom.');
        if (resultadoCupom) resultadoCupom.innerHTML = '';
    } else {
        alert(resposta.mensagem || 'Erro ao aplicar cupom.');
        if (resultadoCupom) resultadoCupom.innerHTML = '';
    }
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
    const linhaDesconto = document.getElementById('linha-desconto');
    const resumoDesconto = document.getElementById('resumo-desconto');
    const parcelamentoEl = document.getElementById('resumo-parcelamento');

    let valorFrete = 0;
    valorDesconto = 0;

    if (freteSelecionado && linhaFrete && resumoFrete) {
        valorFrete = freteSelecionado.valor;

        if (cupomAplicado && cupomAplicado.tipo === 'frete_gratis') {
            valorFrete = 0;
            resumoFrete.innerHTML = `<s class="text-muted">R$ ${freteSelecionado.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</s> <span class="text-success">Grátis</span>`;
        } else {
            resumoFrete.innerText = `R$ ${valorFrete.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }

        linhaFrete.classList.remove('d-none');
    }

    if (cupomAplicado && linhaDesconto && resumoDesconto) {
        if (cupomAplicado.tipo === 'percentual') {
            valorDesconto = subtotal * (cupomAplicado.desconto / 100);
        } else if (cupomAplicado.tipo === 'fixo') {
            valorDesconto = cupomAplicado.desconto;
        }

        if (cupomAplicado.tipo !== 'frete_gratis') {
            resumoDesconto.innerText = `- R$ ${valorDesconto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            linhaDesconto.classList.remove('d-none');
        }
    }

    let total = subtotal + valorFrete - valorDesconto;
    if (total < 0) total = 0;

    if (valorTotalEl) {
        valorTotalEl.innerText = `R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    if (parcelamentoEl) {
        const parcela = total / 10;
        parcelamentoEl.innerHTML = `10x sem juros<br>de R$ ${parcela.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
}

// ==== Gestão de Endereços ====
function gerarIdEndereco() {
    return Date.now().toString();
}

function carregarEnderecos() {
    const container = document.getElementById('lista-enderecos');
    if (!container) return;
    const enderecos = JSON.parse(localStorage.getItem('enderecos')) || [];
    if (enderecos.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">Nenhum endereço cadastrado.</p>';
        return;
    }
    let html = '';
    enderecos.forEach(end => {
        html += `
            <div class="card border-0 shadow-sm rounded-4 p-4 bg-white mb-4">
                <div class="d-flex justify-content-between align-items-start mb-2">
                    <span class="badge bg-${end.principal ? 'dark' : 'secondary'} mb-2">${end.principal ? 'Principal' : 'Secundário'}</span>
                    <div>
                        <button class="btn btn-sm btn-outline-secondary me-2" onclick="abrirModalEndereco('${end.id}')">Editar</button>
                        <button class="btn btn-sm btn-outline-danger" onclick="excluirEndereco('${end.id}')">Excluir</button>
                    </div>
                </div>
                <h5 class="fw-bold mb-1">${end.nome}</h5>
                <p class="text-muted mb-0">
                    ${end.rua}, ${end.numero}<br>
                    ${end.cidade} - ${end.estado}, CEP: ${end.cep}
                </p>
            </div>`;
    });
    container.innerHTML = html;
}

function abrirModalEndereco(id = null) {
    const modal = new bootstrap.Modal(document.getElementById('modalEndereco'));
    const form = document.getElementById('formEndereco');
    const statusEl = document.getElementById('status-viacep');
    if (statusEl) statusEl.innerText = '';

    if (id) {
        const end = JSON.parse(localStorage.getItem('enderecos')).find(e => e.id === id);
        if (end) {
            document.getElementById('endereco-id').value = end.id;
            document.getElementById('endereco-nome').value = end.nome;
            document.getElementById('endereco-rua').value = end.rua;
            document.getElementById('endereco-numero').value = end.numero;
            document.getElementById('endereco-cep').value = end.cep;
            document.getElementById('endereco-cidade').value = end.cidade;
            document.getElementById('endereco-estado').value = end.estado;
        }
        document.getElementById('modalEnderecoLabel').innerText = 'Editar Endereço';
    } else {
        form.reset();
        document.getElementById('endereco-id').value = '';
        document.getElementById('modalEnderecoLabel').innerText = 'Cadastrar Endereço';
    }
    modal.show();
}

function formatarMascaraCep(input) {
    let v = input.value.replace(/\D/g, '');
    if (v.length > 5) {
        v = v.substring(0, 5) + '-' + v.substring(5, 8);
    }
    input.value = v;
}

async function buscarCepViaCep() {
    const campoCep = document.getElementById('endereco-cep');
    if (!campoCep) return;
    const cepLimpo = campoCep.value.replace(/\D/g, '');

    if (cepLimpo.length !== 8) return;

    const campoRua = document.getElementById('endereco-rua');
    const campoCidade = document.getElementById('endereco-cidade');
    const campoEstado = document.getElementById('endereco-estado');
    const campoNumero = document.getElementById('endereco-numero');
    const statusEl = document.getElementById('status-viacep');

    if (statusEl) {
        statusEl.className = 'text-primary d-block mt-1';
        statusEl.innerText = 'Consultando ViaCEP...';
    }

    try {
        const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        const dados = await resposta.json();

        if (dados.erro) {
            if (statusEl) {
                statusEl.className = 'text-danger d-block mt-1';
                statusEl.innerText = 'CEP não encontrado no ViaCEP.';
            }
            alert('CEP não encontrado pelo serviço ViaCEP.');
            return;
        }

        if (campoRua && dados.logradouro) campoRua.value = dados.logradouro;
        if (campoCidade && dados.localidade) campoCidade.value = dados.localidade;
        if (campoEstado && dados.uf) campoEstado.value = dados.uf;

        if (statusEl) {
            statusEl.className = 'text-success d-block mt-1';
            statusEl.innerText = 'Endereço localizado com sucesso!';
        }

        if (campoNumero) campoNumero.focus();
    } catch (erro) {
        if (statusEl) {
            statusEl.className = 'text-danger d-block mt-1';
            statusEl.innerText = 'Erro ao consultar o ViaCEP.';
        }
    }
}

function salvarEndereco() {
    const idField = document.getElementById('endereco-id').value;
    const nome = document.getElementById('endereco-nome').value.trim();
    const rua = document.getElementById('endereco-rua').value.trim();
    const numero = document.getElementById('endereco-numero').value.trim();
    const cep = document.getElementById('endereco-cep').value.trim();
    const cidade = document.getElementById('endereco-cidade').value.trim();
    const estado = document.getElementById('endereco-estado').value.trim();
    if (!nome || !rua || !numero || !cep || !cidade || !estado) {
        alert('Preencha todos os campos do endereço.');
        return;
    }
    let enderecos = JSON.parse(localStorage.getItem('enderecos')) || [];
    if (idField) {
        // editar
        enderecos = enderecos.map(e => e.id === idField ? { ...e, nome, rua, numero, cep, cidade, estado } : e);
    } else {
        // novo
        enderecos.push({ id: gerarIdEndereco(), nome, rua, numero, cep, cidade, estado, principal: enderecos.length === 0 });
    }
    localStorage.setItem('enderecos', JSON.stringify(enderecos));
    const modal = bootstrap.Modal.getInstance(document.getElementById('modalEndereco'));
    if (modal) modal.hide();
    carregarEnderecos();
}

function excluirEndereco(id) {
    if (!confirm('Deseja excluir este endereço?')) return;
    let enderecos = JSON.parse(localStorage.getItem('enderecos')) || [];
    enderecos = enderecos.filter(e => e.id !== id);
    localStorage.setItem('enderecos', JSON.stringify(enderecos));
    carregarEnderecos();
}

function gerarIdPedido() {
    // Formato PED-AAAA-MMDD-HHMMSS
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    const id = `PED-${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}-${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`;
    return id;
}

function salvarPedidoLocal(pedido) {
    const pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];
    pedidos.push(pedido);
    localStorage.setItem('pedidos', JSON.stringify(pedidos));
}

function alterarMetodoPagamento() {
    const metodo = document.getElementById('metodoPagamento')?.value;
    const divCartao = document.getElementById('divNumeroCartao');
    if (!divCartao) return;
    if (metodo === 'Cartão' || metodo === 'cartao') {
        divCartao.classList.remove('d-none');
    } else {
        divCartao.classList.add('d-none');
    }
}

async function finalizarCompra(event) {
    if (event) event.preventDefault();
    let carrinho = JSON.parse(localStorage.getItem('carrinho')) || [];
    if (carrinho.length === 0) {
        alert('Seu carrinho está vazio!');
        return false;
    }

    const cep = document.getElementById('campoCep')?.value.trim() || '';
    if (!cep) {
        alert('Por favor, informe o CEP para entrega!');
        document.getElementById('campoCep')?.focus();
        return false;
    }

    const metodo = document.getElementById('metodoPagamento')?.value || 'Pix';
    const numeroCartao = (metodo === 'Cartão' || metodo === 'cartao') ? document.getElementById('numeroCartao')?.value.trim() : null;

    if ((metodo === 'Cartão' || metodo === 'cartao') && !numeroCartao) {
        alert('Por favor, digite o número do cartão.');
        document.getElementById('numeroCartao')?.focus();
        return false;
    }

    let subtotal = 0;
    for (let i = 0; i < carrinho.length; i++) {
        subtotal += carrinho[i].preco * carrinho[i].quantidade;
    }
    const total = subtotal + (freteSelecionado ? freteSelecionado.valor : 0) - (valorDesconto || 0);

    const payload = {
        itens: carrinho.map(i => ({ id: Number(i.id) || i.id, quantidade: i.quantidade })),
        cep: cep,
        metodoPagamento: metodo.toLowerCase() === 'cartão' ? 'cartao' : metodo.toLowerCase()
    };
    if (numeroCartao) {
        payload.numeroCartao = numeroCartao;
    }

    const resposta = await apiPost('/api/checkout', payload);

    if (resposta.status === 201 && resposta.dados && resposta.dados.pedido) {
        const pedApi = resposta.dados.pedido;
        const idFinal = pedApi.protocolo || gerarIdPedido();
        const pedido = {
            id: idFinal,
            protocolo: idFinal,
            data: new Date().toISOString(),
            total: total,
            status: pedApi.status || 'Aprovado',
            itens: carrinho,
            frete: freteSelecionado ? freteSelecionado.valor : 0,
            desconto: valorDesconto || 0,
            pagamento: metodo,
            cep: cep,
            endereco: enderecoEntregaSelecionado || { cep: cep }
        };
        salvarPedidoLocal(pedido);
        localStorage.removeItem('carrinho');
        window.location.href = 'sucesso-pedido.html';
        return false;
    } else if (resposta.status === 400) {
        alert(resposta.mensagem || 'Dados incompletos para finalizar o pedido.');
    } else if (resposta.status === 402) {
        alert(resposta.mensagem || 'Cartão recusado pela operadora.');
    } else if (resposta.status === 404) {
        alert(resposta.mensagem || 'Um dos produtos não está mais disponível.');
    } else if (resposta.status === 422) {
        alert(resposta.mensagem || 'Estoque insuficiente para algum item.');
    } else {
        alert(resposta.mensagem || 'Erro ao finalizar a compra.');
    }
    return false;
}


async function atualizarPerfil(event) {
    if (event) event.preventDefault();
    const nome = document.getElementById('perfilNome')?.value.trim();
    const email = document.getElementById('perfilEmail')?.value.trim();
    const telefone = document.getElementById('perfilTelefone')?.value.trim();

    if (!nome || !email) {
        alert('Nome e e‑mail são obrigatórios.');
        return false;
    }

    const payload = { nome, email };
    if (telefone) payload.telefone = telefone;

    const resposta = await apiPut('/api/user', payload);

    if (resposta.status === 200 && resposta.dados) {
        // Atualiza o usuário no localStorage
        const usuario = { nome, email, telefone };
        localStorage.setItem('usuarioLogado', JSON.stringify(usuario));
        alert('Dados atualizados com sucesso!');
    } else if (resposta.status === 400) {
        alert(resposta.mensagem || 'Campos obrigatórios ausentes ou formato inválido.');
    } else if (resposta.status === 409) {
        alert(resposta.mensagem || 'Este e‑mail já está em uso por outro usuário.');
    } else {
        alert(resposta.mensagem || 'Erro ao atualizar perfil.');
    }
    return false;
}

function carregarPedidos() {
    const container = document.getElementById('lista-pedidos');
    if (!container) return;
    const pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];
    if (pedidos.length === 0) {
        container.innerHTML = `<p class="text-center text-muted">Nenhum pedido encontrado.</p>`;
        return;
    }
    let html = '';
    for (let p of pedidos) {
        const badgeColor = p.status === 'Entregue' ? 'bg-success' : (p.status === 'Cancelado' ? 'bg-danger' : 'bg-warning text-dark');
        html += `
            <div class="card border-0 shadow-sm rounded-4 mb-4 p-4 bg-white">
                <div class="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-3">
                    <div>
                        <span class="badge ${badgeColor} mb-2">${p.status}</span>
                        <h5 class="fw-bold mb-0">Pedido #${p.id}</h5>
                        <small class="text-muted">Realizado em ${new Date(p.data).toLocaleDateString('pt-BR')}</small>
                    </div>
                    <div class="mt-2 mt-md-0 text-md-end">
                        <span class="fs-5 fw-bold text-dark d-block">Total: R$ ${p.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        <a href="pedido.html?id=${p.id}" class="btn btn-outline-dark btn-sm mt-1">Ver Detalhes</a>
                        ${p.status === 'Processando' ? `<button class="btn btn-outline-danger btn-sm mt-1 ms-1" onclick="cancelarPedido('${p.id}')">Cancelar</button>` : ''}
                    </div>
                </div>
            </div>
        `;
    }
    container.innerHTML = html;
}

async function cancelarPedido(pedidoId) {
    if (!confirm('Deseja realmente cancelar este pedido?')) return;
    const resposta = await apiDelete('/api/pedido', { protocolo: pedidoId });
    if (resposta.status === 200) {
        // atualizar localStorage
        let pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];
        pedidos = pedidos.map(p => p.id === pedidoId ? { ...p, status: 'Cancelado' } : p);
        localStorage.setItem('pedidos', JSON.stringify(pedidos));
        alert('Pedido cancelado com sucesso.');
        carregarPedidos();
    } else if (resposta.status === 400) {
        alert('Protocolo não informado.');
    } else if (resposta.status === 404) {
        alert('Pedido não encontrado.');
    } else if (resposta.status === 422) {
        alert('Pedido já enviado, não pode ser cancelado.');
    } else {
        alert(resposta.mensagem || 'Erro ao cancelar o pedido.');
    }
}

function carregarDetalhesPedido() {
    const container = document.getElementById('detalhes-pedido-conteudo');
    if (!container) return;

    const urlParams = new URLSearchParams(window.location.search);
    const idPedido = urlParams.get('id');

    const tituloEl = document.getElementById('pedido-detalhe-titulo');
    if (tituloEl && idPedido) {
        tituloEl.innerText = `Detalhes do Pedido #${idPedido}`;
    }

    const pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];
    const pedido = pedidos.find(p => String(p.id) === String(idPedido) || String(p.protocolo) === String(idPedido));

    if (!pedido) return;

    const itensContainer = document.getElementById('pedido-detalhe-itens');
    if (itensContainer && pedido.itens && pedido.itens.length > 0) {
        let htmlItens = '';
        for (let item of pedido.itens) {
            const precoFormatado = Number(item.preco || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
            htmlItens += `
                <div class="d-flex align-items-center justify-content-between py-2 border-bottom">
                    <div class="d-flex align-items-center gap-3">
                        <img src="${item.imagem || 'assets/img/nintendo switch lite.jpg'}" alt="${item.nome}" style="width: 60px; height: 60px; object-fit: contain;">
                        <div>
                            <h6 class="mb-0 fw-bold">${item.nome}</h6>
                            <small class="text-muted">Quantidade: ${item.quantidade}</small>
                        </div>
                    </div>
                    <span class="fw-bold">${precoFormatado}</span>
                </div>
            `;
        }
        itensContainer.innerHTML = htmlItens;
    }

    const statusBadge = document.getElementById('pedido-detalhe-status');
    if (statusBadge) {
        statusBadge.innerText = pedido.status || 'Processando';
        if (pedido.status === 'Cancelado') {
            statusBadge.className = 'badge bg-danger p-2 fs-6';
        } else if (pedido.status === 'Entregue' || pedido.status === 'Aprovado') {
            statusBadge.className = 'badge bg-success p-2 fs-6';
        } else {
            statusBadge.className = 'badge bg-warning text-dark p-2 fs-6';
        }
    }

    const totalEl = document.getElementById('pedido-detalhe-total');
    if (totalEl) {
        totalEl.innerText = Number(pedido.total || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    }

    const pagamentoEl = document.getElementById('pedido-detalhe-pagamento');
    if (pagamentoEl && pedido.pagamento) {
        pagamentoEl.innerText = `Forma de Pagamento: ${pedido.pagamento}`;
    }

    const endEl = document.getElementById('pedido-detalhe-endereco') || document.getElementById('pedido-detalhe-cep');
    if (endEl) {
        if (pedido.endereco && pedido.endereco.rua) {
            endEl.innerHTML = `<strong>${pedido.endereco.nome || 'Endereço'}</strong><br>${pedido.endereco.rua}, ${pedido.endereco.numero}<br>${pedido.endereco.cidade} - ${pedido.endereco.estado}, CEP: ${pedido.endereco.cep}`;
        } else if (pedido.cep) {
            endEl.innerText = `Entrega para o CEP: ${pedido.cep}`;
        }
    }
}

// Detecta página para carregar pedidos
if (document.getElementById('lista-pedidos')) {
    carregarPedidos();
}

document.addEventListener('DOMContentLoaded', () => {
    aplicarTemaSalvo();
    atualizarCabecalhoUsuario();
    atualizarCabecalhoCarrinho();

    if (document.getElementById('itens-carrinho')) {
        carregarCarrinho();
        carregarEnderecosNoCarrinho();
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

    if (document.getElementById('lista-enderecos')) {
        carregarEnderecos();
    }

    if (document.getElementById('detalhes-pedido-conteudo')) {
        carregarDetalhesPedido();
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

    const numPedidoEl = document.getElementById('numeroPedidoSucesso');
    if (numPedidoEl) {
        const pedidos = JSON.parse(localStorage.getItem('pedidos')) || [];
        if (pedidos.length > 0) {
            const ultimo = pedidos[pedidos.length - 1];
            numPedidoEl.innerText = '#' + (ultimo.protocolo || ultimo.id);
        }
    }
});
