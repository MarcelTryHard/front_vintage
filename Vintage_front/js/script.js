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

    const res = await fetch("/api/" + path, {
        method,
        headers: {
            "Content-Type": "application/json"
        },
        body: body ? JSON.stringify(body) : undefined
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new Error(data.erro || "Erro na requisição");
    }

    return data;
}


// ============================================================
// TOAST
// ============================================================

function toast(msg, error = false) {

    const t = document.createElement("div");

    t.className = "toast" + (error ? " error" : "");
    t.textContent = msg;

    document.body.appendChild(t);

    setTimeout(() => t.remove(), 3500);
}


// ============================================================
// CARREGAMENTO DOS DADOS
// ============================================================

async function loadAll() {

    const perfil = AUTH.user.perfil;

    try {

        clients = [];
        stores = [];
        categories = [];
        suppliers = [];
        products = [];
        sales = [];
        payments = [];

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

        }

        else if (perfil === "OPERADOR") {

            [
                clients,
                products,
                sales,
                payments
            ] = await Promise.all([
                api("clientes"),
                api("produtos"),
                api("vendas"),
                api("pagamentos")
            ]);

        }

        else if (perfil === "VENDEDOR") {

            [
                clients,
                products,
                sales
            ] = await Promise.all([
                api("clientes"),
                api("produtos"),
                api("vendas")
            ]);

        }

        else if (perfil === "LOJISTA") {

            [
                products,
                stores,
                categories,
                sales
            ] = await Promise.all([
                api("produtos"),
                api("lojas"),
                api("categorias"),
                api("vendas")
            ]);

        }

        else if (perfil === "CLIENTE") {

            products = await api("produtos");

        }

        renderAll();

    } catch (e) {

        toast("Falha ao carregar dados: " + e.message, true);

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
        "Controle de estoque"
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
        "Gestão de lojas"
    ],

    pagamentos: [
        "Pagamentos",
        "Controle financeiro"
    ]
};


// ============================================================
// INICIALIZAÇÃO
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

    document.querySelectorAll(".nav-item").forEach(button => {

        button.addEventListener("click", () => {
            showSection(button.dataset.section);
        });

    });

    loadAll();

});


// ============================================================
// SEÇÕES
// ============================================================

function showSection(section) {

    const target = document.getElementById(section);

    if (!target) {
        return;
    }

    document.querySelectorAll(".section").forEach(el => {
        el.classList.remove("active");
    });

    target.classList.add("active");

    document.querySelectorAll(".nav-item").forEach(el => {
        el.classList.remove("active");
    });

    const active = document.querySelector(
        `[data-section="${section}"]`
    );

    if (active) {
        active.classList.add("active");
    }

    const title = titles[section];

    if (title) {

        const pageTitle = document.getElementById("page-title");
        const pageSubtitle = document.getElementById("page-subtitle");

        if (pageTitle) {
            pageTitle.textContent = title[0];
        }

        if (pageSubtitle) {
            pageSubtitle.textContent = title[1];
        }

    }

    if (section === "vendas") {
        updateSaleSelectors();
    }

}


// ============================================================
// MODAIS
// ============================================================

function openModal(id) {

    const modal = document.getElementById(id);

    if (!modal) {
        return;
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

}


function closeModal(id) {

    const modal = document.getElementById(id);

    if (modal) {
        modal.classList.remove("show");
    }

}


// ============================================================
// UTILITÁRIOS
// ============================================================

function money(value) {

    return Number(value || 0).toLocaleString(
        "pt-BR",
        {
            style: "currency",
            currency: "BRL"
        }
    );

}


function escapeHtml(value) {

    return String(value ?? "").replace(
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

    const select = document.getElementById(id);

    if (!select) {
        return;
    }

    select.innerHTML =
        `<option value="">${placeholder}</option>`;

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
                ${escapeHtml(labelFunction(item))}
            </option>
        `;

    });

}


// ============================================================
// RENDERIZAÇÃO GERAL
// ============================================================

function renderAll() {

    if (document.getElementById("clients-table")) {
        renderClients();
    }

    if (document.getElementById("products-table")) {
        renderProducts();
    }

    if (document.getElementById("stock-table")) {
        renderStock();
    }

    if (document.getElementById("suppliers-table")) {
        renderSuppliers();
    }

    if (document.getElementById("categories-table")) {
        renderCategories();
    }

    if (document.getElementById("stores-table")) {
        renderStores();
    }

    if (document.getElementById("sales-table")) {
        renderSales();
    }

    if (document.getElementById("payments-table")) {
        renderPayments();
    }

    updateDashboard();
    updateSaleSelectors();

}


// ============================================================
// CLIENTES
// ============================================================

function renderClients() {

    const table = document.getElementById("clients-table");

    if (!table) {
        return;
    }

    table.innerHTML = clients.map(c => `
        <tr>
            <td>${c.id}</td>
            <td>${escapeHtml(c.nome)}</td>
            <td>${escapeHtml(c.cpf)}</td>
            <td>${escapeHtml(c.email)}</td>
            <td>${escapeHtml(c.telefone)}</td>
        </tr>
    `).join("");

}


// ============================================================
// PRODUTOS
// ============================================================

function renderProducts() {

    const table = document.getElementById("products-table");

    if (!table) {
        return;
    }

    const search =
        document.getElementById("product-search")?.value
            ?.toLowerCase() || "";

    const filtered = products.filter(p =>
        String(p.nome).toLowerCase().includes(search)
    );

    table.innerHTML = filtered.map(p => {

        const cat = categories.find(
            c => c.id === p.categoria
        );

        const store = stores.find(
            s => s.id === p.loja
        );

        return `
            <tr>
                <td>${p.id}</td>

                <td>
                    <strong>${escapeHtml(p.nome)}</strong>
                </td>

                <td>
                    ${escapeHtml(cat?.nome || "-")}
                </td>

                <td>
                    ${escapeHtml(store?.nome || "-")}
                </td>

                <td>
                    ${money(p.preco)}
                </td>

                <td>
                    ${
                        p.tendencia
                            ? '<span class="badge green">Sim</span>'
                            : "Não"
                    }
                </td>

                <td>
                    ${
                        p.novidade
                            ? '<span class="badge green">Sim</span>'
                            : "Não"
                    }
                </td>
            </tr>
        `;

    }).join("");

}


// ============================================================
// ESTOQUE
// ============================================================

function renderStock() {

    const table = document.getElementById("stock-table");

    if (!table) {
        return;
    }

    table.innerHTML = products.map(p => {

        const supplier = suppliers.find(
            s => s.id === p.fornecedor
        );

        let badge;

        if (p.estoque <= 0) {

            badge =
                '<span class="badge red">Sem estoque</span>';

        } else if (p.estoque <= 5) {

            badge =
                '<span class="badge yellow">Estoque baixo</span>';

        } else {

            badge =
                '<span class="badge green">Normal</span>';

        }

        return `
            <tr>
                <td>${escapeHtml(p.nome)}</td>

                <td>
                    ${escapeHtml(
                        supplier?.razao_social || "-"
                    )}
                </td>

                <td>
                    <strong>${p.estoque}</strong>
                </td>

                <td>${badge}</td>
            </tr>
        `;

    }).join("");

}


// ============================================================
// FORNECEDORES
// ============================================================

function renderSuppliers() {

    const table =
        document.getElementById("suppliers-table");

    if (!table) {
        return;
    }

    table.innerHTML = suppliers.map(s => `
        <tr>
            <td>${s.id}</td>
            <td>${escapeHtml(s.razao_social)}</td>
            <td>${escapeHtml(s.cnpj)}</td>
            <td>${escapeHtml(s.email)}</td>
            <td>${escapeHtml(s.telefone)}</td>
        </tr>
    `).join("");

}


// ============================================================
// CATEGORIAS
// ============================================================

function renderCategories() {

    const table =
        document.getElementById("categories-table");

    if (!table) {
        return;
    }

    table.innerHTML = categories.map(c => `
        <tr>
            <td>${c.id}</td>
            <td>${escapeHtml(c.nome)}</td>
            <td>${escapeHtml(c.descricao)}</td>
        </tr>
    `).join("");

}


// ============================================================
// LOJAS
// ============================================================

function renderStores() {

    const table =
        document.getElementById("stores-table");

    if (!table) {
        return;
    }

    table.innerHTML = stores.map(s => `
        <tr>
            <td>${s.id}</td>
            <td>${escapeHtml(s.nome)}</td>
            <td>${escapeHtml(s.tipo)}</td>
            <td>${escapeHtml(s.endereco)}</td>
        </tr>
    `).join("");

}


// ============================================================
// VENDAS
// ============================================================

function renderSales() {

    const table =
        document.getElementById("sales-table");

    if (!table) {
        return;
    }

    const search =
        document.getElementById("sales-search")?.value
            ?.toLowerCase() || "";

    const filtered = sales.filter(s =>
        String(s.id).includes(search) ||
        getClientName(s.cliente)
            .toLowerCase()
            .includes(search)
    );

    table.innerHTML = filtered.length

        ? filtered.map(s => `
            <tr>
                <td>#${s.id}</td>

                <td>
                    ${new Date(s.data)
                        .toLocaleString("pt-BR")}
                </td>

                <td>
                    ${escapeHtml(
                        getClientName(s.cliente)
                    )}
                </td>

                <td>
                    ${escapeHtml(
                        getStoreName(s.loja)
                    )}
                </td>

                <td>
                    ${escapeHtml(s.canal)}
                </td>

                <td>
                    <strong>
                        ${money(s.total)}
                    </strong>
                </td>

                <td>
                    <span class="badge ${
                        s.status === "CONCLUIDO"
                            ? "green"
                            : "yellow"
                    }">
                        ${escapeHtml(s.status)}
                    </span>
                </td>
            </tr>
        `).join("")

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
        document.getElementById("recent-sales");

    if (!element) {
        return;
    }

    const recent =
        [...sales].reverse().slice(0, 5);

    element.innerHTML = recent.length

        ? recent.map(s => `
            <div class="recent-item">

                <div>
                    <strong>
                        Venda #${s.id}
                    </strong>

                    <small>
                        ${escapeHtml(
                            getClientName(s.cliente)
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
        document.getElementById("payments-table");

    if (!table) {
        return;
    }

    table.innerHTML = payments.length

        ? payments.map(p => `
            <tr>
                <td>${p.id}</td>
                <td>#${p.venda}</td>
                <td>${escapeHtml(p.forma)}</td>
                <td>${money(p.valor)}</td>

                <td>
                    <span class="badge green">
                        ${escapeHtml(p.status)}
                    </span>
                </td>

                <td>
                    ${new Date(p.data)
                        .toLocaleString("pt-BR")}
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

    const today =
        new Date().toDateString();

    const todaySales = sales
        .filter(s =>
            new Date(s.data).toDateString() === today
        )
        .reduce(
            (sum, s) =>
                sum + Number(s.total || 0),
            0
        );

    const dashSales =
        document.getElementById("dash-sales");

    const dashProducts =
        document.getElementById("dash-products");

    const dashClients =
        document.getElementById("dash-clients");

    const dashLowStock =
        document.getElementById("dash-low-stock");

    if (dashSales) {
        dashSales.textContent = money(todaySales);
    }

    if (dashProducts) {
        dashProducts.textContent = products.length;
    }

    if (dashClients) {
        dashClients.textContent = clients.length;
    }

    if (dashLowStock) {
        dashLowStock.textContent =
            products.filter(p => p.estoque <= 5).length;
    }

}


// ============================================================
// SELETORES DE VENDA
// ============================================================

function updateSaleSelectors() {

    const client =
        document.getElementById("sale-client");

    const store =
        document.getElementById("sale-store");

    const productSelect =
        document.getElementById("sale-product");

    if (client) {
        populateSelect(
            "sale-client",
            clients,
            "Selecione o cliente",
            c => c.nome
        );
    }

    if (store) {
        populateSelect(
            "sale-store",
            stores,
            "Selecione a loja",
            s => s.nome
        );
    }

    if (!productSelect) {
        return;
    }

    productSelect.innerHTML =
        '<option value="">Selecione o produto</option>';

    products.forEach(p => {

        if (Number(p.estoque) > 0) {

            productSelect.innerHTML += `
                <option value="${p.id}">
                    ${escapeHtml(p.nome)}
                    - ${money(p.preco)}
                    (${p.estoque} disponíveis)
                </option>
            `;

        }

    });

}


// ============================================================
// ITENS DA VENDA
// ============================================================

function addSaleItem() {

    const productId =
        Number(
            document.getElementById("sale-product").value
        );

    const qty =
        Number(
            document.getElementById("sale-qty").value
        );

    if (!productId || qty <= 0) {

        toast(
            "Selecione um produto e informe uma quantidade válida.",
            true
        );

        return;
    }

    const product =
        products.find(p => p.id === productId);

    if (!product) {
        return;
    }

    const existing =
        saleItems.find(
            item => item.produto === productId
        );

    const totalQty =
        (existing?.quantidade || 0) + qty;

    if (totalQty > product.estoque) {

        toast(
            `Estoque insuficiente. Disponível: ${product.estoque}`,
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
            preco: product.preco
        });

    }

    renderSaleItems();

}


function removeSaleItem(index) {

    saleItems.splice(index, 1);

    renderSaleItems();

}


function renderSaleItems() {

    const tbody =
        document.getElementById("sale-items");

    if (!tbody) {
        return;
    }

    tbody.innerHTML = saleItems.length

        ? saleItems.map((item, index) => {

            const p =
                products.find(
                    x => x.id === item.produto
                );

            return `
                <tr>
                    <td>
                        ${escapeHtml(p?.nome || "")}
                    </td>

                    <td>
                        ${item.quantidade}
                    </td>

                    <td>
                        ${money(item.preco)}
                    </td>

                    <td>
                        ${money(
                            item.quantidade * item.preco
                        )}
                    </td>

                    <td>
                        <button
                            class="icon-btn"
                            onclick="removeSaleItem(${index})">
                            🗑️
                        </button>
                    </td>
                </tr>
            `;

        }).join("")

        : `
            <tr>
                <td colspan="5" class="empty">
                    Nenhum item adicionado.
                </td>
            </tr>
        `;

    const total =
        saleItems.reduce(
            (sum, item) =>
                sum + item.quantidade * item.preco,
            0
        );

    const saleTotal =
        document.getElementById("sale-total");

    if (saleTotal) {
        saleTotal.textContent = money(total);
    }

}


// ============================================================
// FINALIZAR VENDA
// ============================================================

async function finishSale() {

    const cliente =
        Number(
            document.getElementById("sale-client").value
        );

    const loja =
        Number(
            document.getElementById("sale-store").value
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

    try {

        const r = await api(
            "vendas",
            "POST",
            {
                cliente,
                loja,

                canal:
                    document.getElementById(
                        "sale-channel"
                    ).value,

                forma:
                    document.getElementById(
                        "sale-payment"
                    ).value,

                valorPago:
                    val("sale-paid") || undefined,

                itens:
                    saleItems.map(i => ({
                        produto: i.produto,
                        quantidade: i.quantidade
                    }))
            }
        );

        saleItems = [];

        renderSaleItems();

        await loadAll();

        toast(
            `Venda #${r.id} realizada com sucesso!`
        );

    } catch (e) {

        toast(e.message, true);

        await loadAll();

    }

}


// ============================================================
// SALVAR
// ============================================================

async function save(
    event,
    modal,
    path,
    body
) {

    event.preventDefault();

    try {

        await api(
            path,
            "POST",
            body
        );

        event.target.reset();

        closeModal(modal);

        await loadAll();

        toast("Cadastrado com sucesso!");

    } catch (e) {

        toast(e.message, true);

    }

}


const val = id =>
    document.getElementById(id)?.value || "";


// ============================================================
// FORMULÁRIOS
// ============================================================

function saveClient(event) {

    save(
        event,
        "client-modal",
        "clientes",
        {
            nome: val("client-name"),
            cpf: val("client-cpf"),
            email: val("client-email"),
            telefone: val("client-phone")
        }
    );

}


function saveProduct(event) {

    save(
        event,
        "product-modal",
        "produtos",
        {
            nome: val("product-name"),
            categoria: Number(
                val("product-category")
            ),
            loja: Number(
                val("product-store")
            ),
            fornecedor: Number(
                val("product-supplier")
            ),
            preco: Number(
                val("product-price")
            ),
            estoque: Number(
                val("product-stock")
            ),
            tendencia:
                document.getElementById(
                    "product-trend"
                )?.checked || false,
            novidade:
                document.getElementById(
                    "product-new"
                )?.checked || false
        }
    );

}


function saveSupplier(event) {

    save(
        event,
        "supplier-modal",
        "fornecedores",
        {
            razao_social: val("supplier-name"),
            cnpj: val("supplier-cnpj"),
            email: val("supplier-email"),
            telefone: val("supplier-phone")
        }
    );

}


function saveCategory(event) {

    save(
        event,
        "category-modal",
        "categorias",
        {
            nome: val("category-name"),
            descricao: val("category-description")
        }
    );

}


function saveStore(event) {

    save(
        event,
        "store-modal",
        "lojas",
        {
            nome: val("store-name"),
            tipo: val("store-type"),
            endereco: val("store-address")
        }
    );

}


// ============================================================
// NOMES
// ============================================================

function getClientName(id) {

    return clients.find(
        c => c.id === id
    )?.nome || "Cliente não encontrado";

}


function getStoreName(id) {

    return stores.find(
        s => s.id === id
    )?.nome || "Loja não encontrada";

}