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
        document.getElementById("countdown").innerHTML = "É HOJE!
// ===============
// Modal de Presentes
const modal = document.getElementById("giftModal");
const modalGiftName = document.getElementById("modalGiftName");

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

    <button type="button" class="btn-main" onclick="finalizarCompra('Pix')">Pagar com Pix</button>
    <button type="button" class="btn-main" onclick="finalizarCompra('Cartão')">Pagar com Cartão</button>
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

// Lógica de envio do formulário de presentes (Exemplo)
document.getElementById("giftForm").onsubmit = function(e) {
    e.preventDefault();
    const name = e.target.querySelector('input[type="text"]').value;
    const gift = modalGiftName.innerText;
    
    alert(`Obrigado, ${name}! Você escolheu presentear com: ${gift}. \n\n(Nesta parte, os dados seriam enviados para o seu Google Sheets via API)`);
    closeGiftModal();
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


const API_URL = "https://script.google.com/macros/s/AKfycbyh_Q-ptbOLWL_1vPd3lKurGv0ayw3Ei445UYkhYKU2uGd5s3s59rz85WXGZXpMDZbOpg/exec";

let produtoSelecionado = {};

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

async function finalizarCompra(tipo) {
  const nome = document.getElementById("nomePessoa").value;
  const qtd = Number(document.getElementById("qtdCotas").value);

  if (!nome || isNaN(qtd) || qtd < 1 || qtd > produtoSelecionado.max) {
    alert(`Escolha entre 1 e ${produtoSelecionado.max} cotas`);
    return;
  }

  const link = tipo === "Pix"
    ? produtoSelecionado.pix
    : produtoSelecionado.cartao;

  window.open(link, "_blank");

  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      nome,
      produto: produtoSelecionado.nome,
      pagamento: tipo,
      cotas: qtd
    })
  });

  const resposta = await res.text();

  if (resposta === "ESGOTADO") {
    alert("Ops! Esse presente já foi completado 😢");
  } else {
    alert("Obrigado pelo presente ❤️");
  }

  closeGiftModal();
  carregarProdutos();
}

window.onload = carregarProdutos; presente já foi completado 😢");
  } else {
    alert("Obrigado pelo presente ❤️");
  }

  closeGiftModal();
  carregarProdutos();
}

window.onload = carregarProdutos;