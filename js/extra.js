// ============================================================
// OMNISTORE - TELAS NOVAS: Contas, Pendências, Extrato, Relatórios, Entrada de estoque
// Carregado depois do script.js (compartilha suas funções globais)
// ============================================================
Object.assign(titles, {
    pendencias: ["Pendências", "Liquidação de pagamentos em aberto"],
    contas: ["Contas", "Saldo financeiro de lojas e clientes"],
    extrato: ["Extrato", "Histórico de compras do cliente"],
    relatorios: ["Relatórios", "Indicadores de vendas e financeiro"]
});

const fillRows = (id, list, fn, cols) => {
    document.getElementById(id).innerHTML = list.length
        ? list.map(fn).join("")
        : `<tr><td colspan="${cols}" class="empty">Nenhum registro.</td></tr>`;
};
const statusBadge = s => `<span class="badge ${s === "CONCLUIDO" ? "green" : "yellow"}">${escapeHtml(s)}</span>`;

async function loadPendencias() {
    try {
        const list = await api("vendas/abertas");
        fillRows("pending-table", list, v => `
            <tr><td>#${v.id}</td><td>${escapeHtml(v.cliente)}</td><td>${money(v.total)}</td>
            <td>${money(v.pago)}</td><td><strong>${money(v.restante)}</strong></td>
            <td><button class="btn success" onclick="openPay(${v.id}, ${v.restante})">Receber</button></td></tr>`, 6);
    } catch (e) { toast(e.message, true); }
}

async function loadContas() {
    try {
        fillRows("accounts-table", await api("contas"), c => `
            <tr><td>${c.tipo}</td><td>${escapeHtml(c.nome)}</td><td>${escapeHtml(c.numero)}</td>
            <td><strong>${money(c.saldo)}</strong></td></tr>`, 4);
    } catch (e) { toast(e.message, true); }
}

async function loadExtrato() {
    const id = val("extrato-client");
    if (!id) {
        document.getElementById("extrato-conta").textContent = "Selecione um cliente";
        return fillRows("extrato-table", [], () => "", 6);
    }
    try {
        const r = await api(`clientes/${id}/extrato`);
        document.getElementById("extrato-conta").textContent = `Conta ${r.conta.numero}`;
        fillRows("extrato-table", r.vendas, v => `
            <tr><td>#${v.id}</td><td>${new Date(v.data).toLocaleString("pt-BR")}</td><td>${escapeHtml(v.loja)}</td>
            <td>${money(v.total)}</td><td>${money(v.pago)}</td><td>${statusBadge(v.status)}</td></tr>`, 6);
    } catch (e) { toast(e.message, true); }
}

async function loadRelatorios() {
    try {
        const r = await api("relatorios");
        document.getElementById("rep-count").textContent = r.vendas;
        document.getElementById("rep-revenue").textContent = money(r.faturamento);
        document.getElementById("rep-received").textContent = money(r.recebido);
        document.getElementById("rep-ticket").textContent = money(r.ticket);
        fillRows("rep-products", r.topProdutos, p => `<tr><td>${escapeHtml(p.nome)}</td><td>${p.qtd}</td><td>${money(p.total)}</td></tr>`, 3);
        fillRows("rep-stores", r.porLoja, l => `<tr><td>${escapeHtml(l.nome)}</td><td>${l.vendas}</td><td>${money(l.total)}</td></tr>`, 3);
        fillRows("rep-methods", r.porForma, f => `<tr><td>${escapeHtml(f.forma)}</td><td>${money(f.total)}</td></tr>`, 2);
    } catch (e) { toast(e.message, true); }
}

function openPay(id, restante) {
    document.getElementById("pay-sale").value = id;
    document.getElementById("pay-value").value = restante;
    document.getElementById("pay-value").max = restante;
    document.getElementById("pay-title").textContent = `Receber pagamento - Venda #${id}`;
    openModal("pay-modal");
}
function savePay(event) {
    save(event, "pay-modal", "pagamentos", { venda: Number(val("pay-sale")), forma: val("pay-method"), valor: Number(val("pay-value")) });
}
function saveStock(event) {
    save(event, "stock-modal", "estoque", { produto: Number(val("stock-product")), fornecedor: Number(val("stock-supplier")), quantidade: Number(val("stock-qty")) });
}

// ---- integra com as funções existentes ----
const loaders = { pendencias: loadPendencias, contas: loadContas, extrato: loadExtrato, relatorios: loadRelatorios };

const _showSection = showSection;
showSection = function (section) {
    _showSection(section);
    if (section === "extrato") populateSelect("extrato-client", clients, "Selecione o cliente", c => c.nome);
    loaders[section]?.();
};

const _openModal = openModal;
openModal = function (id) {
    _openModal(id);
    if (id === "stock-modal") {
        populateSelect("stock-product", products, "Selecione o produto", p => p.nome);
        populateSelect("stock-supplier", suppliers, "Selecione o fornecedor", s => s.razao_social);
    }
};

const _loadAll = loadAll;
loadAll = async function () {
    await _loadAll();
    const active = document.querySelector(".section.active")?.id;
    if (active !== "extrato") loaders[active]?.();
};