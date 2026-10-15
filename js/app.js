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

    if (usuarioLogado && usuarioLogado.nome) {
        const primeiroNome = usuarioLogado.nome.split(' ')[0];
        dropdownToggle.innerHTML = `Olá, ${primeiroNome}`;
        
        dropdownMenu.innerHTML = `
            <li><a class="dropdown-item" href="meus_dados.html">Meus Dados</a></li>
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

function cadastrarUsuario(event) {
    if (event) event.preventDefault();

    const nome = document.getElementById('nomeCadastro').value.trim();
    const email = document.getElementById('emailCadastro').value.trim();
    const telefone = document.getElementById('telefoneCadastro') ? document.getElementById('telefoneCadastro').value.trim() : '';
    const senha = document.getElementById('senhaCadastro').value;
    const confirmaSenha = document.getElementById('confirmaSenha').value;

    if (!nome || !email || !senha || !confirmaSenha) {
        alert('Por favor, preencha todos os campos obrigatórios!');
        return false;
    }

    if (senha !== confirmaSenha) {
        alert('Erro: A confirmação de senha não coincide com a senha digitada!');
        return false;
    }

    if (senha.length < 4) {
        alert('A senha deve ter pelo menos 4 caracteres!');
        return false;
    }

    let usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];

    const jaExiste = usuarios.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (jaExiste) {
        alert('Atenção: Já existe um usuário cadastrado com este e-mail!');
        return false;
    }

    const novoUsuario = { nome, email, telefone, senha };
    usuarios.push(novoUsuario);
    localStorage.setItem('usuarios', JSON.stringify(usuarios));

    alert('Cadastro realizado com sucesso! Faça login para continuar.');
    window.location.href = 'login.html';
    return false;
}

function realizarLogin(event) {
    if (event) event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;

    if (!email || !senha) {
        alert('Preencha o e-mail e a senha!');
        return false;
    }

    let usuarios = JSON.parse(localStorage.getItem('usuarios')) || [];

    const usuarioValido = usuarios.find(u => u.email.toLowerCase() === email.toLowerCase() && u.senha === senha);

    if (usuarioValido) {
        localStorage.setItem('usuarioLogado', JSON.stringify({
            nome: usuarioValido.nome,
            email: usuarioValido.email,
            telefone: usuarioValido.telefone
        }));
        alert(`Bem-vindo(a), ${usuarioValido.nome}!`);
        window.location.href = 'index.html';
    } else {
        alert('E-mail ou senha incorretos! Verifique os dados ou cadastre-se.');
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
    if (valorTotalEl) valorTotalEl.innerText = `R$ ${totalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (parcelamentoEl) {
        const parcela = totalGeral / 10;
        parcelamentoEl.innerHTML = `10x sem juros<br>de R$ ${parcela.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    if (btnFinalizar) btnFinalizar.disabled = false;
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
    if (localStorage.getItem('usuarios') === null) {
        const usuariosIniciais = [
            {
                nome: 'Júlia Silva',
                email: 'julia@email.com',
                telefone: '(61) 98888-7777',
                senha: '123'
            }
        ];
        localStorage.setItem('usuarios', JSON.stringify(usuariosIniciais));
    }

    aplicarTemaSalvo();
    atualizarCabecalhoUsuario();
    atualizarCabecalhoCarrinho();

    if (document.getElementById('itens-carrinho')) {
        carregarCarrinho();
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
