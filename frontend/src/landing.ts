import { irParaApp } from './main';
import { db, analytics } from './firebase';
import { salvarLead } from './services/leads';

const app = document.getElementById('app')!;

export function renderLanding() {
  app.innerHTML = `
    <header class="lp-header">
      <div class="lp-container lp-nav">
        <a class="lp-logo" href="#/" aria-label="ImobIA — voltar ao início">
          <img src="/logoletras.png" alt="ImobIA" class="lp-logo-img" />
        </a>
        <nav class="lp-nav-links" aria-label="Navegação principal">
          <a href="#para-quem">Para quem é</a>
          <a href="#como-funciona">Como funciona</a>
          <a href="#parceiros">Corretores parceiros</a>
          <a href="#contato">Seja parceiro</a>
          <a href="#transparencia">Em desenvolvimento</a>
        </nav>
        <span class="lp-dev-badge">Em desenvolvimento</span>
        <button id="lp-entrar" class="lp-btn lp-btn-primary">Acessar plataforma</button>
      </div>
    </header>

    <main>
      <section class="lp-hero">
        <div class="lp-container lp-hero-grid">
          <div class="lp-hero-texto">
            <p class="lp-badge">MVP · agregação imobiliária inteligente</p>
            <h1>Encontre o imóvel pelos detalhes que realmente importam</h1>
            <p class="lp-sub">
              O ImobIA reúne imóveis em um só lugar e permite buscar por combinações
              específicas — como uma casa com energia solar e quintal, para alugar até R$ 3.000.
            </p>
            <div class="lp-hero-cta">
              <button class="lp-btn lp-btn-primary lp-btn-lg" onclick="window.irParaApp()">Começar a buscar</button>
              <a class="lp-btn lp-btn-outline lp-btn-lg" href="#como-funciona">Ver como funciona</a>
            </div>
          </div>
          <div class="lp-hero-chips" aria-label="Exemplos de características que podem ser filtradas">
            <span class="lp-chip">energia solar</span>
            <span class="lp-chip">quintal</span>
            <span class="lp-chip">piscina</span>
            <span class="lp-chip">3 quartos</span>
            <span class="lp-chip">garagem</span>
            <span class="lp-chip">varanda</span>
          </div>
        </div>
      </section>

      <section id="para-quem" class="lp-section" aria-labelledby="titulo-para-quem">
        <div class="lp-container">
          <h2 id="titulo-para-quem">Para quem é o ImobIA</h2>
          <p class="lp-lead">
            Uma plataforma pensada para quem busca imóvel e para quem vive do mercado imobiliário.
          </p>
          <div class="lp-grid-2">
            <div class="lp-card">
              <h3>Para quem está buscando um imóvel</h3>
              <ul>
                <li>Filtros específicos: finalidade, tipo, bairro, valor e características.</li>
                <li>Compare opções em um só lugar, sem visitar vários sites.</li>
                <li>Copie o resumo do imóvel pronto para enviar no WhatsApp.</li>
              </ul>
            </div>
            <div class="lp-card">
              <h3>Para corretores e imobiliárias</h3>
              <ul>
                <li>Um acervo centralizado de imóveis captados.</li>
                <li>Busca rápida para atender pedidos específicos dos clientes.</li>
                <li>Resposta pronta para enviar ao cliente em segundos.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section id="como-funciona" class="lp-section lp-section-alt" aria-labelledby="titulo-como-funciona">
        <div class="lp-container">
          <h2 id="titulo-como-funciona">Como funciona</h2>
          <div class="lp-steps">
            <div class="lp-step">
              <span class="lp-step-num" aria-hidden="true">1</span>
              <h3>Entre na plataforma</h3>
              <p>Acesso com e-mail e senha. Crie sua conta e comece a usar.</p>
            </div>
            <div class="lp-step">
              <span class="lp-step-num" aria-hidden="true">2</span>
              <h3>Combine os filtros</h3>
              <p>Escolha finalidade, tipo de imóvel, bairro, valor máximo e diferenciais.</p>
            </div>
            <div class="lp-step">
              <span class="lp-step-num" aria-hidden="true">3</span>
              <h3>Veja os resultados e envie</h3>
              <p>Os cards aparecem na hora. Copie o resumo e envie no WhatsApp.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="parceiros" class="lp-section" aria-labelledby="titulo-parceiros">
        <div class="lp-container">
          <h2 id="titulo-parceiros">Para corretores parceiros</h2>
          <p class="lp-lead">
            Se você capta imóveis, o ImobIA também ajuda no cadastro. Envie a descrição
            de um imóvel e a plataforma organiza os dados de forma padronizada com o
            apoio de inteligência artificial.
          </p>
          <div class="lp-grid-3">
            <div class="lp-card">
              <h3>Cadastro assistido por IA</h3>
              <p>
                Um texto solto sobre um imóvel pode virar um cadastro estruturado
                (tipo, valores, características), sem digitar formulários longos.
              </p>
            </div>
            <div class="lp-card">
              <h3>Busca cruzada</h3>
              <p>
                Atenda pedidos como "casa com energia solar para alugar" filtrando
                características que os portais tradicionais não oferecem.
              </p>
            </div>
            <div class="lp-card">
              <h3>Resumo para WhatsApp</h3>
              <p>
                Gere uma mensagem formatada do imóvel e envie direto para o cliente,
                sem retrabalho de montar o texto na mão.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="contato" class="lp-section lp-section-alt" aria-labelledby="titulo-contato">
        <div class="lp-container">
          <h2 id="titulo-contato">Quer ser um corretor parceiro?</h2>
          <p class="lp-lead">
            Deixe seu contato e retornamos para apresentar a plataforma e os próximos passos.
          </p>
          <form id="lp-lead-form" class="lp-lead-form" novalidate aria-label="Formulário de contato para corretores parceiros">
            <input id="lead-nome" type="text" placeholder="Seu nome" required autocomplete="name" aria-label="Seu nome" />
            <input id="lead-email" type="email" placeholder="Seu e-mail" required autocomplete="email" aria-label="Seu e-mail" />
            <input id="lead-telefone" type="tel" placeholder="WhatsApp (opcional)" aria-label="WhatsApp (opcional)" autocomplete="tel" />
            <button type="submit" class="lp-btn lp-btn-primary">Tenho interesse</button>
          </form>
          <p id="lead-status" class="lp-lead-status" role="status" aria-live="polite"></p>
        </div>
      </section>

      <section id="transparencia" class="lp-section" aria-labelledby="titulo-transparencia">
        <div class="lp-container">
          <h2 id="titulo-transparencia">O que já funciona e o que está em desenvolvimento</h2>
          <p class="lp-lead">
            Estamos em versão MVP e priorizamos transparência. Veja o que você encontra hoje.
          </p>
          <div class="lp-grid-2">
            <div class="lp-card">
              <h3>Já disponível</h3>
              <ul>
                <li>Busca com filtros combinados (finalidade, tipo, bairro, faixa de valor, múltiplas características).</li>
                <li>Cards com fotos, contato, descrição e galeria navegável.</li>
                <li>Resumo do imóvel copiado para o WhatsApp.</li>
                <li>Captação de imóveis por texto, link ou áudio via inteligência artificial.</li>
                <li>Login e cadastro com e-mail e senha.</li>
                <li>Acesso pelo celular ou computador (PWA).</li>
              </ul>
            </div>
            <div class="lp-card">
              <h3>Em desenvolvimento</h3>
              <ul>
                <li>Recebimento automático de imóveis por WhatsApp.</li>
                <li>Coleta automática de anúncios de portais externos.</li>
                <li>Área do corretor com painel do acervo.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section class="lp-section lp-cta" aria-labelledby="titulo-cta">
        <div class="lp-container">
          <h2 id="titulo-cta">Pronto para buscar um imóvel de verdade?</h2>
          <button class="lp-btn lp-btn-primary lp-btn-lg" onclick="window.irParaApp()">Acessar a plataforma</button>
        </div>
      </section>
    </main>

    <footer class="lp-footer">
      <div class="lp-container">
        <p><strong>ImobIA</strong> — agregador imobiliário inteligente.</p>
        <p>Versão MVP · © 2026</p>
        <p>
          Desenvolvido por&nbsp;<a href="https://www.cerradofinancas.com.br/" target="_blank" rel="noopener noreferrer">Cerrado Tech</a>
        </p>
      </div>
    </footer>
  `;

  document.getElementById('lp-entrar')!.addEventListener('click', irParaApp);

  const form = document.getElementById('lp-lead-form') as HTMLFormElement;
  if (form) {
    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const status = document.getElementById('lead-status')!;
      const nome = (document.getElementById('lead-nome') as HTMLInputElement).value.trim();
      const email = (document.getElementById('lead-email') as HTMLInputElement).value.trim();
      const telefone = (document.getElementById('lead-telefone') as HTMLInputElement).value.trim();

      status.textContent = 'Enviando...';
      try {
        await salvarLead(db, { nome, email, telefone: telefone || undefined });
        analytics?.then((a) => {
          if (a) {
            import('firebase/analytics').then(({ logEvent }) =>
              logEvent(a, 'lead_enviado' as any)
            );
          }
        });
        status.textContent = 'Obrigado! Retornaremos em breve.';
        status.className = 'lp-lead-status lp-lead-status-ok';
        form.reset();
      } catch (err) {
        console.error(err);
        status.textContent = 'Não foi possível enviar. Tente novamente em instantes.';
        status.className = 'lp-lead-status lp-lead-status-erro';
      }
    });
  }
}
