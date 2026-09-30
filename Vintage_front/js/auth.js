// ============================================================
// OMNISTORE - AUTENTICAÇÃO
// ============================================================

const AUTH = (() => {
    let d = null;

    try {
        d = JSON.parse(localStorage.getItem("omni_auth"));
    } catch (e) {
        d = null;
    }

    return {
        token: d?.token || null,
        user: d?.user || null,

        logout() {
            localStorage.removeItem("omni_auth");
            location.replace("login.html");
        }
    };
})();

if (!AUTH.token || !AUTH.user) {
    location.replace("login.html");
    throw new Error("Não autenticado");
}

const API_BASE = location.port === "3000"
    ? ""
    : "http://localhost:3000";

const fetchOriginal = window.fetch.bind(window);

window.fetch = async (url, options = {}) => {
    const isApi = String(url).startsWith("/api/");

    if (isApi) {
        options = {
            ...options,
            headers: {
                ...(options.headers || {}),
                Authorization: "Bearer " + AUTH.token
            }
        };

        url = API_BASE + url;
    }

    const response = await fetchOriginal(url, options);

    if (isApi && response.status === 401) {
        AUTH.logout();
    }

    return response;
};


// ============================================================
// PERMISSÕES DOS PERFIS
// ============================================================

const PERFIS = {
    ADMIN: {
        nome: "Administrador",
        menu: null
    },

    OPERADOR: {
        nome: "Operador / Caixa",
        menu: [
            "dashboard",
            "vendas",
            "estoque",
            "clientes",
            "pagamentos"
        ]
    },

    VENDEDOR: {
        nome: "Vendedor",
        menu: [
            "dashboard",
            "vendas",
            "clientes",
            "produtos"
        ]
    },

    LOJISTA: {
        nome: "Lojista",
        menu: [
            "dashboard",
            "produtos",
            "estoque",
            "vendas",
            "lojas",
            "categorias"
        ]
    },

    CLIENTE: {
        nome: "Cliente",
        menu: [
            "dashboard",
            "produtos",
            "extrato"
        ]
    }
};


// ============================================================
// CONFIGURAÇÃO DA INTERFACE
// ============================================================

document.addEventListener("DOMContentLoaded", () => {

    const perfil = AUTH.user.perfil;
    const nome = AUTH.user.nome || AUTH.user.login || "Usuário";
    const cfg = PERFIS[perfil];

    if (!cfg) {
        AUTH.logout();
        return;
    }

    document.querySelectorAll(".nav-item").forEach(botao => {

        const secao = botao.dataset.section;

        if (
            cfg.menu !== null &&
            !cfg.menu.includes(secao)
        ) {
            botao.style.display = "none";
        }

    });

    const userName = document.getElementById("user-name");
    const userRole = document.getElementById("user-role");
    const userAvatar = document.getElementById("user-avatar");

    if (userName) {
        userName.textContent = nome;
    }

    if (userRole) {
        userRole.textContent = cfg.nome;
    }

    if (userAvatar) {
        userAvatar.textContent = nome.charAt(0).toUpperCase();
    }

    const btnSair = document.getElementById("btn-sair");

    if (btnSair) {
        btnSair.addEventListener("click", () => {
            AUTH.logout();
        });
    }

    const nav = document.querySelector("nav");

    if (nav && !document.getElementById("btn-alterar-senha")) {

        const pass = document.createElement("button");

        pass.id = "btn-alterar-senha";
        pass.className = "logout-btn";
        pass.style.color = "#d1d5db";
        pass.textContent = "🔑 Alterar senha";

        pass.onclick = async () => {

            const atual = prompt("Senha atual:");

            if (atual === null) {
                return;
            }

            const nova = prompt("Nova senha (mín. 6 caracteres):");

            if (nova === null) {
                return;
            }

            if (nova.length < 6) {
                if (typeof toast === "function") {
                    toast("A nova senha deve ter pelo menos 6 caracteres.", true);
                }

                return;
            }

            try {

                await api("senha", "POST", {
                    atual,
                    nova
                });

                if (typeof toast === "function") {
                    toast("Senha alterada com sucesso!");
                }

            } catch (e) {

                if (typeof toast === "function") {
                    toast(e.message, true);
                }

            }
        };

        nav.appendChild(pass);
    }

});