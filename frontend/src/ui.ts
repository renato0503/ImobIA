import { db } from './firebase';
import { auth } from './firebase';
import { buscarImoveis, type BuscaFiltros } from './services/imoveis';
import type { Imovel } from './types';
import { entrarComEmail, criarConta, sair } from './main';

let autenticado = false;

const estadoFiltros: BuscaFiltros = {
  caracteristicas: [],
  finalidade: 'ambos',
};

const app = document.getElementById('app')!;

export function setAutenticado(val: boolean) {
  autenticado = val;
}

export function renderApp() {
  if (!autenticado) {
    renderLogin();
    return;
  }
  renderDashboard();
}

function renderLogin() {
  app.innerHTML = `
    <div class="login">
      <div class="login-box">
        <h1 class="logo">🏠 ImobIA</h1>
        <p class="tagline">Agregador imobiliário inteligente</p>
        <form id="form-login" novalidate>
          <label class="campo">
            <span>E-mail</span>
            <input id="login-email" type="email" placeholder="seu@email.com" autocomplete="email" required />
          </label>
          <label class="campo">
            <span>Senha</span>
            <input id="login-senha" type="password" placeholder="••••••••" autocomplete="current-password" required />
          </label>
          <p id="login-erro" class="erro"></p>
          <button type="submit" id="btn-entrar" class="btn btn-primary btn-block">Entrar</button>
          <button type="button" id="btn-criar-conta" class="btn btn-ghost">Criar conta</button>
        </form>
      </div>
    </div>
  `;

  const emailEl = document.getElementById('login-email') as HTMLInputElement;
  const senhaEl = document.getElementById('login-senha') as HTMLInputElement;
  const erroEl = document.getElementById('login-erro')!;
  const form = document.getElementById('form-login') as HTMLFormElement;

  const exibirErro = (msg: string) => {
    erroEl.textContent = msg;
  };

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const msg = await entrarComEmail(emailEl.value.trim(), senhaEl.value);
    if (msg) {
      exibirErro(msg);
      return;
    }
    erroEl.textContent = '';
    renderApp();
  });

  document.getElementById('btn-criar-conta')!.addEventListener('click', async () => {
    const msg = await criarConta(emailEl.value.trim(), senhaEl.value);
    if (msg) {
      exibirErro(msg);
      return;
    }
    erroEl.textContent = '';
    renderApp();
  });
}

function renderDashboard() {
  app.innerHTML = `
    <header class="topbar">
      <h1 class="logo">🏠 ImobIA</h1>
      <div class="topbar-actions">
        <button id="btn-copiar-resumo" class="btn btn-outline">Copiar resumo</button>
        <button id="btn-sair" class="btn btn-ghost">Sair</button>
      </div>
    </header>

    <main class="layout">
      <aside class="filtros">
        <h2>Filtros</h2>

        <label class="campo">
          <span>Finalidade</span>
          <select id="f-finalidade">
            <option value="todos">Todos</option>
            <option value="venda">Venda</option>
            <option value="aluguel">Aluguel</option>
            <option value="ambos">Venda ou Aluguel</option>
          </select>
        </label>

        <label class="campo">
          <span>Tipo de imóvel</span>
          <select id="f-tipo">
            <option value="">Qualquer</option>
            <option value="Casa">Casa</option>
            <option value="Apartamento">Apartamento</option>
            <option value="Kitnet">Kitnet</option>
            <option value="Terreno">Terreno</option>
            <option value="Sala Comercial">Sala Comercial</option>
            <option value="Cobertura">Cobertura</option>
            <option value="Casa em Condomínio">Casa em Condomínio</option>
          </select>
        </label>

        <label class="campo">
          <span>Bairro</span>
          <input id="f-bairro" type="text" placeholder="Ex: Centro" list="lista-bairros" />
          <datalist id="lista-bairros"></datalist>
        </label>

        <label class="campo">
          <span>Valor máximo (R$)</span>
          <input id="f-valor" type="number" min="0" placeholder="Ex: 3000" />
        </label>

        <div class="campo">
          <span>Diferenciais / Características</span>
          <div class="chips" id="chips-char"></div>
        </div>

        <button id="btn-buscar" class="btn btn-primary">Buscar</button>
        <button id="btn-limpar" class="btn btn-ghost">Limpar filtros</button>
      </aside>

      <section class="resultados">
        <div class="resultado-titulo">
          <h2 id="txt-contagem">Carregando imóveis...</h2>
        </div>
        <div id="cards" class="cards"></div>
      </section>
    </main>

    <div id="toast" class="toast"></div>
  `;

  const caracteristicasPossiveis = [
    'energia solar',
    'quintal',
    'piscina',
    '3 quartos',
    '4 quartos',
    '2 banheiros',
    'varanda',
    'churrasqueira',
    'garagem',
    'mobiliado',
    'ar condicionado',
    'ponto comercial',
    'vista mar',
    'condomínio fechado',
  ];

  const chipsContainer = document.getElementById('chips-char')!;
  caracteristicasPossiveis.forEach((c) => {
    const box = document.createElement('label');
    box.className = 'chip';
    box.innerHTML = `<input type="checkbox" value="${c}" class="chip-input" /> ${c}`;
    chipsContainer.appendChild(box);
  });

  const tipoEl = document.getElementById('f-tipo') as HTMLSelectElement;
  const bairroEl = document.getElementById('f-bairro') as HTMLInputElement;
  const valorEl = document.getElementById('f-valor') as HTMLInputElement;

  document.getElementById('btn-buscar')!.addEventListener('click', () => {
    const finalidadeSel = (document.getElementById('f-finalidade') as HTMLSelectElement).value;
    estadoFiltros.finalidade =
      finalidadeSel === 'todos' ? 'ambos' : (finalidadeSel as any);
    estadoFiltros.tipo = tipoEl.value || undefined;
    estadoFiltros.bairro = bairroEl.value || undefined;
    const valor = parseFloat(valorEl.value);
    estadoFiltros.valorMaximo = isNaN(valor) ? undefined : valor;
    estadoFiltros.caracteristicas = Array.from(
      document.querySelectorAll<HTMLInputElement>('.chip-input:checked')
    ).map((i) => i.value);
    executarBusca();
  });

  document.getElementById('btn-limpar')!.addEventListener('click', () => {
    (document.getElementById('f-finalidade') as HTMLSelectElement).value = 'todos';
    tipoEl.value = '';
    bairroEl.value = '';
    valorEl.value = '';
    document.querySelectorAll('.chip-input').forEach((c) => ((c as HTMLInputElement).checked = false));
    estadoFiltros.finalidade = 'ambos';
    estadoFiltros.tipo = undefined;
    estadoFiltros.bairro = undefined;
    estadoFiltros.valorMaximo = undefined;
    estadoFiltros.caracteristicas = [];
    executarBusca();
  });

  document.getElementById('btn-sair')!.addEventListener('click', sair);
  document.getElementById('btn-copiar-resumo')!.addEventListener('click', copiarResumo);

  executarBusca();
}

let ultimosResultados: Imovel[] = [];

async function executarBusca() {
  const cardsEl = document.getElementById('cards')!;
  const contagemEl = document.getElementById('txt-contagem')!;
  contagemEl.textContent = 'Buscando...';
  cardsEl.innerHTML = '<p class="vazio">Carregando imóveis...</p>';

  try {
    const imoveis = await buscarImoveis(db, estadoFiltros);
    ultimosResultados = imoveis;
    contagemEl.textContent = `${imoveis.length} imóvel(is) encontrados`;
    renderCards(cardsEl, imoveis);
  } catch (err) {
    console.error(err);
    contagemEl.textContent = 'Erro ao buscar';
    cardsEl.innerHTML = `<p class="vazio">Erro ao buscar imóveis. Verifique as configurações do Firebase e as regras de segurança.</p>`;
  }
}

function renderCards(el: HTMLElement, imoveis: Imovel[]) {
  if (imoveis.length === 0) {
    el.innerHTML = '<p class="vazio">Nenhum imóvel encontrado com esses filtros.</p>';
    return;
  }

  el.innerHTML = imoveis
    .map((im) => {
      const foto = im.fotos && im.fotos.length > 0 ? im.fotos[0] : null;
      const valor = im.finalidade === 'aluguel'
        ? im.valor_aluguel
        : im.finalidade === 'venda'
        ? im.valor_venda
        : im.valor_venda ?? im.valor_aluguel;
      const valorTxt = valor
        ? `R$ ${valor.toLocaleString('pt-BR')}`
        : 'Sob consulta';

      return `
      <article class="card" data-id="${im.id}">
        <div class="card-foto">
          ${
            foto
              ? `<img src="${foto}" alt="${im.tipo}" loading="lazy" />`
              : '<div class="sem-foto">Sem foto</div>'
          }
        </div>
        <div class="card-corpo">
          <div class="card-topo">
            <h3>${im.tipo} - ${im.bairro}</h3>
            <span class="tag finalidade">${finalidadeLabel(im.finalidade)}</span>
          </div>
          <p class="card-valor">${valorTxt}</p>
          <div class="card-chars">
            ${(im.caracteristicas ?? [])
              .map((c) => `<span class="tag">${c}</span>`)
              .join('')}
          </div>
          ${
            im.contato_nome
              ? `<p class="card-contato">👤 ${im.contato_nome}${
                  im.contato_telefone ? ` · ${im.contato_telefone}` : ''
                }</p>`
              : ''
          }
          ${
            im.descricao
              ? `<p class="card-desc">${im.descricao}</p>`
              : ''
          }
          <div class="card-acoes">
            <button class="btn btn-small copy-one" onclick="window.copiarUm('${im.id}')">📋 Copiar resumo</button>
          </div>
        </div>
      </article>
    `;
    })
    .join('');
}

function finalidadeLabel(f: string) {
  const map: Record<string, string> = {
    venda: 'Venda',
    aluguel: 'Aluguel',
    ambos: 'Venda ou Aluguel',
  };
  return map[f] ?? f;
}

function resumoDoImovel(im: Imovel): string {
  const valor =
    im.finalidade === 'aluguel'
      ? im.valor_aluguel
      : im.finalidade === 'venda'
      ? im.valor_venda
      : im.valor_venda ?? im.valor_aluguel;
  const valorTxt = valor ? `R$ ${valor.toLocaleString('pt-BR')}` : 'Sob consulta';
  return `🏠 ${im.tipo} em ${im.bairro} (${finalidadeLabel(im.finalidade)})\n💵 ${valorTxt}\n✨ ${(im.caracteristicas ?? []).join(', ')}\n${im.descricao ?? ''}`.trim();
}

function copiarResumo() {
  const primeira = ultimosResultados[0];
  if (!primeira) {
    mostrarToast('Nenhum resultado para copiar.');
    return;
  }
  navigator.clipboard.writeText(resumoDoImovel(primeira)).then(() => {
    mostrarToast('Resumo copiado para a área de transferência!');
  });
}

function mostrarToast(msg: string) {
  const toast = document.getElementById('toast')!;
  toast.textContent = msg;
  toast.classList.add('visivel');
  setTimeout(() => toast.classList.remove('visivel'), 2500);
}

declare global {
  interface Window {
    copiarUm: (id: string) => void;
  }
}

window.copiarUm = (id: string) => {
  const im = ultimosResultados.find((i) => i.id === id);
  if (!im) return;
  navigator.clipboard.writeText(resumoDoImovel(im)).then(() => {
    mostrarToast('Resumo copiado!');
  });
};

export { auth };
