const campoCidade = document.querySelector("#cidade");
const elementoMensagem = document.querySelector("#mensagem");
const elementoCidades = document.querySelector("#cidades");
const elementoPrevisao = document.querySelector("#previsao");

campoCidade?.addEventListener("keydown", function (evento) {
  if (evento.key === "Enter") {
    evento.preventDefault();
    buscarCidades();
  }
});

async function buscarCidades() {
  const nome = campoCidade.value.trim();

  if (!nome) {
    elementoMensagem.textContent = "Digite o nome de uma cidade.";
    return;
  }

  elementoMensagem.textContent = "Buscando . . .";
  elementoCidades.innerHTML = "";
  elementoPrevisao.innerHTML = "";

  try {
    const resposta = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(nome)}&count=10&language=pt&format=json`,
    );

    if (!resposta.ok) {
      throw new Error("Erro na requisição da API de geocodificação.");
    }

    const dados = await resposta.json();

    if (!Array.isArray(dados.results) || dados.results.length === 0) {
      elementoMensagem.textContent = "Nenhuma cidade encontrada.";
      return;
    }

    // Cria os botões para cada cidade encontrada
    dados.results.forEach((cidade) => {
      const elementoCidade = document.createElement("button");
      const estado = cidade.admin1 || cidade.country || "";

      elementoCidade.type = "button";
      elementoCidade.textContent = `${cidade.name}${estado ? ` - ${estado}` : ""}`;
      elementoCidade.classList.add("cidade");

      elementoCidade.addEventListener("click", function () {
        buscarPrevisao(cidade.latitude, cidade.longitude, cidade.name, estado);
      });

      elementoCidades.appendChild(elementoCidade);
    });

    elementoMensagem.textContent = `${dados.results.length} cidade(s) encontrada(s). Clique em uma para ver a previsão:`;
  } catch (erro) {
    console.error("Erro ao buscar cidades:", erro);
    elementoMensagem.textContent =
      "Não foi possível buscar cidades neste momento.";
  }
}

async function buscarPrevisao(latitude, longitude, cidade, estado) {
  elementoPrevisao.textContent = "Buscando previsão . . .";
  elementoCidades.innerHTML = "";
  elementoMensagem.textContent = "";

  try {
    const resposta = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weather_code,uv_index_max&timezone=auto&forecast_days=6`,
    );

    if (!resposta.ok) {
      throw new Error("Erro na requisição da API de previsão.");
    }

    const dados = await resposta.json();

    if (!dados.daily || !Array.isArray(dados.daily.time)) {
      elementoPrevisao.textContent =
        "Não foi possível carregar os dados da previsão.";
      return;
    }

    const diasHTML = dados.daily.time
      .map((data, indice) => {
        const condicao = descricaoClima(dados.daily.weather_code[indice]);
        const minima = Math.round(dados.daily.temperature_2m_min[indice]);
        const maxima = Math.round(dados.daily.temperature_2m_max[indice]);
        const indiceUv = Number(dados.daily.uv_index_max[indice] ?? 0).toFixed(
          1,
        );

        return `
          <article class="dia">
            <p class="data">${formatarData(data)}</p>
            <p>${condicao}</p>
            <div class="temperaturas">
              <span><strong>${minima} °C</strong> Mínima</span>
              <span><strong>${maxima} °C</strong> Máxima</span>
            </div>
            <p>Índice UV: ${indiceUv}</p>
          </article>
        `;
      })
      .join("");

    elementoPrevisao.innerHTML = `
      <h2>Previsão para ${cidade}${estado ? ` - ${estado}` : ""}</h2>
      <div class="dias">${diasHTML}</div>
    `;
  } catch (erro) {
    console.error("Erro ao buscar previsão:", erro);
    elementoPrevisao.textContent =
      "Não foi possível carregar a previsão do tempo.";
  }
}

function descricaoClima(codigo) {
  const condicoes = {
    0: "Céu limpo",
    1: "Parcialmente nublado",
    2: "Nublado",
    3: "Céu encoberto",
    45: "Nevoeiro",
    48: "Nevoeiro com geada",
    51: "Garoa leve",
    53: "Garoa moderada",
    55: "Garoa intensa",
    56: "Garoa gelada leve",
    57: "Garoa gelada intensa",
    61: "Chuva leve",
    63: "Chuva moderada",
    65: "Chuva forte",
    66: "Chuva gelada leve",
    67: "Chuva gelada intensa",
    71: "Neve leve",
    73: "Neve moderada",
    75: "Neve forte",
    77: "Grãos de neve",
    80: "Pancadas leves",
    81: "Pancadas moderadas",
    82: "Pancadas fortes",
    85: "Neve intensa",
    86: "Neve muito intensa",
    95: "Trovoadas",
    96: "Trovoadas com granizo",
    99: "Trovoadas com granizo intenso",
  };

  return condicoes[codigo] ?? "Clima variável";
}

function formatarData(data) {
  if (!data) return "";
  const partes = data.split("-");
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}
