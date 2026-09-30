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


const fillRows = (
    id,
    list,
    fn,
    cols
) => {

    const element =
        document.getElementById(id);

    if (!element) {
        return;
    }

    element.innerHTML = list.length
        ? list.map(fn).join("")
        : `
            <tr>
                <td colspan="${cols}" class="empty">
                    Nenhum registro.
                </td>
            </tr>
        `;

};


const statusBadge = status => `
    <span class="badge ${
        status === "CONCLUIDO"
            ? "green"
            : "yellow"
    }">
        ${escapeHtml(status)}
    </span>
`;


// ============================================================
// PENDÊNCIAS
// ============================================================

async function loadPendencias() {

    try {

        const list =
            await api("vendas/abertas");

        fillRows(
            "pending-table",
            list,
            v => `
                <tr>
                    <td>#${v.id}</td>

                    <td>
                        ${escapeHtml(v.cliente)}
                    </td>

                    <td>
                        ${money(v.total)}
                    </td>

                    <td>
                        ${money(v.pago)}
                    </td>

                    <td>
                        <strong>
                            ${money(v.restante)}
                        </strong>
                    </td>

                    <td>
                        <button
                            class="btn success"
                            onclick="openPay(
                                ${v.id},
                                ${v.restante}
                            )">
                            Receber
                        </button>
                    </td>
                </tr>
            `,
            6
        );

    } catch (e) {

        toast(e.message, true);

    }

}


// ============================================================
// CONTAS
// ============================================================

async function loadContas() {

    try {

        const list =
            await api("contas");

        fillRows(
            "accounts-table",
            list,
            c => `
                <tr>
                    <td>${c.tipo}</td>

                    <td>
                        ${escapeHtml(c.nome)}
                    </td>

                    <td>
                        ${escapeHtml(c.numero)}
                    </td>

                    <td>
                        <strong>
                            ${money(c.saldo)}
                        </strong>
                    </td>
                </tr>
            `,
            4
        );

    } catch (e) {

        toast(e.message, true);

    }

}


// ============================================================
// EXTRATO
// ============================================================

async function loadExtrato() {

    const id =
        AUTH.user.perfil === "CLIENTE"
            ? "me"
            : val("extrato-client");

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

        const r =
            await api(
                `clientes/${id}/extrato`
            );

        const conta =
            document.getElementById(
                "extrato-conta"
            );

        if (conta) {
            conta.textContent =
                `Conta ${r.conta.numero}`;
        }

        fillRows(
            "extrato-table",
            r.vendas,
            v => `
                <tr>
                    <td>#${v.id}</td>

                    <td>
                        ${new Date(v.data)
                            .toLocaleString("pt-BR")}
                    </td>

                    <td>
                        ${escapeHtml(v.loja)}
                    </td>

                    <td>
                        ${money(v.total)}
                    </td>

                    <td>
                        ${money(v.pago)}
                    </td>

                    <td>
                        ${statusBadge(v.status)}
                    </td>
                </tr>
            `,
            6
        );

    } catch (e) {

        toast(e.message, true);

    }

}


// ============================================================
// RELATÓRIOS
// ============================================================

async function loadRelatorios() {

    try {

        const r =
            await api("relatorios");

        const repCount =
            document.getElementById(
                "rep-count"
            );

        const repRevenue =
            document.getElementById(
                "rep-revenue"
            );

        const repReceived =
            document.getElementById(
                "rep-received"
            );

        const repTicket =
            document.getElementById(
                "rep-ticket"
            );

        if (repCount) {
            repCount.textContent = r.vendas;
        }

        if (repRevenue) {
            repRevenue.textContent =
                money(r.faturamento);
        }

        if (repReceived) {
            repReceived.textContent =
                money(r.recebido);
        }

        if (repTicket) {
            repTicket.textContent =
                money(r.ticket);
        }

        fillRows(
            "rep-products",
            r.topProdutos,
            p => `
                <tr>
                    <td>
                        ${escapeHtml(p.nome)}
                    </td>
                    <td>${p.qtd}</td>
                    <td>${money(p.total)}</td>
                </tr>
            `,
            3
        );

        fillRows(
            "rep-stores",
            r.porLoja,
            l => `
                <tr>
                    <td>
                        ${escapeHtml(l.nome)}
                    </td>
                    <td>${l.vendas}</td>
                    <td>${money(l.total)}</td>
                </tr>
            `,
            3
        );

        fillRows(
            "rep-methods",
            r.porForma,
            f => `
                <tr>
                    <td>
                        ${escapeHtml(f.forma)}
                    </td>
                    <td>${money(f.total)}</td>
                </tr>
            `,
            2
        );

    } catch (e) {

        toast(e.message, true);

    }

}


// ============================================================
// PAGAMENTO
// ============================================================

function openPay(id, restante) {

    document.getElementById("pay-sale").value = id;

    document.getElementById(
        "pay-value"
    ).value = restante;

    document.getElementById(
        "pay-value"
    ).max = restante;

    document.getElementById(
        "pay-title"
    ).textContent =
        `Receber pagamento - Venda #${id}`;

    openModal("pay-modal");

}


function savePay(event) {

    save(
        event,
        "pay-modal",
        "pagamentos",
        {
            venda: Number(
                val("pay-sale")
            ),

            forma:
                val("pay-method"),

            valor: Number(
                val("pay-value")
            )
        }
    );

}


// ============================================================
// ESTOQUE
// ============================================================

function saveStock(event) {

    save(
        event,
        "stock-modal",
        "estoque",
        {
            produto: Number(
                val("stock-product")
            ),

            fornecedor: Number(
                val("stock-supplier")
            ),

            quantidade: Number(
                val("stock-qty")
            )
        }
    );

}


// ============================================================
// CARREGADORES
// ============================================================

const loaders = {

    pendencias: loadPendencias,
    contas: loadContas,
    extrato: loadExtrato,
    relatorios: loadRelatorios,
    usuarios: loadUsuarios

};


const _showSection = showSection;

showSection = function (section) {

    _showSection(section);

    if (
        section === "extrato" &&
        AUTH.user.perfil !== "CLIENTE"
    ) {

        populateSelect(
            "extrato-client",
            clients,
            "Selecione o cliente",
            c => c.nome
        );

    }

    if (loaders[section]) {
        loaders[section]();
    }

};


// ============================================================
// MODAL DE ESTOQUE
// ============================================================

const _openModal = openModal;

openModal = function (id) {

    _openModal(id);

    if (id === "stock-modal") {

        populateSelect(
            "stock-product",
            products,
            "Selecione o produto",
            p => p.nome
        );

        populateSelect(
            "stock-supplier",
            suppliers,
            "Selecione um fornecedor",
            s => s.razao_social
        );

    }

};


// ============================================================
// CARREGAMENTO EXTRA
// ============================================================

const _loadAll = loadAll;

loadAll = async function () {

    await _loadAll();

    const active =
        document.querySelector(
            ".section.active"
        )?.id;

    if (active !== "extrato" && loaders[active]) {
        loaders[active]();
    }

};


// ============================================================
// USUÁRIOS
// ============================================================

async function loadUsuarios() {

    try {

        const users =
            await api("usuarios");

        fillRows(
            "users-table",
            users,
            u => `
                <tr>

                    <td>
                        ${escapeHtml(u.login)}
                    </td>

                    <td>
                        ${u.perfil}
                    </td>

                    <td>
                        ${escapeHtml(
                            u.cliente || "-"
                        )}
                    </td>

                    <td>
                        <span class="badge ${
                            u.ativo
                                ? "green"
                                : "red"
                        }">
                            ${
                                u.ativo
                                    ? "Ativo"
                                    : "Inativo"
                            }
                        </span>
                    </td>

                    <td>
                        <button
                            class="btn secondary"
                            onclick="toggleUser(
                                ${u.id},
                                ${u.ativo ? 0 : 1}
                            )">

                            ${
                                u.ativo
                                    ? "Desativar"
                                    : "Ativar"
                            }

                        </button>
                    </td>

                </tr>
            `,
            5
        );

    } catch (e) {

        toast(e.message, true);

    }

}


async function toggleUser(id, ativo) {

    try {

        await api(
            `usuarios/${id}/ativo`,
            "PUT",
            { ativo }
        );

        await loadUsuarios();

    } catch (e) {

        toast(e.message, true);

    }

}


function toggleUserClient() {

    const isClient =
        val("user-profile") === "CLIENTE";

    const wrap =
        document.getElementById(
            "user-client-wrap"
        );

    if (wrap) {
        wrap.style.display =
            isClient ? "flex" : "none";
    }

    if (isClient) {

        populateSelect(
            "user-client",
            clients,
            "Selecione o cliente",
            c => c.nome
        );

    }

}


function saveUser(event) {

    save(
        event,
        "user-modal",
        "usuarios",
        {
            login: val("user-login"),
            senha: val("user-pass"),
            perfil: val("user-profile"),
            id_cliente:
                Number(
                    val("user-client")
                ) || null
        }
    );

}


// ============================================================
// PERFIL CLIENTE
// ============================================================

if (AUTH.user.perfil === "CLIENTE") {

    loadAll = async function () {

        try {

            products =
                await api("produtos");

            renderProducts();

        } catch (e) {

            toast(
                "Falha ao carregar produtos: " +
                e.message,
                true
            );

        }

    };

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            showSection("produtos");

        }
    );

}