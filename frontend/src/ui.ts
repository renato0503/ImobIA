import { db } from './firebase';
import { auth, analytics, storage } from './firebase';
import {
  buscarImoveis,
  listarBairros,
  PAGINA_PADRAO,
  type BuscaFiltros,
} from './services/imoveis';
import { enviarFoto, ErroFoto } from './services/fotos';
import { ehAdmin } from './services/usuarios';
import { updateDoc, doc } from 'firebase/firestore';
import type { Imovel } from './types';
import { entrarComEmail, criarConta, sair } from './main';

let ultimosResultados: Imovel[] = [];
let usuarioAdmin = false;

const estadoFiltros: BuscaFiltros = {
  caracteristicas: [],
  finalidade: 'ambos',
};

const app = document.getElementById('app')!;

export function renderLogin() {
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
  });

  document.getElementById('btn-criar-conta')!.addEventListener('click', async () => {
    const msg = await criarConta(emailEl.value.trim(), senhaEl.value);
    if (msg) {
      exibirErro(msg);
      return;
    }
    erroEl.textContent = '';
  });
}

export function renderDashboard() {
  ehAdmin(db).then((admin) => {
    usuarioAdmin = admin;
  });

  app.innerHTML = `
    <header class="topbar">
      <h1 class="logo">🏠 ImobIA</h1>
      <div class="topbar-actions">
        ${usuarioAdmin ? '<span class="tag finalidade">Admin</span>' : ''}
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

        <div class="campo">
          <span>Faixa de valor (R$)</span>
          <div class="linha-2">
            <input id="f-valor-min" type="number" min="0" placeholder="Mínimo" />
            <input id="f-valor-max" type="number" min="0" placeholder="Máximo" />
          </div>
        </div>

        <label class="campo">
          <span>Ordenação</span>
          <select id="f-ordem">
            <option value="recentes">Mais recentes</option>
            <option value="menor-preco">Menor valor</option>
            <option value="maior-preco">Maior valor</option>
          </select>
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
        <button id="btn-mais" class="btn btn-outline btn-mais" style="display:none">
          Carregar mais
        </button>
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
  const valorMinEl = document.getElementById('f-valor-min') as HTMLInputElement;
  const valorMaxEl = document.getElementById('f-valor-max') as HTMLInputElement;
  const ordemEl = document.getElementById('f-ordem') as HTMLSelectElement;

  carregarBairros();

  document.getElementById('btn-buscar')!.addEventListener('click', () => {
    const finalidadeSel = (document.getElementById('f-finalidade') as HTMLSelectElement).value;
    estadoFiltros.finalidade =
      finalidadeSel === 'todos' ? 'ambos' : (finalidadeSel as any);
    estadoFiltros.tipo = tipoEl.value || undefined;
    estadoFiltros.bairro = bairroEl.value || undefined;
    const min = parseFloat(valorMinEl.value);
    const max = parseFloat(valorMaxEl.value);
    estadoFiltros.valorMinimo = isNaN(min) ? undefined : min;
    estadoFiltros.valorMaximo = isNaN(max) ? undefined : max;
    estadoFiltros.ordenacao = (ordemEl.value as any) || 'recentes';
    estadoFiltros.caracteristicas = Array.from(
      document.querySelectorAll<HTMLInputElement>('.chip-input:checked')
    ).map((i) => i.value);
    paginarReset = true;
    executarBusca();
  });

  document.getElementById('btn-limpar')!.addEventListener('click', () => {
    (document.getElementById('f-finalidade') as HTMLSelectElement).value = 'todos';
    tipoEl.value = '';
    bairroEl.value = '';
    valorMinEl.value = '';
    valorMaxEl.value = '';
    ordemEl.value = 'recentes';
    document.querySelectorAll('.chip-input').forEach((c) => ((c as HTMLInputElement).checked = false));
    estadoFiltros.finalidade = 'ambos';
    estadoFiltros.tipo = undefined;
    estadoFiltros.bairro = undefined;
    estadoFiltros.valorMinimo = undefined;
    estadoFiltros.valorMaximo = undefined;
    estadoFiltros.ordenacao = 'recentes';
    estadoFiltros.caracteristicas = [];
    paginarReset = true;
    executarBusca();
  });

  document.getElementById('btn-sair')!.addEventListener('click', sair);
  document.getElementById('btn-copiar-resumo')!.addEventListener('click', copiarResumo);

  const btnMais = document.getElementById('btn-mais')!;
  btnMais.addEventListener('click', () => {
    estadoFiltros.limite = (estadoFiltros.limite ?? PAGINA_PADRAO) + PAGINA_PADRAO;
    executarBusca(true);
  });

  executarBusca();
}

// Delegação de evento para os inputs de foto (os cards são re-renderizados).
document.addEventListener('change', async (ev) => {
  const input = ev.target as HTMLInputElement;
  if (!input.classList.contains('foto-input')) return;

  const imovelId = input.dataset.id;
  const arquivo = input.files?.[0];
  if (!imovelId || !arquivo) return;

  mostrarToast('Enviando foto...');
  try {
    const url = await enviarFoto(storage, imovelId, arquivo);

    // Anexa a URL ao array 'fotos' do imóvel no Firestore
    const imovel = ultimosResultados.find((i) => i.id === imovelId);
    const fotos = [...(imovel?.fotos ?? []), url];
    await updateDoc(doc(db, 'imoveis', imovelId), { fotos });

    registrarEvento('foto_upload', { imovelId });
    mostrarToast('Foto adicionada!');
    executarBusca();
  } catch (err) {
    console.error(err);
    mostrarToast(
      err instanceof ErroFoto ? err.message : 'Não foi possível enviar a foto.'
    );
  } finally {
    input.value = '';
  }
});

async function carregarBairros() {
  try {
    const bairros = await listarBairros(db);
    const datalist = document.getElementById('lista-bairros')!;
    datalist.innerHTML = bairros
      .map((b) => `<option value="${b}"></option>`)
      .join('');
  } catch (err) {
    console.warn('Não foi possível carregar bairros:', err);
  }
}

let paginarReset = true;

async function executarBusca(acrescentar = false) {
  const cardsEl = document.getElementById('cards')!;
  const contagemEl = document.getElementById('txt-contagem')!;
  const btnMais = document.getElementById('btn-mais') as HTMLButtonElement;

  if (!acrescentar) {
    contagemEl.textContent = 'Buscando...';
    cardsEl.innerHTML = '<p class="vazio">Carregando imóveis...</p>';
  }
  btnMais.style.display = 'none';

  try {
    const imoveis = await buscarImoveis(db, estadoFiltros);
    ultimosResultados = imoveis;
    contagemEl.textContent = `${imoveis.length} imóvel(is) encontrados`;
    renderCards(cardsEl, imoveis, acrescentar);
    registrarEvento('busca', {
      finalidade: estadoFiltros.finalidade,
      tipo: estadoFiltros.tipo,
      caracteristicas: estadoFiltros.caracteristicas.length,
      resultados: imoveis.length,
    });

    btnMais.style.display = imoveis.length >= (estadoFiltros.limite ?? PAGINA_PADRAO) ? 'block' : 'none';
  } catch (err) {
    console.error(err);
    contagemEl.textContent = 'Erro ao buscar';
    cardsEl.innerHTML = `<p class="vazio">Erro ao buscar imóveis. Verifique as configurações do Firebase e as regras de segurança.</p>`;
  }
}

function renderCards(el: HTMLElement, imoveis: Imovel[], acrescentar = false) {
  if (imoveis.length === 0) {
    el.innerHTML = '<p class="vazio">Nenhum imóvel encontrado com esses filtros.</p>';
    return;
  }

  const html = imoveis
    .map((im) => {
      const fotos = im.fotos ?? [];
      const foto = fotos.length > 0 ? fotos[0] : null;
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
        <div class="card-foto${fotos.length > 0 ? ' clicavel' : ''}" onclick="window.abrirGaleria('${im.id}')">
          ${
            foto
              ? `<img src="${foto}" alt="${im.tipo}" loading="lazy" />`
              : '<div class="sem-foto">Sem foto</div>'
          }
          ${
            fotos.length > 1
              ? `<span class="foto-contagem">${fotos.length} 📷</span>`
              : ''
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
            ${
              usuarioAdmin
                ? `<label class="btn btn-small upload-foto" data-id="${im.id}">📷 Adicionar foto
                     <input type="file" accept="image/*" class="foto-input" data-id="${im.id}" hidden />
                   </label>`
                : ''
            }
          </div>
        </div>
      </article>
    `;
    })
    .join('');

  if (acrescentar) {
    el.insertAdjacentHTML('beforeend', html);
  } else {
    el.innerHTML = html;
  }
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
    abrirGaleria: (id: string) => void;
  }
}

window.copiarUm = (id: string) => {
  const im = ultimosResultados.find((i) => i.id === id);
  if (!im) return;
  registrarEvento('copiar_resumo');
  navigator.clipboard.writeText(resumoDoImovel(im)).then(() => {
    mostrarToast('Resumo copiado!');
  });
};

// ---------- Galeria de fotos ----------
let galeriaIndice = 0;
let galeriaFotos: string[] = [];

window.abrirGaleria = (id: string) => {
  const im = ultimosResultados.find((i) => i.id === id);
  const fotos = im?.fotos ?? [];
  if (fotos.length === 0) return;

  galeriaFotos = fotos;
  galeriaIndice = 0;
  renderGaleria();
  registrarEvento('galeria_aberta', { imovelId: id });
};

function renderGaleria() {
  const existe = document.getElementById('galeria');
  if (existe) existe.remove();

  const overlay = document.createElement('div');
  overlay.id = 'galeria';
  overlay.className = 'galeria';
  overlay.innerHTML = `
    <div class="galeria-conteudo" role="dialog" aria-label="Galeria de fotos">
      <button class="galeria-fechar" id="galeria-fechar" aria-label="Fechar">✕</button>
      <button class="galeria-nav galeria-anterior" id="galeria-anterior" aria-label="Anterior">‹</button>
      <img id="galeria-img" src="${galeriaFotos[0]}" alt="Foto do imóvel" />
      <button class="galeria-nav galeria-proxima" id="galeria-proxima" aria-label="Próxima">›</button>
      <p class="galeria-contador" id="galeria-contador"></p>
    </div>
  `;
  document.body.appendChild(overlay);

  const atualizarContador = () => {
    const img = document.getElementById('galeria-img') as HTMLImageElement;
    img.src = galeriaFotos[galeriaIndice];
    document.getElementById('galeria-contador')!.textContent =
      `${galeriaIndice + 1} / ${galeriaFotos.length}`;
  };

  document.getElementById('galeria-fechar')!.addEventListener('click', () => overlay.remove());
  document.getElementById('galeria-anterior')!.addEventListener('click', () => {
    galeriaIndice = (galeriaIndice - 1 + galeriaFotos.length) % galeriaFotos.length;
    atualizarContador();
  });
  document.getElementById('galeria-proxima')!.addEventListener('click', () => {
    galeriaIndice = (galeriaIndice + 1) % galeriaFotos.length;
    atualizarContador();
  });
  overlay.addEventListener('click', (ev) => {
    if (ev.target === overlay) overlay.remove();
  });
  document.addEventListener('keydown', (ev) => {
    if (!document.getElementById('galeria')) return;
    if (ev.key === 'Escape') overlay.remove();
    if (ev.key === 'ArrowLeft') {
      galeriaIndice = (galeriaIndice - 1 + galeriaFotos.length) % galeriaFotos.length;
      atualizarContador();
    }
    if (ev.key === 'ArrowRight') {
      galeriaIndice = (galeriaIndice + 1) % galeriaFotos.length;
      atualizarContador();
    }
  });

  atualizarContador();
}

function registrarEvento(nome: string, params?: Record<string, unknown>) {
  analytics?.then((a) => {
    if (a) {
      import('firebase/analytics').then(({ logEvent }) =>
        logEvent(a, nome, params as any)
      );
    }
  });
}

export { auth };
