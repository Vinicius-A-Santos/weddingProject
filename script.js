// Contagem Regressiva
const weddingDate = new Date("Nov 20, 2026 18:00:00").getTime();

const countdownFunction = setInterval(function() {
    const now = new Date().getTime();
    const distance = weddingDate - now;

    const days = Math.floor(distance / (1000 * 60 * 60 * 24));
    const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((distance % (1000 * 60)) / 1000);

    document.getElementById("days").innerHTML = days.toString().padStart(2, '0');
    document.getElementById("hours").innerHTML = hours.toString().padStart(2, '0');
    document.getElementById("minutes").innerHTML = minutes.toString().padStart(2, '0');
    document.getElementById("seconds").innerHTML = seconds.toString().padStart(2, '0');

    if (distance < 0) {
        clearInterval(countdownFunction);
        document.getElementById("countdown").innerHTML = "É HOJE!";
    }
}, 1000);

// ============================================
// INTEGRAÇÃO MERCADO PAGO
// ============================================

// URL do seu Google Apps Script (será usada para criar preferências e gerar Pix)
const GOOGLE_APPS_SCRIPT_URL = "https://script.google.com/macros/s/SEU_DEPLOYMENT_ID/exec";

// Modal de Presentes
const modal = document.getElementById("giftModal");
const modalGiftName = document.getElementById("modalGiftName");

let produtoSelecionado = {};

function abrirModal(nome, valor, max, pix, cartao) {
  produtoSelecionado = { nome, valor, max, pix, cartao };

  modal.style.display = "block";
  modalGiftName.innerText = nome;

  const form = document.getElementById("giftForm");

  form.innerHTML = `
    <input type="text" id="nomePessoa" placeholder="Seu Nome" required>
    <input 
        type="number" 
        id="qtdCotas" 
        placeholder="Qtd de cotas (máx ${max})" 
        min="1" 
        max="${max}" 
        step="1"
        required
    >

    <button type="button" class="btn-main" onclick="finalizarCompraPix()">Pagar com Pix</button>
    <button type="button" class="btn-main" onclick="finalizarCompraCartao()">Pagar com Cartão</button>
  `;

  const inputQtd = document.getElementById("qtdCotas");

    inputQtd.addEventListener("input", () => {
    let valor = Number(inputQtd.value);

    // Se passar do máximo → volta pro máximo
    if (valor > produtoSelecionado.max) {
        inputQtd.value = produtoSelecionado.max;
    }

    // Se for menor que 1 → volta pra 1
    if (valor < 1) {
        inputQtd.value = 1;
    }
    });

    inputQtd.addEventListener("keydown", (e) => {
        if (["e", "E", "+", "-", "."].includes(e.key)) {
            e.preventDefault();
        }
    });
}

function closeGiftModal() {
    modal.style.display = "none";
}

// Fechar modal ao clicar fora dele
window.onclick = function(event) {
    if (event.target == modal) {
        closeGiftModal();
    }
}

// ============================================
// PAGAMENTO COM CARTÃO (Checkout Pro)
// ============================================
async function finalizarCompraCartao() {
  const nome = document.getElementById("nomePessoa").value;
  const qtd = Number(document.getElementById("qtdCotas").value);

  if (!nome || isNaN(qtd) || qtd < 1 || qtd > produtoSelecionado.max) {
    alert(`Escolha entre 1 e ${produtoSelecionado.max} cotas`);
    return;
  }

  const valorTotal = produtoSelecionado.valor * qtd;

  try {
    // Mostrar loading
    const btn = event.target;
    const btnText = btn.innerText;
    btn.innerText = "Processando...";
    btn.disabled = true;

    // Chamar Google Apps Script para criar preferência no Mercado Pago
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "createCheckoutPro",
        nome: nome,
        produto: produtoSelecionado.nome,
        valor: valorTotal,
        cotas: qtd
      })
    });

    const data = await response.json();

    if (data.success && data.checkoutUrl) {
      // Registrar a compra no Google Sheets
      await registrarCompra(nome, "Cartão", qtd);
      
      // Redirecionar para o Checkout Pro
      window.open(data.checkoutUrl, "_blank");
      closeGiftModal();
      carregarProdutos();
    } else {
      alert("Erro ao processar pagamento. Tente novamente.");
      btn.innerText = btnText;
      btn.disabled = false;
    }
  } catch (error) {
    console.error("Erro:", error);
    alert("Erro ao conectar com o servidor de pagamento.");
  }
}

// ============================================
// PAGAMENTO COM PIX (QR Code)
// ============================================
async function finalizarCompraPix() {
  const nome = document.getElementById("nomePessoa").value;
  const qtd = Number(document.getElementById("qtdCotas").value);

  if (!nome || isNaN(qtd) || qtd < 1 || qtd > produtoSelecionado.max) {
    alert(`Escolha entre 1 e ${produtoSelecionado.max} cotas`);
    return;
  }

  const valorTotal = produtoSelecionado.valor * qtd;

  try {
    // Mostrar loading
    const btn = event.target;
    const btnText = btn.innerText;
    btn.innerText = "Gerando QR Code...";
    btn.disabled = true;

    // Chamar Google Apps Script para gerar Pix dinâmico
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
      method: "POST",
      body: JSON.stringify({
        action: "createPixPayment",
        nome: nome,
        produto: produtoSelecionado.nome,
        valor: valorTotal,
        cotas: qtd
      })
    });

    const data = await response.json();

    if (data.success && data.qrCode) {
      // Mostrar modal com QR Code
      exibirModalPix(data, nome, qtd);
      btn.innerText = btnText;
      btn.disabled = false;
    } else {
      alert("Erro ao gerar QR Code. Tente novamente.");
      btn.innerText = btnText;
      btn.disabled = false;
    }
  } catch (error) {
    console.error("Erro:", error);
    alert("Erro ao conectar com o servidor de pagamento.");
  }
}

// Modal para exibir QR Code do Pix
function exibirModalPix(data, nome, qtd) {
  const pixModal = document.createElement("div");
  pixModal.className = "modal";
  pixModal.id = "pixModal";
  pixModal.style.display = "block";
  pixModal.innerHTML = `
    <div class="modal-content" style="max-width: 500px;">
      <span class="close" onclick="document.getElementById('pixModal').remove()">&times;</span>
      <h3>Pagamento com Pix</h3>
      <p><strong>Valor:</strong> R$ ${data.valor.toFixed(2)}</p>
      <p><strong>Produto:</strong> ${data.produto}</p>
      
      <div style="text-align: center; margin: 20px 0;">
        <img src="${data.qrCode}" alt="QR Code Pix" style="max-width: 300px; border: 2px solid #ddd; padding: 10px;">
      </div>
      
      <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <p><strong>Código Pix (copiar e colar):</strong></p>
        <div style="display: flex; gap: 10px;">
          <input type="text" id="pixCode" value="${data.pixCode}" readonly style="flex: 1; padding: 8px; border: 1px solid #ccc; border-radius: 4px;">
          <button onclick="copiarPixCode()" class="btn-main" style="padding: 8px 15px;">Copiar</button>
        </div>
      </div>
      
      <p style="color: #666; font-size: 14px;">Escaneie o QR Code com seu celular ou copie o código acima para fazer o pagamento.</p>
      
      <button onclick="confirmarPagamentoPix('${nome}', ${qtd})" class="btn-main" style="width: 100%; margin-top: 15px;">
        Confirmar Pagamento
      </button>
    </div>
  `;
  
  document.body.appendChild(pixModal);
  
  pixModal.onclick = function(event) {
    if (event.target == pixModal) {
      pixModal.remove();
    }
  }
}

function copiarPixCode() {
  const pixCode = document.getElementById("pixCode");
  pixCode.select();
  document.execCommand("copy");
  alert("Código Pix copiado!");
}

async function confirmarPagamentoPix(nome, qtd) {
  try {
    // Registrar a compra no Google Sheets
    await registrarCompra(nome, "Pix", qtd);
    
    alert("Obrigado pelo presente ❤️\n\nAguardando confirmação do pagamento...");
    document.getElementById("pixModal").remove();
    closeGiftModal();
    carregarProdutos();
  } catch (error) {
    console.error("Erro:", error);
    alert("Erro ao registrar o pagamento.");
  }
}

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

async function registrarCompra(nome, tipoPagamento, cotas) {
  const res = await fetch(GOOGLE_APPS_SCRIPT_URL, {
    method: "POST",
    body: JSON.stringify({
      action: "registrarCompra",
      nome: nome,
      produto: produtoSelecionado.nome,
      pagamento: tipoPagamento,
      cotas: cotas
    })
  });

  const resposta = await res.text();

  if (resposta === "ESGOTADO") {
    throw new Error("Esse presente já foi completado");
  }
}

// Navegação Suave (Smooth Scroll)
document.querySelectorAll('nav a').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        document.querySelector(targetId).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Efeito de transparência no header ao rolar
window.addEventListener('scroll', function() {
    const header = document.getElementById('header');
    if (window.scrollY > 50) {
        header.style.padding = '10px 0';
        header.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
    } else {
        header.style.padding = '20px 0';
        header.style.backgroundColor = '#FFFFFF';
    }
});

// API URL para carregar produtos
const API_URL = "https://script.google.com/macros/s/AKfycbyh_Q-ptbOLWL_1vPd3lKurGv0ayw3Ei445UYkhYKU2uGd5s3s59rz85WXGZXpMDZbOpg/exec";

async function carregarProdutos() {
  const res = await fetch(API_URL);
  const produtos = await res.json();

  const container = document.getElementById("listaPresentes");
  container.innerHTML = "";

  produtos.forEach(prod => {
    const percentual = ((prod.cotas - prod.disponiveis) / prod.cotas) * 100;

    const div = document.createElement("div");
    div.classList.add("gift-item");

    div.innerHTML = `
      <img src="images/${prod.nome}.jpeg" />
      <h4>${prod.nome}</h4>
      <p>R$ ${prod.valorCota} / cota</p>
      <p>${prod.disponiveis} disponíveis</p>

      <div class="barra">
        <div class="progresso" style="width:${percentual}%"></div>
      </div>

      ${
        prod.disponiveis > 0
          ? `<button class="btn-presentear" onclick="abrirModal('${prod.nome}', ${prod.valorCota}, ${prod.disponiveis}, '${prod.pix}', '${prod.cartao}')">
              Presentear
            </button>`
          : `<button class="btn-presentear" disabled>Esgotado</button>`
      }
    `;

    container.appendChild(div); 
  });
}

window.onload = carregarProdutos;
