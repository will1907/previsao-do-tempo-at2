let campoCidade = document.querySelector("#cidade");
let elementoMensagem = document.querySelector("#mensagem");
let elementoCidades = document.querySelector("#cidades");
let elementoPrevisao = document.querySelector("#previsao");

// Captura o Enter para buscar cidades
campoCidade.addEventListener("keydown", function (evento) {
  if (evento.key === "Enter") {
    buscarCidades();
  }
});

async function buscarCidades() {
  let nome = campoCidade.value.trim();

  if(nome == ""){
  elementoMensagem.textContent = "Digite o nome de uma cidade.";
  } else{
    elementoMensagem.textContent = "Buscando...";
    elementoCidades.innerHTML = "";
    elementoPrevisao.innerHTML = "";

    let resposta = await fetch(
      `geocoding-api.open-meteo.com/v1/search/${nome}`,
    );
    let dados = await resposta.json();

    if (resposta.ok) {
      for (let i = 0; i < dados.length; i++) {
        let elementoCidade = document.createElement("button");
        elementoCidade.type= "type";
        elementoCidade.textContent = `${dados[i].nome} - ${dados[i].estado}`;
        elementoCidade.classList.add("cidade");
        elementoCidade.addEventListener("click", function () {
          buscarPrevisao(dados[i].id);
        });
        elementoCidades.appendChild(elementoCidade);
      }
      elementoMensagem.textContent = `${dados.length} cidade(s) encontrada(s)`;
    } else {
      elementoMensagem.textContent = "nenhuma cidade localizada";
    }
  }
}



async function buscarPrevisao(id) {
  elementoPrevisao.textContent = "buscando...";

  let resposta = await fetch(
    `http://api.open-meteo.com/v1/forecast/${id}/`,
  );
  let dados = await resposta.json();

  if (resposta.ok) {
    let dias = `
                <article class="dia">
                    <p class= "data"> ${formatarData(dados.clima[0].data)}</p>
                    <p> ${dados.clima[0].condicao_desc}</p>
                    <div class= "temperaturas">
                      <span><strong>${dados.clima[0].min} °</strong>Mínima</span>
                      <span><strong>${dados.clima[0].max} °</strong>Máxima</span>
                    </div>
                    <p>Índice UV: ${dados.clima[0].indice_uv}</p>
                </article>
    `;

    elementoPrevisao.innerHTML = `
        <h2>${dados.cidade} - ${dados.estado}</h2>
        <div class="dias">${dias}</div>
 `;
    elementoCidades.innerHTML = "";
    elementoMensagem.textContent = "";
  } else {
    elementoMensagem.textContent = dados.message;
  }
}

function formatarData(data) {
  let partes = data.split("-");
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}
