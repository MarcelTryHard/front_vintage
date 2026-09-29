// ============================================================
// OMNISTORE - FRONTEND (conectado à API Node/Express + MySQL)
// ============================================================
let clients = [], stores = [], categories = [], suppliers = [], products = [];
let sales = [], payments = [], saleItems = [];

async function api(path, method = "GET", body) {
    const res = await fetch("/api/" + path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.erro || "Erro na requisição");
    return data;
}

function toast(msg, error = false) {
    const t = document.createElement("div");
    t.className = "toast" + (error ? " error" : "");
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3500);
}

async function loadAll() {
    try {
        [clients, stores, categories, suppliers, products, sales, payments] = await Promise.all([
            api("clientes"), api("lojas"), api("categorias"), api("fornecedores"),
            api("produtos"), api("vendas"), api("pagamentos")
        ]);
        renderAll();
    } catch (e) {
        toast("Falha ao carregar dados: " + e.message, true);
    }
}

const titles = {
    dashboard: ["Dashboard", "Visão geral da operação comercial"],
    vendas: ["Vendas", "PDV e histórico de vendas"],
    produtos: ["Produtos", "Catálogo de produtos"],
    estoque: ["Estoque", "Controle de estoque"],
    clientes: ["Clientes", "Cadastro de clientes"],
    fornecedores: ["Fornecedores", "Cadastro de fornecedores"],
    categorias: ["Categorias", "Classificação do catálogo"],
    lojas: ["Lojas", "Gestão de lojas"],
    pagamentos: ["Pagamentos", "Controle financeiro"]
};

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".nav-item").forEach(button => {
        button.addEventListener("click", () => showSection(button.dataset.section));
    });

    loadAll();
});

function showSection(section) {
    document.querySelectorAll(".section").forEach(el => el.classList.remove("active"));
    document.getElementById(section).classList.add("active");

    document.querySelectorAll(".nav-item").forEach(el => el.classList.remove("active"));
    const active = document.querySelector(`[data-section="${section}"]`);
    if (active) active.classList.add("active");

    document.getElementById("page-title").textContent = titles[section][0];
    document.getElementById("page-subtitle").textContent = titles[section][1];

    if (section === "vendas") updateSaleSelectors();
}

function openModal(id) {
    document.getElementById(id).classList.add("show");
    if (id === "product-modal") {
        populateSelect("product-category", categories, "Selecione uma categoria", x => x.nome);
        populateSelect("product-store", stores, "Selecione uma loja", x => x.nome);
        populateSelect("product-supplier", suppliers, "Selecione um fornecedor", x => x.razao_social);
    }
}

function closeModal(id) {
    document.getElementById(id).classList.remove("show");
}

function money(value) {
    return Number(value).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    }[char]));
}

function populateSelect(id, items, placeholder, labelFunction) {
    const select = document.getElementById(id);
    select.innerHTML = `<option value="">${placeholder}</option>`;
    items.forEach(item => {
        select.innerHTML += `<option value="${item.id}">${escapeHtml(labelFunction(item))}</option>`;
    });
}

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
}

function renderClients() {
    document.getElementById("clients-table").innerHTML = clients.map(c => `
        <tr>
            <td>${c.id}</td>
            <td>${escapeHtml(c.nome)}</td>
            <td>${escapeHtml(c.cpf)}</td>
            <td>${escapeHtml(c.email)}</td>
            <td>${escapeHtml(c.telefone)}</td>
        </tr>
    `).join("");
}

function renderProducts() {
    const search = (document.getElementById("product-search")?.value || "").toLowerCase();

    const filtered = products.filter(p =>
        p.nome.toLowerCase().includes(search)
    );

    document.getElementById("products-table").innerHTML = filtered.map(p => {
        const cat = categories.find(c => c.id === p.categoria);
        const store = stores.find(s => s.id === p.loja);

        return `
            <tr>
                <td>${p.id}</td>
                <td><strong>${escapeHtml(p.nome)}</strong></td>
                <td>${escapeHtml(cat?.nome || "-")}</td>
                <td>${escapeHtml(store?.nome || "-")}</td>
                <td>${money(p.preco)}</td>
                <td>${p.tendencia ? '<span class="badge green">Sim</span>' : "Não"}</td>
                <td>${p.novidade ? '<span class="badge green">Sim</span>' : "Não"}</td>
            </tr>
        `;
    }).join("");
}

function renderStock() {
    document.getElementById("stock-table").innerHTML = products.map(p => {
        const supplier = suppliers.find(s => s.id === p.fornecedor);
        let badge = p.estoque <= 0
            ? '<span class="badge red">Sem estoque</span>'
            : p.estoque <= 5
                ? '<span class="badge yellow">Estoque baixo</span>'
                : '<span class="badge green">Normal</span>';

        return `
            <tr>
                <td>${escapeHtml(p.nome)}</td>
                <td>${escapeHtml(supplier?.razao_social || "-")}</td>
                <td><strong>${p.estoque}</strong></td>
                <td>${badge}</td>
            </tr>
        `;
    }).join("");
}

function renderSuppliers() {
    document.getElementById("suppliers-table").innerHTML = suppliers.map(s => `
        <tr>
            <td>${s.id}</td>
            <td>${escapeHtml(s.razao_social)}</td>
            <td>${escapeHtml(s.cnpj)}</td>
            <td>${escapeHtml(s.email)}</td>
            <td>${escapeHtml(s.telefone)}</td>
        </tr>
    `).join("");
}

function renderCategories() {
    document.getElementById("categories-table").innerHTML = categories.map(c => `
        <tr>
            <td>${c.id}</td>
            <td>${escapeHtml(c.nome)}</td>
            <td>${escapeHtml(c.descricao)}</td>
        </tr>
    `).join("");
}

function renderStores() {
    document.getElementById("stores-table").innerHTML = stores.map(s => `
        <tr>
            <td>${s.id}</td>
            <td>${escapeHtml(s.nome)}</td>
            <td>${escapeHtml(s.tipo)}</td>
            <td>${escapeHtml(s.endereco)}</td>
        </tr>
    `).join("");
}

function renderSales() {
    const search = (document.getElementById("sales-search")?.value || "").toLowerCase();

    const filtered = sales.filter(s =>
        String(s.id).includes(search) ||
        getClientName(s.cliente).toLowerCase().includes(search)
    );

    document.getElementById("sales-table").innerHTML = filtered.length
        ? filtered.map(s => `
            <tr>
                <td>#${s.id}</td>
                <td>${new Date(s.data).toLocaleString("pt-BR")}</td>
                <td>${escapeHtml(getClientName(s.cliente))}</td>
                <td>${escapeHtml(getStoreName(s.loja))}</td>
                <td>${escapeHtml(s.canal)}</td>
                <td><strong>${money(s.total)}</strong></td>
                <td><span class="badge ${s.status === 'CONCLUIDO' ? 'green' : 'yellow'}">${escapeHtml(s.status)}</span></td>
            </tr>
        `).join("")
        : `<tr><td colspan="7" class="empty">Nenhuma venda encontrada.</td></tr>`;

    renderRecentSales();
}

function renderRecentSales() {
    const recent = [...sales].reverse().slice(0, 5);

    document.getElementById("recent-sales").innerHTML = recent.length
        ? recent.map(s => `
            <div class="recent-item">
                <div>
                    <strong>Venda #${s.id}</strong>
                    <small>${escapeHtml(getClientName(s.cliente))}</small>
                </div>
                <strong>${money(s.total)}</strong>
            </div>
        `).join("")
        : `<div class="empty">Nenhuma venda registrada.</div>`;
}

function renderPayments() {
    document.getElementById("payments-table").innerHTML = payments.length
        ? payments.map(p => `
            <tr>
                <td>${p.id}</td>
                <td>#${p.venda}</td>
                <td>${escapeHtml(p.forma)}</td>
                <td>${money(p.valor)}</td>
                <td><span class="badge green">${escapeHtml(p.status)}</span></td>
                <td>${new Date(p.data).toLocaleString("pt-BR")}</td>
            </tr>
        `).join("")
        : `<tr><td colspan="6" class="empty">Nenhum pagamento registrado.</td></tr>`;
}

function updateDashboard() {
    const today = new Date().toDateString();

    const todaySales = sales
        .filter(s => new Date(s.data).toDateString() === today)
        .reduce((sum, s) => sum + s.total, 0);

    document.getElementById("dash-sales").textContent = money(todaySales);
    document.getElementById("dash-products").textContent = products.length;
    document.getElementById("dash-clients").textContent = clients.length;
    document.getElementById("dash-low-stock").textContent =
        products.filter(p => p.estoque <= 5).length;
}

function updateSaleSelectors() {
    populateSelect("sale-client", clients, "Selecione o cliente", c => c.nome);
    populateSelect("sale-store", stores, "Selecione a loja", s => s.nome);

    const productSelect = document.getElementById("sale-product");
    productSelect.innerHTML = '<option value="">Selecione o produto</option>';

    products.forEach(p => {
        if (p.estoque > 0) {
            productSelect.innerHTML += `
                <option value="${p.id}">
                    ${escapeHtml(p.nome)} - ${money(p.preco)} (${p.estoque} disponíveis)
                </option>
            `;
        }
    });
}

function addSaleItem() {
    const productId = Number(document.getElementById("sale-product").value);
    const qty = Number(document.getElementById("sale-qty").value);

    if (!productId || qty <= 0) {
        toast("Selecione um produto e informe uma quantidade válida.", true);
        return;
    }

    const product = products.find(p => p.id === productId);

    if (!product) return;

    const existing = saleItems.find(item => item.produto === productId);
    const totalQty = (existing?.quantidade || 0) + qty;

    if (totalQty > product.estoque) {
        toast(`Estoque insuficiente. Disponível: ${product.estoque}`, true);
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
    const tbody = document.getElementById("sale-items");

    tbody.innerHTML = saleItems.length
        ? saleItems.map((item, index) => {
            const p = products.find(x => x.id === item.produto);
            return `
                <tr>
                    <td>${escapeHtml(p.nome)}</td>
                    <td>${item.quantidade}</td>
                    <td>${money(item.preco)}</td>
                    <td>${money(item.quantidade * item.preco)}</td>
                    <td><button class="icon-btn" onclick="removeSaleItem(${index})">🗑️</button></td>
                </tr>
            `;
        }).join("")
        : `<tr><td colspan="5" class="empty">Nenhum item adicionado.</td></tr>`;

    const total = saleItems.reduce((sum, item) => sum + item.quantidade * item.preco, 0);
    document.getElementById("sale-total").textContent = money(total);
}

async function finishSale() {
    const cliente = Number(document.getElementById("sale-client").value);
    const loja = Number(document.getElementById("sale-store").value);
    if (!cliente || !loja) return toast("Selecione o cliente e a loja.", true);
    if (!saleItems.length) return toast("Adicione pelo menos um produto à venda.", true);

    try {
        const r = await api("vendas", "POST", {
            cliente, loja,
            canal: document.getElementById("sale-channel").value,
            forma: document.getElementById("sale-payment").value,
            valorPago: val("sale-paid") || undefined,
            itens: saleItems.map(i => ({ produto: i.produto, quantidade: i.quantidade }))
        });
        saleItems = [];
        renderSaleItems();
        await loadAll();
        toast(`Venda #${r.id} realizada com sucesso!`);
    } catch (e) {
        toast(e.message, true);
        await loadAll();
    }
}

async function save(event, modal, path, body) {
    event.preventDefault();
    try {
        await api(path, "POST", body);
        event.target.reset();
        closeModal(modal);
        await loadAll();
        toast("Cadastrado com sucesso!");
    } catch (e) {
        toast(e.message, true);
    }
}

const val = id => document.getElementById(id).value;

function saveClient(event) {
    save(event, "client-modal", "clientes", { nome: val("client-name"), cpf: val("client-cpf"), email: val("client-email"), telefone: val("client-phone") });
}

function saveProduct(event) {
    save(event, "product-modal", "produtos", {
        nome: val("product-name"), categoria: Number(val("product-category")), loja: Number(val("product-store")),
        fornecedor: Number(val("product-supplier")), preco: Number(val("product-price")), estoque: Number(val("product-stock")),
        tendencia: document.getElementById("product-trend").checked, novidade: document.getElementById("product-new").checked
    });
}

function saveSupplier(event) {
    save(event, "supplier-modal", "fornecedores", { razao_social: val("supplier-name"), cnpj: val("supplier-cnpj"), email: val("supplier-email"), telefone: val("supplier-phone") });
}

function saveCategory(event) {
    save(event, "category-modal", "categorias", { nome: val("category-name"), descricao: val("category-description") });
}

function saveStore(event) {
    save(event, "store-modal", "lojas", { nome: val("store-name"), tipo: val("store-type"), endereco: val("store-address") });
}

function getClientName(id) {
    return clients.find(c => c.id === id)?.nome || "Cliente não encontrado";
}

function getStoreName(id) {
    return stores.find(s => s.id === id)?.nome || "Loja não encontrada";
}