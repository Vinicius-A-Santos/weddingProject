// ============================================================
// GOOGLE APPS SCRIPT — Casamento Amanda & Vinicius
// Abas necessárias na planilha:
//   • Itens       → colunas: Nome | Valor | TotalCotas | ValorCota
//   • Compras     → colunas: Data | Nome | Produto | Pagamento | Cotas
//   • Confirmação → colunas: Data | ID | Nome | Presença | Adultos | Crianças | Convidados | ValorTotal
// ============================================================

// ============================================================
// doGet — retorna lista de itens com cotas disponíveis
// ============================================================
function doGet() {
  const ss          = SpreadsheetApp.getActiveSpreadsheet();
  const itensSheet  = ss.getSheetByName("Itens");
  const comprasSheet = ss.getSheetByName("Compras");

  const itensData   = itensSheet.getDataRange().getValues();
  const comprasData = comprasSheet.getDataRange().getValues();

  const itens = [];

  for (let i = 1; i < itensData.length; i++) {
    const nome       = itensData[i][0];
    const totalCotas = Number(itensData[i][2]);

    let cotasCompradas = 0;
    for (let j = 1; j < comprasData.length; j++) {
      if (comprasData[j][2] === nome) {
        cotasCompradas += Number(comprasData[j][4] || 0);
      }
    }

    itens.push({
      nome:        nome,
      valor:       itensData[i][1],
      cotas:       totalCotas,
      valorCota:   itensData[i][3],
      disponiveis: Math.max(0, totalCotas - cotasCompradas)
    });
  }

  return ContentService
    .createTextOutput(JSON.stringify(itens))
    .setMimeType(ContentService.MimeType.JSON);
}

// ============================================================
// doPost — processa ações enviadas pelo site
// ============================================================
function doPost(e) {
  const dados = JSON.parse(e.postData.contents);

  // ——— Registrar compra de presente ———————————————————————
  if (!dados.action || dados.action === "registrarCompra") {
    return registrarCompra(dados);
  }

  // ——— Confirmar presença no evento ————————————————————————
  if (dados.action === "confirmarPresenca") {
    return confirmarPresenca(dados);
  }

  return ContentService.createTextOutput("ACAO_DESCONHECIDA");
}

// ============================================================
// REGISTRAR COMPRA DE PRESENTE
// ============================================================
function registrarCompra(dados) {
  const ss           = SpreadsheetApp.getActiveSpreadsheet();
  const itensSheet   = ss.getSheetByName("Itens");
  const comprasSheet = ss.getSheetByName("Compras");

  const itensData   = itensSheet.getDataRange().getValues();
  const comprasData = comprasSheet.getDataRange().getValues();

  // Busca o total de cotas do item
  let totalCotas = 0;
  for (let i = 1; i < itensData.length; i++) {
    if (itensData[i][0] === dados.produto) {
      totalCotas = Number(itensData[i][2]);
      break;
    }
  }

  // Soma cotas já compradas
  let cotasCompradas = 0;
  for (let i = 1; i < comprasData.length; i++) {
    if (comprasData[i][2] === dados.produto) {
      cotasCompradas += Number(comprasData[i][4] || 0);
    }
  }

  // Valida disponibilidade
  if (cotasCompradas + Number(dados.cotas) > totalCotas) {
    return ContentService.createTextOutput("ESGOTADO");
  }

  comprasSheet.appendRow([
    new Date(),
    dados.nome,
    dados.produto,
    dados.pagamento || "Pix",
    dados.cotas
  ]);

  return ContentService.createTextOutput("OK");
}

// ============================================================
// CONFIRMAR PRESENÇA NO EVENTO (grava na aba "Confirmação")
// ============================================================
function confirmarPresenca(dados) {
  const ss                  = SpreadsheetApp.getActiveSpreadsheet();
  const confirmacaoSheet    = ss.getSheetByName("Confirmacao");

  // Cria o cabeçalho automaticamente se a aba estiver vazia
  if (confirmacaoSheet.getLastRow() === 0) {
    confirmacaoSheet.appendRow([
      "Data/Hora", "ID", "Nome", "Presença", "Adultos", "Crianças", "Convidados", "Valor Total (R$)"
    ]);
    confirmacaoSheet.getRange(1, 1, 1, 8).setFontWeight("bold");
  }

  const presencaTexto = {
    cerimonia: "Somente na cerimônia",
    recepcao:  "Somente na recepção",
    ambos:     "Cerimônia e recepção",
    nao:       "Não comparecerá"
  };

  confirmacaoSheet.appendRow([
    new Date(),
    dados.id        || "",
    dados.nome      || "",
    presencaTexto[dados.presenca] || dados.presenca || "",
    dados.adultos   || 0,
    dados.criancas  || 0,
    dados.convidados || "",
    dados.valorTotal || 0
  ]);

  return ContentService.createTextOutput("OK");
}
