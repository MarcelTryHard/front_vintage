const AUTH = (() => {
    let dados = null;

    try {
        dados = JSON.parse(localStorage.getItem("omni_auth"));
    } catch (e) {
        dados = null;
    }

    return {
        token: dados?.token || null,
        user: dados?.user || null,

        logout() {
            localStorage.removeItem("omni_auth");
            window.location.replace("login.html");
        }
    };
})();

if (!AUTH.token || !AUTH.user) {
    window.location.replace("login.html");
    throw new Error("Usuário não autenticado.");
}

const API_BASE =
    location.port === "3000"
        ? ""
        : "http://localhost:3000";

const fetchOriginal = window.fetch.bind(window);

window.fetch = async (url, options = {}) => {
    const urlString = String(url);
    const isApi = urlString.startsWith("/api/");

    if (isApi) {
        options = {
            ...options,
            headers: {
                ...(options.headers || {}),
                Authorization: "Bearer " + AUTH.token
            }
        };

        url = API_BASE + urlString;
    }

    const response = await fetchOriginal(url, options);

    if (isApi && response.status === 401) {
        AUTH.logout();
        return response;
    }

    return response;
};

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
            "produtos",
            "estoque",
            "clientes",
            "pagamentos",
            "pendencias"
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

function podeAcessar(secao) {
    const perfil = AUTH.user?.perfil;
    const configuracao = PERFIS[perfil];

    if (!configuracao) {
        return false;
    }

    if (configuracao.menu === null) {
        return true;
    }

    return configuracao.menu.includes(secao);
}

function verificarAcesso(secao) {
    if (!podeAcessar(secao)) {
        if (typeof toast === "function") {
            toast("Você não possui permissão para acessar esta área.", true);
        }

        return false;
    }

    return true;
}

document.addEventListener("DOMContentLoaded", () => {
    const perfil = AUTH.user?.perfil;
    const nome =
        AUTH.user?.nome ||
        AUTH.user?.login ||
        "Usuário";

    const configuracao = PERFIS[perfil];

    if (!configuracao) {
        AUTH.logout();
        return;
    }

    document.querySelectorAll(".nav-item").forEach(botao => {
        const secao = botao.dataset.section;

        if (
            configuracao.menu !== null &&
            !configuracao.menu.includes(secao)
        ) {
            botao.style.display = "none";
        }
    });

    const userName = document.getElementById("user-name");

    if (userName) {
        userName.textContent = nome;
    }

    const userRole = document.getElementById("user-role");

    if (userRole) {
        userRole.textContent = configuracao.nome;
    }

    const userAvatar = document.getElementById("user-avatar");

    if (userAvatar) {
        userAvatar.textContent =
            nome.charAt(0).toUpperCase();
    }

    const btnSair = document.getElementById("btn-sair");

    if (btnSair) {
        btnSair.addEventListener("click", () => {
            AUTH.logout();
        });
    }

    const nav = document.querySelector("nav");

    if (
        nav &&
        !document.getElementById("btn-alterar-senha")
    ) {
        const botaoSenha = document.createElement("button");

        botaoSenha.id = "btn-alterar-senha";
        botaoSenha.className = "logout-btn";
        botaoSenha.style.color = "#d1d5db";
        botaoSenha.textContent = "🔑 Alterar senha";

        botaoSenha.addEventListener("click", async () => {
            const atual = prompt("Senha atual:");

            if (atual === null) {
                return;
            }

            const nova = prompt(
                "Nova senha (mín. 6 caracteres):"
            );

            if (nova === null) {
                return;
            }

            if (nova.length < 6) {
                if (typeof toast === "function") {
                    toast(
                        "A nova senha deve ter pelo menos 6 caracteres.",
                        true
                    );
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
            } catch (error) {
                if (typeof toast === "function") {
                    toast(error.message, true);
                }
            }
        });

        nav.appendChild(botaoSenha);
    }
});