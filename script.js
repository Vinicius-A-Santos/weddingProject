// ============================================================
// CONFIGURAÇÕES — EDITE COM SEUS DADOS
// ============================================================

// Pix para Lista de Presentes
const PIX_KEY  = "c226bc78-6091-45e4-a9e5-64b3727ac98e";
const PIX_NAME = "Vinicius e Amanda";
const PIX_CITY = "Curitiba";

// Pix separado para pagamento da Recepção (pode ser a mesma chave acima)
const PIX_KEY_RECEPCAO  = "78bd26c2-be7f-4c5e-9b64-2beba4b819b9";
const PIX_NAME_RECEPCAO = "Amanda e Vinicius";
const PIX_CITY_RECEPCAO = "Curitiba";

// Valor por adulto na recepção (crianças até 15 anos são gratuitas)
const VALOR_ADULTO = 50.00;

// Google Apps Script URL
// Para o RSVP funcionar, adicione em sua GAS:
//   if (body.action === "confirmarPresenca") → gravar numa aba "RSVP" com as colunas:
//   ID | Nome | Presença | Adultos | Crianças | Convidados | ValorTotal | Timestamp
const API_URL = "https://script.google.com/macros/s/AKfycbyh_Q-ptbOLWL_1vPd3lKurGv0ayw3Ei445UYkhYKU2uGd5s3s59rz85WXGZXpMDZbOpg/exec";


// ============================================================
// CONTAGEM REGRESSIVA
// ============================================================
const weddingDate = new Date("Nov 20, 2026 17:00:00").getTime();

const countdownTimer = setInterval(() => {
    const distance = weddingDate - Date.now();
    if (distance < 0) {
        clearInterval(countdownTimer);
        document.getElementById("countdown").innerHTML = "<span class='hoje'>É HOJE! ❤️</span>";
        return;
    }
    document.getElementById("days").textContent    = Math.floor(distance / 86400000).toString().padStart(2, '0');
    document.getElementById("hours").textContent   = Math.floor((distance % 86400000) / 3600000).toString().padStart(2, '0');
    document.getElementById("minutes").textContent = Math.floor((distance % 3600000) / 60000).toString().padStart(2, '0');
    document.getElementById("seconds").textContent = Math.floor((distance % 60000) / 1000).toString().padStart(2, '0');
}, 1000);


// ============================================================
// NAVEGAÇÃO: SMOOTH SCROLL + MENU HAMBURGUER
// ============================================================
const hamburger = document.getElementById("hamburger");
const navMenu   = document.getElementById("navMenu");

hamburger.addEventListener("click", () => {
    navMenu.classList.toggle("active");
    hamburger.classList.toggle("active");
});

document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        navMenu.classList.remove("active");
        hamburger.classList.remove("active");
        const target = document.querySelector(link.getAttribute('href'));
        if (target) {
            const offset = document.getElementById('header').offsetHeight;
            window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - offset, behavior: 'smooth' });
        }
    });
});

window.addEventListener('scroll', () => {
    const header = document.getElementById('header');
    if (window.scrollY > 50) {
        header.style.padding = '10px 0';
        header.style.backgroundColor = 'rgba(255,255,255,0.97)';
    } else {
        header.style.padding = '20px 0';
        header.style.backgroundColor = '#FFFFFF';
    }
});


// ============================================================
// LISTA DE PRESENTES (carregada do Google Sheets)
// ============================================================
let produtoSelecionado = {};

async function carregarProdutos() {
    const container = document.getElementById("listaPresentes");
    container.innerHTML = '<p class="loading-msg">Carregando presentes...</p>';
    try {
        const res     = await fetch(API_URL);
        const produtos = await res.json();
        container.innerHTML = "";
        produtos.forEach(prod => {
            const percentual = Math.min(100, ((prod.cotas - prod.disponiveis) / prod.cotas) * 100);
            const disponivel = prod.disponiveis > 0;
            const valorFmt   = Number(prod.valorCota).toFixed(2).replace('.', ',');
            const div = document.createElement("div");
            div.classList.add("gift-item");
            div.innerHTML = `
                <img src="images/${prod.nome}.jpeg" alt="${prod.nome}" loading="lazy" onerror="this.style.display='none'">
                <h4>${prod.nome}</h4>
                <p class="gift-price">R$ ${valorFmt} / cota</p>
                <p class="gift-available">${disponivel ? prod.disponiveis + ' cota(s) disponível(is)' : 'Esgotado'}</p>
                <div class="barra"><div class="progresso" style="width:${percentual}%"></div></div>
                ${disponivel
                    ? `<button class="btn-presentear" onclick="abrirModal('${prod.nome}', ${prod.valorCota}, ${prod.disponiveis})">Presentear ❤️</button>`
                    : `<button class="btn-presentear" disabled>Esgotado</button>`}
            `;
            container.appendChild(div);
        });
    } catch (err) {
        container.innerHTML = '<p class="error-msg">Não foi possível carregar a lista. Tente recarregar a página.</p>';
        console.error("Erro ao carregar presentes:", err);
    }
}


// ============================================================
// MODAL DE PRESENTES
// ============================================================
const modal         = document.getElementById("giftModal");
const modalGiftName = document.getElementById("modalGiftName");

function abrirModal(nome, valorCota, maxCotas) {
    produtoSelecionado = { nome, valorCota, maxCotas };
    modal.style.display = "block";
    document.body.style.overflow = "hidden";
    modalGiftName.textContent = nome;

    const form = document.getElementById("giftForm");
    form.innerHTML = `
        <input type="text" id="nomePessoa" placeholder="Seu Nome" required autocomplete="name">
        <div class="quotas-row">
            <input type="number" id="qtdCotas" placeholder="Qtd de cotas" min="1" max="${maxCotas}" step="1" value="1" required>
            <span class="quota-info">máx ${maxCotas}</span>
        </div>
        <p class="total-valor">Total: <strong id="totalValor">R$ ${Number(valorCota).toFixed(2).replace('.', ',')}</strong></p>
        <button type="button" class="btn-main btn-pix" onclick="mostrarPixPresente()">Gerar Pix Copia e Cola</button>
    `;

    const inputQtd = document.getElementById("qtdCotas");
    inputQtd.addEventListener("input", () => {
        let v = parseInt(inputQtd.value) || 1;
        if (v > maxCotas) { v = maxCotas; inputQtd.value = v; }
        if (v < 1)        { v = 1;        inputQtd.value = v; }
        document.getElementById("totalValor").textContent =
            "R$ " + (v * valorCota).toFixed(2).replace('.', ',');
    });

    inputQtd.addEventListener("keydown", e => {
        if (["e", "E", "+", "-", "."].includes(e.key)) e.preventDefault();
    });
}

function closeGiftModal() {
    modal.style.display = "none";
    document.body.style.overflow = "";
}

window.addEventListener("click", e => {
    if (e.target === modal) closeGiftModal();
});


// ============================================================
// PIX COPIA E COLA — padrão EMV/BR Code, 100% no frontend
// ============================================================
function gerarPixCopiaCola(valor, key, name, city) {
    function campo(id, conteudo) {
        const s = String(conteudo);
        return id + s.length.toString().padStart(2, '0') + s;
    }
    function semAcento(s) {
        return s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
    }
    const merchantInfo   = campo('00', 'BR.GOV.BCB.PIX') + campo('01', key);
    const txid           = ('TX' + Date.now().toString(36).toUpperCase()).substring(0, 25);
    const additionalData = campo('05', txid);
    const nomeFmt        = semAcento(name).substring(0, 25);
    const cidadeFmt      = semAcento(city).substring(0, 15);

    let payload = '';
    payload += campo('00', '01');
    payload += campo('26', merchantInfo);
    payload += campo('52', '0000');
    payload += campo('53', '986');
    payload += campo('54', valor.toFixed(2));
    payload += campo('58', 'BR');
    payload += campo('59', nomeFmt);
    payload += campo('60', cidadeFmt);
    payload += campo('62', additionalData);
    payload += '6304';
    payload += calcCRC16(payload);
    return payload;
}

function calcCRC16(str) {
    let crc = 0xFFFF;
    for (let i = 0; i < str.length; i++) {
        crc ^= str.charCodeAt(i) << 8;
        for (let j = 0; j < 8; j++) {
            crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
            crc &= 0xFFFF;
        }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
}

function copiarPix(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const text = input.value;
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => showToast("Código Pix copiado! ✓"));
    } else {
        input.select();
        input.setSelectionRange(0, 99999);
        document.execCommand("copy");
        showToast("Código Pix copiado! ✓");
    }
}


// ============================================================
// MODAL: PIX PARA LISTA DE PRESENTES
// ============================================================
function mostrarPixPresente() {
    const nome = document.getElementById("nomePessoa").value.trim();
    const qtd  = parseInt(document.getElementById("qtdCotas").value) || 1;

    if (!nome) {
        showToast("Por favor, informe seu nome.");
        document.getElementById("nomePessoa").focus();
        return;
    }
    if (qtd < 1 || qtd > produtoSelecionado.maxCotas) {
        showToast(`Escolha entre 1 e ${produtoSelecionado.maxCotas} cotas.`);
        return;
    }

    const valorTotal = produtoSelecionado.valorCota * qtd;
    const pixCode    = gerarPixCopiaCola(valorTotal, PIX_KEY, PIX_NAME, PIX_CITY);
    const valorFmt   = valorTotal.toFixed(2).replace('.', ',');

    document.getElementById("giftForm").innerHTML = `
        <div class="pix-box">
            <p class="pix-title">Código Pix Copia e Cola</p>
            <div class="pix-code-row">
                <input type="text" id="pixCodePresente" value="${pixCode}" readonly aria-label="Código Pix">
                <button type="button" onclick="copiarPix('pixCodePresente')" class="btn-copy">Copiar</button>
            </div>
            <p class="pix-valor">Valor: <strong>R$ ${valorFmt}</strong></p>
            <p class="pix-hint">Cole no app do banco em <strong>Pix → Copia e Cola</strong>.</p>
        </div>
        <button type="button" class="btn-main" onclick="confirmarPagamentoPresente('${nome}', ${qtd})">
            ✓ Já realizei o pagamento
        </button>
        <button type="button" class="btn-secondary"
            onclick="abrirModal('${produtoSelecionado.nome}', ${produtoSelecionado.valorCota}, ${produtoSelecionado.maxCotas})">
            ← Voltar
        </button>
    `;
}

async function confirmarPagamentoPresente(nome, cotas) {
    try {
        await fetch(API_URL, {
            method: "POST",
            body: JSON.stringify({ nome, produto: produtoSelecionado.nome, pagamento: "Pix", cotas })
        });
    } catch (e) {
        console.warn("Não foi possível registrar na planilha:", e);
    }
    closeGiftModal();
    showToast("Obrigado pelo presente! ❤️");
    setTimeout(carregarProdutos, 1500);
}


// ============================================================
// RSVP — CONFIRMAÇÃO DE PRESENÇA
// ============================================================

function initRsvpForm() {
    const form = document.getElementById("rsvpForm");
    if (!form) return;

    document.querySelectorAll('input[name="presenca"]').forEach(radio => {
        radio.addEventListener("change", onPresencaChange);
    });

    document.getElementById("qtdAdultos")?.addEventListener("input",  atualizarNomesConvidados);
    document.getElementById("qtdCriancas")?.addEventListener("input", atualizarNomesConvidados);

    document.getElementById("rsvpNome")?.addEventListener("blur", () => {
        const primeiro = document.querySelector('.nome-convidado[data-tipo="adulto"]');
        if (primeiro && !primeiro.value) {
            primeiro.value = document.getElementById("rsvpNome").value.trim();
        }
    });

    form.addEventListener("submit", submitRsvp);
}

function onPresencaChange() {
    const valor = document.querySelector('input[name="presenca"]:checked')?.value;
    const detalhes = document.getElementById("recepcaoDetails");
    const comRecepcao = valor === "recepcao" || valor === "ambos";

    if (comRecepcao) {
        detalhes.classList.add("show");
        atualizarNomesConvidados();
    } else {
        detalhes.classList.remove("show");
    }
}

function atualizarNomesConvidados() {
    const adultos  = parseInt(document.getElementById("qtdAdultos").value)  || 0;
    const criancas = parseInt(document.getElementById("qtdCriancas").value) || 0;

    // Atualiza o total sem forçar o valor no campo (permite apagar livremente no mobile)
    const total = adultos * VALOR_ADULTO;
    document.getElementById("totalRecepcaoValor").textContent =
        "R$ " + total.toFixed(2).replace('.', ',');

    // Só regenera os campos de nome quando os valores são válidos
    if (adultos < 0 || criancas < 0 || adultos + criancas > 40) return;

    const container = document.getElementById("nomesConvidados");
    const nomeResponsavel = document.getElementById("rsvpNome")?.value.trim() || "";
    container.innerHTML = '';

    for (let i = 0; i < adultos + criancas; i++) {
        const isAdulto    = i < adultos;
        const idx         = isAdulto ? i + 1 : i + 1 - adultos;
        const label       = isAdulto ? `Adulto ${idx}` : `Criança ${idx} (até 15 anos)`;
        const placeholder = isAdulto ? `Nome do adulto ${idx}` : `Nome da criança ${idx}`;
        const val         = (i === 0 && nomeResponsavel) ? nomeResponsavel : '';

        container.innerHTML += `
            <div class="form-group">
                <label>${label}</label>
                <input type="text" class="nome-convidado" data-tipo="${isAdulto ? 'adulto' : 'crianca'}"
                    placeholder="${placeholder}" value="${val}" autocomplete="off">
            </div>`;
    }
}

async function submitRsvp(e) {
    e.preventDefault();

    const nome     = document.getElementById("rsvpNome").value.trim();
    const presenca = document.querySelector('input[name="presenca"]:checked')?.value;

    if (!nome) {
        showToast("Por favor, informe seu nome.");
        document.getElementById("rsvpNome").focus();
        return;
    }
    if (!presenca) {
        showToast("Selecione uma opção de presença.");
        return;
    }

    const btn = document.getElementById("rsvpSubmitBtn");
    btn.disabled     = true;
    btn.textContent  = "Enviando...";

    const comRecepcao = presenca === "recepcao" || presenca === "ambos";
    let adultos = 0, criancas = 0, convidadosNomes = [], valorTotal = 0;

    if (comRecepcao) {
        adultos  = parseInt(document.getElementById("qtdAdultos").value)  || 0;
        criancas = parseInt(document.getElementById("qtdCriancas").value) || 0;

        if (adultos < 1) {
            showToast("Informe pelo menos 1 adulto para a recepção.");
            const campoAdultos = document.getElementById("qtdAdultos");
            campoAdultos.focus();
            campoAdultos.classList.add("input-erro");
            setTimeout(() => campoAdultos.classList.remove("input-erro"), 2500);
            btn.disabled    = false;
            btn.textContent = "Confirmar Presença";
            return;
        }
        valorTotal = adultos * VALOR_ADULTO;
        document.querySelectorAll(".nome-convidado").forEach(inp => {
            convidadosNomes.push(inp.value.trim() || "(não informado)");
        });
    }

    const rsvpId = "RSVP-" + Date.now().toString(36).toUpperCase().slice(-8);

    const payload = {
        action:     "confirmarPresenca",
        id:         rsvpId,
        nome,
        presenca,
        adultos,
        criancas,
        convidados: convidadosNomes.join("; "),
        valorTotal,
        timestamp:  new Date().toISOString()
    };

    // Envia para Google Sheets (fire-and-forget — não bloqueia a UX)
    fetch(API_URL, { method: "POST", body: JSON.stringify(payload) })
        .catch(err => console.warn("RSVP: falha ao registrar na planilha:", err));

    mostrarResultadoRsvp({ ...payload, convidadosNomes, comRecepcao });
}

const PRESENCA_TEXTO = {
    cerimonia: "Somente na cerimônia",
    recepcao:  "Somente na recepção",
    ambos:     "Cerimônia e recepção",
    nao:       "Infelizmente não poderá comparecer"
};

function mostrarResultadoRsvp(data) {
    const wrapper   = document.getElementById("rsvpFormWrapper");
    const resultado = document.getElementById("rsvpResultado");

    const naoComparece = data.presenca === "nao";
    let pixSection = "";

    if (data.comRecepcao) {
        const pixCode  = gerarPixCopiaCola(data.valorTotal, PIX_KEY_RECEPCAO, PIX_NAME_RECEPCAO, PIX_CITY_RECEPCAO);
        const valorFmt = data.valorTotal.toFixed(2).replace('.', ',');
        const cotaFmt  = VALOR_ADULTO.toFixed(2).replace('.', ',');

        pixSection = `
            <div class="resultado-pix">
                <h4>Pagamento da Recepção</h4>
                <p class="resultado-valor">
                    ${data.adultos} adulto(s) × R$ ${cotaFmt} =
                    <strong>R$ ${valorFmt}</strong>
                    ${data.criancas > 0 ? `<br><small>(${data.criancas} criança(s) isento(s))</small>` : ''}
                </p>
                <div class="pix-box">
                    <p class="pix-title">Código Pix Copia e Cola</p>
                    <div class="pix-code-row">
                        <input type="text" id="pixRsvpCode" value="${pixCode}" readonly aria-label="Pix recepção">
                        <button type="button" onclick="copiarPix('pixRsvpCode')" class="btn-copy">Copiar</button>
                    </div>
                    <p class="pix-hint">Cole no app do banco em <strong>Pix → Copia e Cola</strong>.</p>
                </div>
            </div>`;
    }

    resultado.innerHTML = `
        <div class="resultado-header">
            <span class="resultado-icone">${naoComparece ? '😢' : '🎉'}</span>
            <h3>${naoComparece ? 'Sentiremos sua falta!' : 'Presença confirmada!'}</h3>
            <p>${naoComparece
                ? 'Agradecemos por nos avisar. Esperamos contar com você em outros momentos!'
                : `Obrigado, <strong>${data.nome}</strong>! Mal podemos esperar para celebrar com você.`}
            </p>
        </div>

        <div class="resultado-id">
            <span class="id-label">ID de Confirmação</span>
            <span class="id-valor">${data.id}</span>
        </div>

        <p class="resultado-info">
            <strong>Opção:</strong> ${PRESENCA_TEXTO[data.presenca]}
        </p>

        ${pixSection}

        <button type="button" class="btn-secondary" style="margin-top:12px"
            onclick="document.getElementById('rsvpResultado').classList.add('hidden');
                     document.getElementById('rsvpFormWrapper').classList.remove('hidden');
                     document.getElementById('rsvpForm').reset();
                     document.getElementById('recepcaoDetails').classList.remove('show');">
            Fazer nova confirmação
        </button>
    `;

    wrapper.classList.add("hidden");
    resultado.classList.remove("hidden");
    resultado.scrollIntoView({ behavior: 'smooth', block: 'start' });
}


// ============================================================
// TOAST (NOTIFICAÇÃO DISCRETA)
// ============================================================
function showToast(msg) {
    let toast = document.getElementById("toast");
    if (!toast) {
        toast = document.createElement("div");
        toast.id = "toast";
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.classList.remove("show"), 3000);
}


// ============================================================
// INICIALIZAÇÃO
// ============================================================
initRsvpForm();
window.onload = carregarProdutos;
