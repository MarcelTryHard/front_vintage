// ============================================================
// OMNISTORE - FRONTEND
// ============================================================

let clients = [];
let stores = [];
let categories = [];
let suppliers = [];
let products = [];
let sales = [];
let payments = [];
let saleItems = [];


// ============================================================
// API
// ============================================================

async function api(path, method = "GET", body) {

    const options = {
        method,
        headers: {
            "Content-Type": "application/json"
        }
    };

    if (body !== undefined) {
        options.body = JSON.stringify(body);
    }

    const res = await fetch("/api/" + path, options);

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new Error(
            data.erro || "Erro na requisição"
        );
    }

    return data;
}


// ============================================================
// TOAST
// ============================================================

function toast(msg, error = false) {

    const t = document.createElement("div");

    t.className =
        "toast" + (error ? " error" : "");

    t.textContent = msg;

    document.body.appendChild(t);

    setTimeout(() => {
        t.remove();
    }, 3500);
}


// ============================================================
// PERMISSÕES
// ============================================================

function perfilAtual() {
    return AUTH?.user?.perfil || "";
}


function temPermissao(secao) {

    const perfil = perfilAtual();

    const permissoes = {

        ADMIN: [
            "dashboard",
            "vendas",
            "produtos",
            "estoque",
            "clientes",
            "fornecedores",
            "categorias",
            "lojas",
            "pagamentos",
            "pendencias",
            "contas",
            "extrato",
            "relatorios",
            "usuarios"
        ],

        OPERADOR: [
            "dashboard",
            "vendas",
            "produtos",
            "estoque",
            "clientes",
            "pagamentos",
            "pendencias",
            "extrato"
        ],

        CLIENTE: [
            "dashboard",
            "produtos",
            "extrato"
        ]
    };

    return (
        permissoes[perfil]?.includes(secao) ||
        false
    );
}


function exigirPermissao(secao) {

    if (!temPermissao(secao)) {

        toast(
            "Você não possui permissão para esta função.",
            true
        );

        return false;
    }

    return true;
}


function exigirAdmin() {

    if (perfilAtual() !== "ADMIN") {

        toast(
            "Apenas o administrador pode realizar esta função.",
            true
        );

        return false;
    }

    return true;
}


function exigirOperacao(secao) {

    if (perfilAtual() === "CLIENTE") {

        toast(
            "O perfil Cliente possui somente acesso para visualização.",
            true
        );

        return false;
    }

    return exigirPermissao(secao);
}


// ============================================================
// CARREGAR DADOS
// ============================================================

async function loadAll() {

    const perfil = perfilAtual();

    clients = [];
    stores = [];
    categories = [];
    suppliers = [];
    products = [];
    sales = [];
    payments = [];

    try {

        if (perfil === "ADMIN") {

            [
                clients,
                stores,
                categories,
                suppliers,
                products,
                sales,
                payments
            ] = await Promise.all([

                api("clientes"),
                api("lojas"),
                api("categorias"),
                api("fornecedores"),
                api("produtos"),
                api("vendas"),
                api("pagamentos")

            ]);

        } else if (perfil === "OPERADOR") {

            [
                clients,
                stores,
                products,
                sales,
                payments
            ] = await Promise.all([

                api("clientes"),
                api("lojas"),
                api("produtos"),
                api("vendas"),
                api("pagamentos")

            ]);

            try {
                suppliers =
                    await api("fornecedores");
            } catch {
                suppliers = [];
            }

        } else if (perfil === "CLIENTE") {

            products =
                await api("produtos");

        }

        renderAll();

    } catch (e) {

        toast(
            "Falha ao carregar dados: " +
            e.message,
            true
        );
    }
}


// ============================================================
// TÍTULOS
// ============================================================

const titles = {

    dashboard: [
        "Dashboard",
        "Visão geral da operação comercial"
    ],

    vendas: [
        "Vendas",
        "PDV e histórico de vendas"
    ],

    produtos: [
        "Produtos",
        "Catálogo de produtos"
    ],

    estoque: [
        "Estoque",
        "Controle de quantidade dos produtos"
    ],

    clientes: [
        "Clientes",
        "Cadastro de clientes"
    ],

    fornecedores: [
        "Fornecedores",
        "Cadastro de fornecedores"
    ],

    categorias: [
        "Categorias",
        "Classificação do catálogo"
    ],

    lojas: [
        "Lojas",
        "Gestão de lojas físicas e online"
    ],

    pagamentos: [
        "Pagamentos",
        "Controle e liquidação de pagamentos"
    ],

    pendencias: [
        "Pendências",
        "Vendas aguardando pagamento"
    ],

    contas: [
        "Contas",
        "Contas financeiras"
    ],

    extrato: [
        "Extrato",
        "Histórico financeiro do cliente"
    ],

    relatorios: [
        "Relatórios",
        "Resumo da operação comercial"
    ],

    usuarios: [
        "Usuários",
        "Controle de acesso"
    ],

    "minhas-compras": [
        "Minhas compras",
        "Histórico dos seus pedidos"
    ]
};


// ============================================================
// INICIALIZAÇÃO
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        document
            .querySelectorAll(".nav-item")
            .forEach(button => {

                button.addEventListener(
                    "click",
                    () => {

                        const section =
                            button.dataset.section;

                        showSection(section);
                    }
                );

            });

        esconderElementosDoCliente();

        loadAll();

    }
);


// ============================================================
// OCULTAR AÇÕES DO CLIENTE
// ============================================================

function esconderElementosDoCliente() {

    if (perfilAtual() !== "CLIENTE") {
        return;
    }

    const seletores = [

        "[onclick*='openModal']",
        "[onclick*='save']",
        "[onclick*='addSaleItem']",
        "[onclick*='finishSale']",
        "[onclick*='removeSaleItem']",
        "#btn-nova-venda",
        "#btn-add-product",
        "#btn-add-client",
        "#btn-add-supplier",
        "#btn-add-category",
        "#btn-add-store",
        "#btn-add-stock",
        "#btn-remove-stock",
        "#btn-novo-produto",
        "#btn-novo-cliente",
        "#btn-novo-fornecedor",
        "#btn-nova-categoria",
        "#btn-nova-loja",
        "#btn-novo-estoque",
        "#btn-novo-usuario"
    ];

    document
        .querySelectorAll(seletores.join(","))
        .forEach(element => {
            element.style.display = "none";
        });

    document
        .querySelectorAll(
            "#vendas form, #clientes form, #produtos form, #fornecedores form, #categorias form, #lojas form, #estoque form, #pagamentos form"
        )
        .forEach(form => {
            form.style.display = "none";
        });
}


// ============================================================
// SEÇÕES
// ============================================================

function showSection(section) {

    if (!exigirPermissao(section)) {
        return;
    }

    const target =
        document.getElementById(section);

    if (!target) {
        return;
    }

    document
        .querySelectorAll(".section")
        .forEach(el => {
            el.classList.remove("active");
        });

    target.classList.add("active");

    document
        .querySelectorAll(".nav-item")
        .forEach(el => {
            el.classList.remove("active");
        });

    const active =
        document.querySelector(
            `[data-section="${section}"]`
        );

    if (active) {
        active.classList.add("active");
    }

    const title =
        titles[section];

    if (title) {

        const pageTitle =
            document.getElementById(
                "page-title"
            );

        const pageSubtitle =
            document.getElementById(
                "page-subtitle"
            );

        if (pageTitle) {
            pageTitle.textContent =
                title[0];
        }

        if (pageSubtitle) {
            pageSubtitle.textContent =
                title[1];
        }
    }

    if (section === "vendas") {
        updateSaleSelectors();
    }

    if (section === "estoque") {

        if (
            typeof loadStock === "function"
        ) {
            loadStock();
        }
    }

    if (section === "pendencias") {

        if (
            typeof loadPendencias === "function"
        ) {
            loadPendencias();
        }
    }

    if (section === "pagamentos") {

        if (
            typeof loadPayments === "function"
        ) {
            loadPayments();
        }
    }

    if (section === "extrato") {

        if (
            typeof loadExtrato === "function"
        ) {
            loadExtrato();
        }
    }

    if (section === "relatorios") {

        if (
            typeof loadRelatorios === "function"
        ) {
            loadRelatorios();
        }
    }

    if (section === "usuarios") {

        if (
            typeof loadUsuarios === "function"
        ) {
            loadUsuarios();
        }
    }
}


// ============================================================
// MODAIS
// ============================================================

function openModal(id) {

    const modal =
        document.getElementById(id);

    if (!modal) {
        return;
    }

    const permissoesModal = {

        "product-modal": "produtos",
        "stock-modal": "estoque",
        "supplier-modal": "fornecedores",
        "category-modal": "categorias",
        "store-modal": "lojas",
        "client-modal": "clientes",
        "user-modal": "usuarios",
        "pay-modal": "pagamentos",
        "sale-modal": "vendas",
        "stock-remove-modal": "estoque"
    };

    const permissao =
        permissoesModal[id];

    if (permissao) {

        if (!exigirOperacao(permissao)) {
            return;
        }
    }

    modal.classList.add("show");

    if (id === "product-modal") {

        populateSelect(
            "product-category",
            categories,
            "Selecione uma categoria",
            x => x.nome
        );

        populateSelect(
            "product-store",
            stores,
            "Selecione uma loja",
            x => x.nome
        );

        populateSelect(
            "product-supplier",
            suppliers,
            "Selecione um fornecedor",
            x => x.razao_social
        );
    }

    if (id === "stock-modal") {

        populateSelect(
            "stock-product",
            products,
            "Selecione um produto",
            x =>
                `${x.nome} - estoque: ${x.estoque || 0}`
        );

        populateSelect(
            "stock-supplier",
            suppliers,
            "Selecione um fornecedor",
            x => x.razao_social
        );
    }

    if (id === "user-modal") {

        if (!exigirAdmin()) {
            closeModal(id);
            return;
        }

        populateSelect(
            "user-client",
            clients,
            "Selecione o cliente",
            x => x.nome
        );

        if (
            typeof toggleUserClient ===
            "function"
        ) {
            toggleUserClient();
        }
    }

    if (id === "pay-modal") {

        const saleId =
            document.getElementById(
                "pay-sale"
            )?.value;

        if (saleId) {

            const sale =
                sales.find(
                    s =>
                        Number(s.id) ===
                        Number(saleId)
                );

            if (sale) {

                const value =
                    Number(sale.total || 0) -
                    Number(sale.pago || 0);

                const input =
                    document.getElementById(
                        "pay-value"
                    );

                if (input) {

                    input.value =
                        value > 0
                            ? value.toFixed(2)
                            : "";

                }
            }
        }
    }
}


function closeModal(id) {

    const modal =
        document.getElementById(id);

    if (modal) {
        modal.classList.remove("show");
    }
}


// ============================================================
// UTILITÁRIOS
// ============================================================

function money(value) {

    return Number(value || 0)
        .toLocaleString(
            "pt-BR",
            {
                style: "currency",
                currency: "BRL"
            }
        );
}


function escapeHtml(value) {

    return String(value ?? "")
        .replace(
            /[&<>"']/g,
            char => ({
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"
            }[char])
        );
}


function populateSelect(
    id,
    items,
    placeholder,
    labelFunction
) {

    const select =
        document.getElementById(id);

    if (!select) {
        return;
    }

    select.innerHTML =
        `<option value="">${placeholder}</option>`;

    if (!Array.isArray(items)) {
        return;
    }

    items.forEach(item => {

        const idValue =
            item.id ??
            item.id_cliente ??
            item.id_loja ??
            item.id_categoria ??
            item.id_fornecedor ??
            item.id_produto;

        select.innerHTML += `
            <option value="${idValue}">
                ${escapeHtml(
                    labelFunction(item)
                )}
            </option>
        `;
    });
}


function val(id) {

    return (
        document.getElementById(id)
            ?.value || ""
    );
}


// ============================================================
// RENDERIZAÇÃO
// ============================================================

function renderAll() {

    renderClients();
    renderProducts();
    renderStock();
    renderSuppliers();
    renderCategories();
    renderStores();
    renderSales();
    renderPayments();

    updateDashboard();
    updateSaleSelectors();
    renderSaleItems();

    esconderElementosDoCliente();
}


// ============================================================
// CLIENTES
// ============================================================

function renderClients() {

    const table =
        document.getElementById(
            "clients-table"
        );

    if (!table) {
        return;
    }

    table.innerHTML =
        clients.length

            ? clients.map(c => `
                <tr>

                    <td>${c.id}</td>

                    <td>
                        ${escapeHtml(c.nome)}
                    </td>

                    <td>
                        ${escapeHtml(c.cpf)}
                    </td>

                    <td>
                        ${escapeHtml(c.email)}
                    </td>

                    <td>
                        ${escapeHtml(c.telefone)}
                    </td>

                </tr>
            `).join("")

            : `
                <tr>
                    <td colspan="5" class="empty">
                        Nenhum cliente cadastrado.
                    </td>
                </tr>
            `;
}


// ============================================================
// PRODUTOS
// ============================================================

function renderProducts() {

    const table =
        document.getElementById(
            "products-table"
        );

    if (!table) {
        return;
    }

    const search =
        document.getElementById(
            "product-search"
        )?.value
        ?.toLowerCase() || "";

    const filtered =
        products.filter(
            p =>
                String(p.nome)
                    .toLowerCase()
                    .includes(search)
        );

    table.innerHTML =
        filtered.length

            ? filtered.map(p => {

                const cat =
                    categories.find(
                        c =>
                            Number(c.id) ===
                            Number(p.categoria)
                    );

                const store =
                    stores.find(
                        s =>
                            Number(s.id) ===
                            Number(p.loja)
                    );

                const categoriaNome =
                    p.categoria_nome ||
                    cat?.nome ||
                    "-";

                const lojaNome =
                    p.loja_nome ||
                    store?.nome ||
                    "-";

                return `
                    <tr>

                        <td>${p.id}</td>

                        <td>
                            <strong>
                                ${escapeHtml(p.nome)}
                            </strong>
                        </td>

                        <td>
                            ${escapeHtml(
                                categoriaNome
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                lojaNome
                            )}
                        </td>

                        <td>
                            ${money(p.preco)}
                        </td>

                        <td>
                            ${
                                Number(p.tendencia)
                                    ? '<span class="badge green">Sim</span>'
                                    : "Não"
                            }
                        </td>

                        <td>
                            ${
                                Number(p.novidade)
                                    ? '<span class="badge green">Sim</span>'
                                    : "Não"
                            }
                        </td>

                    </tr>
                `;

            }).join("")

            : `
                <tr>
                    <td colspan="7" class="empty">
                        Nenhum produto encontrado.
                    </td>
                </tr>
            `;
}


// ============================================================
// ESTOQUE
// ============================================================

function renderStock() {

    const table =
        document.getElementById(
            "stock-table"
        );

    if (!table) {
        return;
    }

    table.innerHTML =
        products.length

            ? products.map(p => {

                const supplier =
                    suppliers.find(
                        s =>
                            Number(s.id) ===
                            Number(p.fornecedor)
                    );

                const fornecedorNome =
                    p.fornecedor_nome ||
                    supplier?.razao_social ||
                    "-";

                const quantidade =
                    Number(p.estoque || 0);

                let badge;

                if (quantidade <= 0) {

                    badge =
                        '<span class="badge red">Sem estoque</span>';

                } else if (quantidade <= 5) {

                    badge =
                        '<span class="badge yellow">Estoque baixo</span>';

                } else {

                    badge =
                        '<span class="badge green">Normal</span>';
                }

                return `
                    <tr>

                        <td>
                            ${escapeHtml(p.nome)}
                        </td>

                        <td>
                            ${escapeHtml(
                                fornecedorNome
                            )}
                        </td>

                        <td>
                            <strong>
                                ${quantidade}
                            </strong>
                        </td>

                        <td>
                            ${badge}
                        </td>

                    </tr>
                `;

            }).join("")

            : `
                <tr>
                    <td colspan="4" class="empty">
                        Nenhum produto cadastrado.
                    </td>
                </tr>
            `;
}


// ============================================================
// FORNECEDORES
// ============================================================

function renderSuppliers() {

    const table =
        document.getElementById(
            "suppliers-table"
        );

    if (!table) {
        return;
    }

    table.innerHTML =
        suppliers.length

            ? suppliers.map(s => `
                <tr>

                    <td>${s.id}</td>

                    <td>
                        ${escapeHtml(
                            s.razao_social
                        )}
                    </td>

                    <td>
                        ${escapeHtml(s.cnpj)}
                    </td>

                    <td>
                        ${escapeHtml(s.email)}
                    </td>

                    <td>
                        ${escapeHtml(s.telefone)}
                    </td>

                </tr>
            `).join("")

            : `
                <tr>
                    <td colspan="5" class="empty">
                        Nenhum fornecedor cadastrado.
                    </td>
                </tr>
            `;
}


// ============================================================
// CATEGORIAS
// ============================================================

function renderCategories() {

    const table =
        document.getElementById(
            "categories-table"
        );

    if (!table) {
        return;
    }

    table.innerHTML =
        categories.length

            ? categories.map(c => `
                <tr>

                    <td>${c.id}</td>

                    <td>
                        ${escapeHtml(c.nome)}
                    </td>

                    <td>
                        ${escapeHtml(c.descricao)}
                    </td>

                </tr>
            `).join("")

            : `
                <tr>
                    <td colspan="3" class="empty">
                        Nenhuma categoria cadastrada.
                    </td>
                </tr>
            `;
}


// ============================================================
// LOJAS
// ============================================================

function renderStores() {

    const table =
        document.getElementById(
            "stores-table"
        );

    if (!table) {
        return;
    }

    table.innerHTML =
        stores.length

            ? stores.map(s => `
                <tr>

                    <td>${s.id}</td>

                    <td>
                        ${escapeHtml(s.nome)}
                    </td>

                    <td>
                        ${escapeHtml(s.tipo)}
                    </td>

                    <td>
                        ${escapeHtml(s.endereco)}
                    </td>

                </tr>
            `).join("")

            : `
                <tr>
                    <td colspan="4" class="empty">
                        Nenhuma loja cadastrada.
                    </td>
                </tr>
            `;
}


// ============================================================
// VENDAS
// ============================================================

function renderSales() {

    const table =
        document.getElementById(
            "sales-table"
        );

    if (!table) {
        return;
    }

    const search =
        document.getElementById(
            "sales-search"
        )?.value
        ?.toLowerCase() || "";

    const filtered =
        sales.filter(s => {

            const cliente =
                getClientName(
                    s.cliente
                ).toLowerCase();

            return (
                String(s.id)
                    .toLowerCase()
                    .includes(search) ||
                cliente.includes(search)
            );
        });

    table.innerHTML =
        filtered.length

            ? filtered.map(s => {

                const status =
                    s.status ===
                    "CONCLUIDO";

                return `
                    <tr>

                        <td>#${s.id}</td>

                        <td>
                            ${formatDate(s.data)}
                        </td>

                        <td>
                            ${escapeHtml(
                                s.cliente_nome ||
                                getClientName(
                                    s.cliente
                                )
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                s.loja_nome ||
                                getStoreName(
                                    s.loja
                                )
                            )}
                        </td>

                        <td>
                            ${escapeHtml(
                                s.canal
                            )}
                        </td>

                        <td>
                            <strong>
                                ${money(s.total)}
                            </strong>
                        </td>

                        <td>
                            <span class="badge ${
                                status
                                    ? "green"
                                    : "yellow"
                            }">
                                ${
                                    status
                                        ? "CONCLUÍDO"
                                        : "ABERTA"
                                }
                            </span>
                        </td>

                    </tr>
                `;

            }).join("")

            : `
                <tr>
                    <td colspan="7" class="empty">
                        Nenhuma venda encontrada.
                    </td>
                </tr>
            `;

    renderRecentSales();
}


function renderRecentSales() {

    const element =
        document.getElementById(
            "recent-sales"
        );

    if (!element) {
        return;
    }

    const recent =
        [...sales]
            .sort(
                (a, b) =>
                    new Date(b.data) -
                    new Date(a.data)
            )
            .slice(0, 5);

    element.innerHTML =
        recent.length

            ? recent.map(s => `
                <div class="recent-item">

                    <div>

                        <strong>
                            Venda #${s.id}
                        </strong>

                        <small>
                            ${escapeHtml(
                                s.cliente_nome ||
                                getClientName(
                                    s.cliente
                                )
                            )}
                        </small>

                    </div>

                    <strong>
                        ${money(s.total)}
                    </strong>

                </div>
            `).join("")

            : `
                <div class="empty">
                    Nenhuma venda registrada.
                </div>
            `;
}


// ============================================================
// PAGAMENTOS
// ============================================================

function renderPayments() {

    const table =
        document.getElementById(
            "payments-table"
        );

    if (!table) {
        return;
    }

    table.innerHTML =
        payments.length

            ? payments.map(p => `
                <tr>

                    <td>${p.id}</td>

                    <td>#${p.venda}</td>

                    <td>
                        ${escapeHtml(p.forma)}
                    </td>

                    <td>
                        ${money(p.valor)}
                    </td>

                    <td>
                        <span class="badge green">
                            ${escapeHtml(p.status)}
                        </span>
                    </td>

                    <td>
                        ${formatDate(p.data)}
                    </td>

                </tr>
            `).join("")

            : `
                <tr>
                    <td colspan="6" class="empty">
                        Nenhum pagamento registrado.
                    </td>
                </tr>
            `;
}


// ============================================================
// DASHBOARD
// ============================================================

function updateDashboard() {

    const perfil =
        perfilAtual();

    const today =
        new Date().toDateString();

    const todaySales =
        sales
            .filter(
                s =>
                    new Date(s.data)
                        .toDateString() ===
                    today &&
                    s.status === "CONCLUIDO"
            )
            .reduce(
                (sum, s) =>
                    sum +
                    Number(s.total || 0),
                0
            );

    const dashSales =
        document.getElementById(
            "dash-sales"
        );

    const dashProducts =
        document.getElementById(
            "dash-products"
        );

    const dashClients =
        document.getElementById(
            "dash-clients"
        );

    const dashLowStock =
        document.getElementById(
            "dash-low-stock"
        );

    if (dashSales) {
        dashSales.textContent =
            money(todaySales);
    }

    if (dashProducts) {
        dashProducts.textContent =
            products.length;
    }

    if (dashClients) {

        if (perfil === "CLIENTE") {
            dashClients.textContent = "—";
        } else {
            dashClients.textContent =
                clients.length;
        }
    }

    if (dashLowStock) {

        if (perfil === "CLIENTE") {
            dashLowStock.textContent = "—";
        } else {

            dashLowStock.textContent =
                products.filter(
                    p =>
                        Number(
                            p.estoque || 0
                        ) <= 5
                ).length;
        }
    }
}


// ============================================================
// SELETORES DA VENDA
// ============================================================

function updateSaleSelectors() {

    if (!temPermissao("vendas")) {
        return;
    }

    if (perfilAtual() === "CLIENTE") {
        return;
    }

    populateSelect(
        "sale-client",
        clients,
        "Selecione o cliente",
        c => c.nome
    );

    populateSelect(
        "sale-store",
        stores,
        "Selecione a loja",
        s => s.nome
    );

    const productSelect =
        document.getElementById(
            "sale-product"
        );

    if (!productSelect) {
        return;
    }

    productSelect.innerHTML =
        '<option value="">Selecione o produto</option>';

    products.forEach(p => {

        const estoque =
            Number(p.estoque || 0);

        if (estoque > 0) {

            productSelect.innerHTML += `
                <option value="${p.id}">
                    ${escapeHtml(p.nome)}
                    - ${money(p.preco)}
                    (${estoque} disponíveis)
                </option>
            `;
        }
    });
}


// ============================================================
// ITENS DA VENDA
// ============================================================

function addSaleItem() {

    if (!exigirOperacao("vendas")) {
        return;
    }

    const productId =
        Number(
            document.getElementById(
                "sale-product"
            )?.value
        );

    const qty =
        Number(
            document.getElementById(
                "sale-qty"
            )?.value
        );

    if (
        !productId ||
        qty <= 0 ||
        !Number.isInteger(qty)
    ) {

        toast(
            "Selecione um produto e informe uma quantidade inteira válida.",
            true
        );

        return;
    }

    const product =
        products.find(
            p =>
                Number(p.id) ===
                productId
        );

    if (!product) {

        toast(
            "Produto não encontrado.",
            true
        );

        return;
    }

    const estoque =
        Number(product.estoque || 0);

    const existing =
        saleItems.find(
            item =>
                Number(item.produto) ===
                productId
        );

    const totalQty =
        (existing?.quantidade || 0) +
        qty;

    if (totalQty > estoque) {

        toast(
            `Estoque insuficiente. Disponível: ${estoque}`,
            true
        );

        return;
    }

    if (existing) {

        existing.quantidade += qty;

    } else {

        saleItems.push({
            produto: productId,
            quantidade: qty,
            preco: Number(
                product.preco
            )
        });
    }

    renderSaleItems();
}


function removeSaleItem(index) {

    if (!exigirOperacao("vendas")) {
        return;
    }

    saleItems.splice(
        index,
        1
    );

    renderSaleItems();
}


function renderSaleItems() {

    const tbody =
        document.getElementById(
            "sale-items"
        );

    if (!tbody) {
        return;
    }

    if (!saleItems.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="empty">
                    Nenhum item adicionado.
                </td>
            </tr>
        `;

    } else {

        tbody.innerHTML =
            saleItems.map(
                (item, index) => {

                    const product =
                        products.find(
                            p =>
                                Number(p.id) ===
                                Number(item.produto)
                        );

                    return `
                        <tr>

                            <td>
                                ${escapeHtml(
                                    product?.nome || ""
                                )}
                            </td>

                            <td>
                                ${item.quantidade}
                            </td>

                            <td>
                                ${money(
                                    item.preco
                                )}
                            </td>

                            <td>
                                ${money(
                                    item.quantidade *
                                    item.preco
                                )}
                            </td>

                            <td>

                                <button
                                    type="button"
                                    class="icon-btn"
                                    onclick="removeSaleItem(${index})">

                                    🗑️

                                </button>

                            </td>

                        </tr>
                    `;

                }
            ).join("");
    }

    const total =
        saleItems.reduce(
            (sum, item) =>
                sum +
                item.quantidade *
                Number(item.preco),
            0
        );

    const saleTotal =
        document.getElementById(
            "sale-total"
        );

    if (saleTotal) {
        saleTotal.textContent =
            money(total);
    }
}


// ============================================================
// FINALIZAR VENDA
// ============================================================

async function finishSale() {

    if (!exigirOperacao("vendas")) {
        return;
    }

    const cliente =
        Number(
            document.getElementById(
                "sale-client"
            )?.value
        );

    const loja =
        Number(
            document.getElementById(
                "sale-store"
            )?.value
        );

    if (!cliente || !loja) {

        toast(
            "Selecione o cliente e a loja.",
            true
        );

        return;
    }

    if (!saleItems.length) {

        toast(
            "Adicione pelo menos um produto à venda.",
            true
        );

        return;
    }

    const total =
        saleItems.reduce(
            (sum, item) =>
                sum +
                item.quantidade *
                Number(item.preco),
            0
        );

    let valorPago =
        Number(
            document.getElementById(
                "sale-paid"
            )?.value
        );

    if (
        Number.isNaN(valorPago) ||
        valorPago < 0
    ) {
        valorPago = 0;
    }

    if (valorPago > total) {

        toast(
            "O valor pago não pode ser maior que o total da venda.",
            true
        );

        return;
    }

    try {

        const response =
            await api(
                "vendas",
                "POST",
                {
                    cliente,
                    loja,

                    canal:
                        document.getElementById(
                            "sale-channel"
                        )?.value ||
                        "Loja física",

                    forma:
                        document.getElementById(
                            "sale-payment"
                        )?.value ||
                        "PIX",

                    valorPago,

                    itens:
                        saleItems.map(
                            item => ({
                                produto:
                                    Number(
                                        item.produto
                                    ),

                                quantidade:
                                    Number(
                                        item.quantidade
                                    )
                            })
                        )
                }
            );

        saleItems = [];

        const paidInput =
            document.getElementById(
                "sale-paid"
            );

        if (paidInput) {
            paidInput.value = "";
        }

        renderSaleItems();

        await loadAll();

        toast(
            `Venda #${response.id} registrada com sucesso!`
        );

        showSection("vendas");

    } catch (e) {

        toast(
            e.message,
            true
        );

        await loadAll();
    }
}


// ============================================================
// SALVAR DADOS
// ============================================================

async function save(
    event,
    modal,
    path,
    body,
    permissao
) {

    event.preventDefault();

    if (
        permissao &&
        !exigirOperacao(permissao)
    ) {
        return;
    }

    try {

        await api(
            path,
            "POST",
            body
        );

        event.target.reset();

        closeModal(modal);

        await loadAll();

        toast(
            "Cadastro realizado com sucesso!"
        );

    } catch (e) {

        toast(
            e.message,
            true
        );
    }
}


// ============================================================
// CLIENTE
// ============================================================

function saveClient(event) {

    if (!exigirOperacao("clientes")) {
        event.preventDefault();
        return;
    }

    save(
        event,
        "client-modal",
        "clientes",
        {
            nome:
                val("client-name"),

            cpf:
                val("client-cpf"),

            email:
                val("client-email"),

            telefone:
                val("client-phone")
        },
        "clientes"
    );
}


// ============================================================
// PRODUTO
// ============================================================

function saveProduct(event) {

    if (!exigirAdmin()) {
        event.preventDefault();
        return;
    }

    const categoria =
        Number(
            val("product-category")
        );

    const loja =
        Number(
            val("product-store")
        );

    const fornecedor =
        Number(
            val("product-supplier")
        );

    const preco =
        Number(
            val("product-price")
        );

    const estoque =
        Number(
            val("product-stock")
        );

    if (
        !categoria ||
        !loja ||
        !fornecedor
    ) {

        event.preventDefault();

        toast(
            "Preencha categoria, loja e fornecedor.",
            true
        );

        return;
    }

    if (
        preco < 0 ||
        estoque < 0
    ) {

        event.preventDefault();

        toast(
            "Preço e estoque não podem ser negativos.",
            true
        );

        return;
    }

    save(
        event,
        "product-modal",
        "produtos",
        {
            nome:
                val("product-name"),

            categoria,

            loja,

            fornecedor,

            preco,

            estoque,

            tendencia:
                document.getElementById(
                    "product-trend"
                )?.checked || false,

            novidade:
                document.getElementById(
                    "product-new"
                )?.checked || false
        },
        "produtos"
    );
}


// ============================================================
// FORNECEDOR
// ============================================================

function saveSupplier(event) {

    if (!exigirAdmin()) {
        event.preventDefault();
        return;
    }

    save(
        event,
        "supplier-modal",
        "fornecedores",
        {
            razao_social:
                val("supplier-name"),

            cnpj:
                val("supplier-cnpj"),

            email:
                val("supplier-email"),

            telefone:
                val("supplier-phone")
        },
        "fornecedores"
    );
}


// ============================================================
// CATEGORIA
// ============================================================

function saveCategory(event) {

    if (!exigirAdmin()) {
        event.preventDefault();
        return;
    }

    save(
        event,
        "category-modal",
        "categorias",
        {
            nome:
                val("category-name"),

            descricao:
                val("category-description")
        },
        "categorias"
    );
}


// ============================================================
// LOJA
// ============================================================

function saveStore(event) {

    if (!exigirAdmin()) {
        event.preventDefault();
        return;
    }

    save(
        event,
        "store-modal",
        "lojas",
        {
            nome:
                val("store-name"),

            tipo:
                val("store-type"),

            endereco:
                val("store-address")
        },
        "lojas"
    );
}


// ============================================================
// NOMES
// ============================================================

function getClientName(id) {

    return (
        clients.find(
            c =>
                Number(c.id) ===
                Number(id)
        )?.nome ||
        "Cliente não encontrado"
    );
}


function getStoreName(id) {

    return (
        stores.find(
            s =>
                Number(s.id) ===
                Number(id)
        )?.nome ||
        "Loja não encontrada"
    );
}


// ============================================================
// DATA
// ============================================================

function formatDate(date) {

    if (!date) {
        return "-";
    }

    const d =
        new Date(date);

    if (
        Number.isNaN(
            d.getTime()
        )
    ) {
        return "-";
    }

    return d.toLocaleString(
        "pt-BR"
    );
}


// ============================================================
// PESQUISA
// ============================================================

document.addEventListener(
    "input",
    event => {

        if (
            event.target.id ===
            "product-search"
        ) {
            renderProducts();
        }

        if (
            event.target.id ===
            "sales-search"
        ) {
            renderSales();
        }

    }
);


// ============================================================
// ATUALIZAÇÃO AUTOMÁTICA
// ============================================================

window.addEventListener(
    "focus",
    () => {

        if (
            AUTH?.token &&
            AUTH?.user
        ) {
            loadAll();
        }

    }
);


// ============================================================
// FECHAR MODAL CLICANDO FORA
// ============================================================

document.addEventListener(
    "click",
    event => {

        if (
            event.target.classList.contains(
                "modal"
            )
        ) {

            event.target.classList.remove(
                "show"
            );
        }

    }
);