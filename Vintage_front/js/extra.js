// ============================================================
// OMNISTORE - TELAS EXTRAS
// ============================================================

Object.assign(titles, {

    pendencias: [
        "Pendências",
        "Liquidação de pagamentos em aberto"
    ],

    contas: [
        "Contas",
        "Saldo financeiro de lojas e clientes"
    ],

    extrato: [
        "Extrato",
        "Histórico de compras do cliente"
    ],

    relatorios: [
        "Relatórios",
        "Indicadores de vendas e financeiro"
    ],

    usuarios: [
        "Usuários",
        "Controle de acesso por perfil"
    ]

});


// ============================================================
// UTILITÁRIOS
// ============================================================

function fillRows(id, list, render, columns) {

    const element = document.getElementById(id);

    if (!element) {
        return;
    }

    if (!Array.isArray(list) || list.length === 0) {

        element.innerHTML = `
            <tr>
                <td colspan="${columns}" class="empty">
                    Nenhum registro.
                </td>
            </tr>
        `;

        return;
    }

    element.innerHTML = list.map(render).join("");
}


function statusBadge(status) {

    const classe =
        status === "CONCLUIDO"
            ? "green"
            : "yellow";

    return `
        <span class="badge ${classe}">
            ${escapeHtml(status || "ABERTA")}
        </span>
    `;
}


function exigirPermissao(secao) {

    if (
        typeof podeAcessar === "function" &&
        !podeAcessar(secao)
    ) {

        if (typeof toast === "function") {
            toast(
                "Você não possui permissão para acessar esta área.",
                true
            );
        }

        return false;
    }

    return true;
}


// ============================================================
// PENDÊNCIAS
// ============================================================

async function loadPendencias() {

    if (!exigirPermissao("pendencias")) {
        return;
    }

    try {

        const list =
            await api("vendas/abertas");

        fillRows(
            "pending-table",
            list,
            venda => `
                <tr>

                    <td>
                        #${venda.id}
                    </td>

                    <td>
                        ${escapeHtml(venda.cliente || "-")}
                    </td>

                    <td>
                        ${money(venda.total)}
                    </td>

                    <td>
                        ${money(venda.pago)}
                    </td>

                    <td>
                        <strong>
                            ${money(venda.restante)}
                        </strong>
                    </td>

                    <td>

                        <button
                            class="btn success"
                            onclick="openPay(
                                ${venda.id},
                                ${Number(venda.restante)}
                            )">

                            Receber

                        </button>

                    </td>

                </tr>
            `,
            6
        );

    } catch (error) {

        toast(
            "Erro ao carregar pendências: " +
            error.message,
            true
        );

    }
}


// ============================================================
// CONTAS
// ============================================================

async function loadContas() {

    if (!exigirPermissao("contas")) {
        return;
    }

    try {

        const contas =
            await api("contas");

        fillRows(
            "accounts-table",
            contas,
            conta => `
                <tr>

                    <td>
                        ${escapeHtml(conta.tipo || "-")}
                    </td>

                    <td>
                        ${escapeHtml(conta.nome || "-")}
                    </td>

                    <td>
                        ${escapeHtml(conta.numero || "-")}
                    </td>

                    <td>
                        <strong>
                            ${money(conta.saldo)}
                        </strong>
                    </td>

                </tr>
            `,
            4
        );

    } catch (error) {

        toast(
            "Erro ao carregar contas: " +
            error.message,
            true
        );

    }
}


// ============================================================
// EXTRATO
// ============================================================

async function loadExtrato() {

    if (!exigirPermissao("extrato")) {
        return;
    }

    const perfil =
        AUTH.user?.perfil;

    let id = null;

    if (perfil === "CLIENTE") {

        id = "me";

    } else {

        const select =
            document.getElementById(
                "extrato-client"
            );

        id = select?.value || null;

    }

    if (!id) {

        const conta =
            document.getElementById(
                "extrato-conta"
            );

        if (conta) {
            conta.textContent =
                "Selecione um cliente";
        }

        fillRows(
            "extrato-table",
            [],
            () => "",
            6
        );

        return;
    }

    try {

        const resultado =
            await api(
                `clientes/${id}/extrato`
            );

        const conta =
            document.getElementById(
                "extrato-conta"
            );

        if (conta) {

            if (resultado.conta) {

                conta.textContent =
                    `Conta ${resultado.conta.numero} • Saldo ${money(resultado.conta.saldo)}`;

            } else {

                conta.textContent =
                    "Conta não encontrada";

            }

        }

        fillRows(
            "extrato-table",
            resultado.vendas || [],
            venda => `
                <tr>

                    <td>
                        #${venda.id}
                    </td>

                    <td>
                        ${new Date(
                            venda.data
                        ).toLocaleString("pt-BR")}
                    </td>

                    <td>
                        ${escapeHtml(
                            venda.loja || "-"
                        )}
                    </td>

                    <td>
                        ${money(venda.total)}
                    </td>

                    <td>
                        ${money(venda.pago)}
                    </td>

                    <td>
                        ${statusBadge(
                            venda.status
                        )}
                    </td>

                </tr>
            `,
            6
        );

    } catch (error) {

        toast(
            "Erro ao carregar extrato: " +
            error.message,
            true
        );

    }
}


// ============================================================
// RELATÓRIOS
// ============================================================

async function loadRelatorios() {

    if (!exigirPermissao("relatorios")) {
        return;
    }

    try {

        const resultado =
            await api("relatorios");

        const count =
            document.getElementById(
                "rep-count"
            );

        const revenue =
            document.getElementById(
                "rep-revenue"
            );

        const received =
            document.getElementById(
                "rep-received"
            );

        const ticket =
            document.getElementById(
                "rep-ticket"
            );

        if (count) {
            count.textContent =
                resultado.vendas || 0;
        }

        if (revenue) {
            revenue.textContent =
                money(resultado.faturamento || 0);
        }

        if (received) {
            received.textContent =
                money(resultado.recebido || 0);
        }

        if (ticket) {
            ticket.textContent =
                money(resultado.ticket || 0);
        }

        fillRows(
            "rep-products",
            resultado.topProdutos || [],
            produto => `
                <tr>

                    <td>
                        ${escapeHtml(
                            produto.nome || "-"
                        )}
                    </td>

                    <td>
                        ${produto.qtd || 0}
                    </td>

                    <td>
                        ${money(
                            produto.total || 0
                        )}
                    </td>

                </tr>
            `,
            3
        );

        fillRows(
            "rep-stores",
            resultado.porLoja || [],
            loja => `
                <tr>

                    <td>
                        ${escapeHtml(
                            loja.nome || "-"
                        )}
                    </td>

                    <td>
                        ${loja.vendas || 0}
                    </td>

                    <td>
                        ${money(
                            loja.total || 0
                        )}
                    </td>

                </tr>
            `,
            3
        );

        fillRows(
            "rep-methods",
            resultado.porForma || [],
            forma => `
                <tr>

                    <td>
                        ${escapeHtml(
                            forma.forma || "-"
                        )}
                    </td>

                    <td>
                        ${money(
                            forma.total || 0
                        )}
                    </td>

                </tr>
            `,
            2
        );

    } catch (error) {

        toast(
            "Erro ao carregar relatórios: " +
            error.message,
            true
        );

    }
}


// ============================================================
// PAGAMENTOS
// ============================================================

function openPay(id, restante) {

    if (!exigirPermissao("pagamentos")) {
        return;
    }

    const sale =
        document.getElementById(
            "pay-sale"
        );

    const value =
        document.getElementById(
            "pay-value"
        );

    const title =
        document.getElementById(
            "pay-title"
        );

    if (sale) {
        sale.value = id;
    }

    if (value) {

        value.value =
            Number(restante).toFixed(2);

        value.max =
            Number(restante).toFixed(2);

        value.min = "0.01";

    }

    if (title) {

        title.textContent =
            `Receber pagamento - Venda #${id}`;

    }

    openModal("pay-modal");
}


async function savePay(event) {

    event.preventDefault();

    if (!exigirPermissao("pagamentos")) {
        return;
    }

    const venda =
        Number(
            val("pay-sale")
        );

    const forma =
        val("pay-method");

    const valor =
        Number(
            val("pay-value")
        );

    if (!venda || !forma || valor <= 0) {

        toast(
            "Informe uma venda, forma e valor válidos.",
            true
        );

        return;
    }

    try {

        await api(
            "pagamentos",
            "POST",
            {
                venda,
                forma,
                valor
            }
        );

        event.target.reset();

        closeModal("pay-modal");

        await loadPendencias();

        if (typeof loadAll === "function") {
            await loadAll();
        }

        toast(
            "Pagamento registrado com sucesso!"
        );

    } catch (error) {

        toast(
            error.message,
            true
        );

    }
}


// ============================================================
// ESTOQUE
// ============================================================

async function saveStock(event) {

    event.preventDefault();

    if (!exigirPermissao("estoque")) {
        return;
    }

    const produto =
        Number(
            val("stock-product")
        );

    const fornecedor =
        Number(
            val("stock-supplier")
        );

    const quantidade =
        Number(
            val("stock-qty")
        );

    if (
        !produto ||
        !fornecedor ||
        quantidade <= 0
    ) {

        toast(
            "Preencha todos os campos corretamente.",
            true
        );

        return;
    }

    try {

        await api(
            "estoque",
            "POST",
            {
                produto,
                fornecedor,
                quantidade
            }
        );

        event.target.reset();

        closeModal("stock-modal");

        await loadAll();

        toast(
            "Entrada de estoque registrada!"
        );

    } catch (error) {

        toast(
            error.message,
            true
        );

    }
}


// ============================================================
// USUÁRIOS
// ============================================================

async function loadUsuarios() {

    if (!exigirPermissao("usuarios")) {
        return;
    }

    try {

        const usuarios =
            await api("usuarios");

        fillRows(
            "users-table",
            usuarios,
            usuario => `
                <tr>

                    <td>
                        ${escapeHtml(
                            usuario.login || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            usuario.perfil || "-"
                        )}
                    </td>

                    <td>
                        ${escapeHtml(
                            usuario.cliente || "-"
                        )}
                    </td>

                    <td>

                        <span class="badge ${
                            usuario.ativo
                                ? "green"
                                : "red"
                        }">

                            ${
                                usuario.ativo
                                    ? "Ativo"
                                    : "Inativo"
                            }

                        </span>

                    </td>

                    <td>

                        <button
                            class="btn secondary"
                            onclick="toggleUser(
                                ${usuario.id},
                                ${usuario.ativo ? 0 : 1}
                            )">

                            ${
                                usuario.ativo
                                    ? "Desativar"
                                    : "Ativar"
                            }

                        </button>

                    </td>

                </tr>
            `,
            5
        );

    } catch (error) {

        toast(
            "Erro ao carregar usuários: " +
            error.message,
            true
        );

    }
}


async function toggleUser(id, ativo) {

    if (!exigirPermissao("usuarios")) {
        return;
    }

    try {

        await api(
            `usuarios/${id}/ativo`,
            "PUT",
            {
                ativo: Number(ativo)
            }
        );

        await loadUsuarios();

        toast(
            ativo
                ? "Usuário ativado."
                : "Usuário desativado."
        );

    } catch (error) {

        toast(
            error.message,
            true
        );

    }
}


function toggleUserClient() {

    if (!exigirPermissao("usuarios")) {
        return;
    }

    const perfil =
        val("user-profile");

    const wrapper =
        document.getElementById(
            "user-client-wrap"
        );

    if (!wrapper) {
        return;
    }

    const isClient =
        perfil === "CLIENTE";

    wrapper.style.display =
        isClient
            ? "flex"
            : "none";

    if (isClient) {

        populateSelect(
            "user-client",
            clients,
            "Selecione o cliente",
            cliente => cliente.nome
        );

    } else {

        const select =
            document.getElementById(
                "user-client"
            );

        if (select) {
            select.value = "";
        }

    }
}


async function saveUser(event) {

    event.preventDefault();

    if (!exigirPermissao("usuarios")) {
        return;
    }

    const login =
        val("user-login");

    const senha =
        val("user-pass");

    const perfil =
        val("user-profile");

    const id_cliente =
        Number(
            val("user-client")
        ) || null;

    const perfisPermitidos = [
        "ADMIN",
        "OPERADOR",
        "CLIENTE"
    ];

    if (
        !login ||
        !senha ||
        !perfil
    ) {

        toast(
            "Preencha todos os campos obrigatórios.",
            true
        );

        return;
    }

    if (!perfisPermitidos.includes(perfil)) {

        toast(
            "Perfil de usuário inválido.",
            true
        );

        return;
    }

    if (senha.length < 6) {

        toast(
            "A senha deve ter pelo menos 6 caracteres.",
            true
        );

        return;
    }

    if (
        perfil === "CLIENTE" &&
        !id_cliente
    ) {

        toast(
            "Selecione o cliente que será vinculado.",
            true
        );

        return;
    }

    try {

        await api(
            "usuarios",
            "POST",
            {
                login,
                senha,
                perfil,
                id_cliente:
                    perfil === "CLIENTE"
                        ? id_cliente
                        : null
            }
        );

        event.target.reset();

        const wrapper =
            document.getElementById(
                "user-client-wrap"
            );

        if (wrapper) {
            wrapper.style.display = "none";
        }

        closeModal("user-modal");

        await loadUsuarios();

        toast(
            "Usuário criado com sucesso!"
        );

    } catch (error) {

        toast(
            error.message,
            true
        );

    }
}


// ============================================================
// CARREGADORES
// ============================================================

const extraLoaders = {

    pendencias: loadPendencias,

    contas: loadContas,

    extrato: loadExtrato,

    relatorios: loadRelatorios,

    usuarios: loadUsuarios

};


// ============================================================
// ABRIR SEÇÕES EXTRAS
// ============================================================

const originalShowSection = showSection;

showSection = function(section) {

    if (!exigirPermissao(section)) {
        return;
    }

    originalShowSection(section);

    if (
        section === "extrato" &&
        AUTH.user?.perfil !== "CLIENTE"
    ) {

        populateSelect(
            "extrato-client",
            clients,
            "Selecione o cliente",
            cliente => cliente.nome
        );

    }

    const loader =
        extraLoaders[section];

    if (loader) {
        loader();
    }

};


// ============================================================
// MODAL DE ESTOQUE
// ============================================================

const originalOpenModal = openModal;

openModal = function(id) {

    if (
        id === "stock-modal" &&
        !exigirPermissao("estoque")
    ) {
        return;
    }

    if (
        id === "pay-modal" &&
        !exigirPermissao("pagamentos")
    ) {
        return;
    }

    if (
        id === "user-modal" &&
        !exigirPermissao("usuarios")
    ) {
        return;
    }

    originalOpenModal(id);

    if (id !== "stock-modal") {
        return;
    }

    populateSelect(
        "stock-product",
        products,
        "Selecione o produto",
        produto => produto.nome
    );

    populateSelect(
        "stock-supplier",
        suppliers,
        "Selecione um fornecedor",
        fornecedor =>
            fornecedor.razao_social
    );

};


// ============================================================
// CARREGAMENTO DE USUÁRIOS
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        if (
            AUTH.user?.perfil === "ADMIN"
        ) {

            loadUsuarios();

        }

    }
);


// ============================================================
// CLIENTE
// ============================================================

if (
    AUTH.user?.perfil === "CLIENTE"
) {

    const originalLoadAll =
        loadAll;

    loadAll = async function() {

        try {

            products =
                await api("produtos");

            renderProducts();

            updateDashboard();

        } catch (error) {

            toast(
                "Falha ao carregar produtos: " +
                error.message,
                true
            );

        }

    };

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            setTimeout(() => {

                showSection("produtos");

            }, 0);

        }
    );

}