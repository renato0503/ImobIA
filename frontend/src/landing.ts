import { irParaApp } from './main';

const app = document.getElementById('app')!;

export function renderLanding() {
  app.innerHTML = `
    <header class="lp-header">
      <div class="lp-container lp-nav">
        <a class="lp-logo" href="#/">🏠 ImobIA</a>
        <nav class="lp-nav-links">
          <a href="#para-quem">Para quem é</a>
          <a href="#como-funciona">Como funciona</a>
          <a href="#parceiros">Corretores parceiros</a>
          <a href="#transparencia">Em desenvolvimento</a>
        </nav>
        <button id="lp-entrar" class="btn btn-primary">Acessar plataforma</button>
      </div>
    </header>

    <main>
      <section class="lp-hero">
        <div class="lp-container">
          <p class="lp-badge">MVP · agregação imobiliária inteligente</p>
          <h1>Encontre o imóvel pelos detalhes que realmente importam</h1>
          <p class="lp-sub">
            O ImobIA reúne imóveis em um só lugar e permite buscar por combinações
            específicas — como uma casa com energia solar e quintal, para alugar até R$ 3.000.
          </p>
          <div class="lp-hero-cta">
            <button class="btn btn-primary btn-lg" onclick="window.irParaApp()">Começar a buscar</button>
            <a class="btn btn-outline btn-lg" href="#como-funciona">Ver como funciona</a>
          </div>
          <div class="lp-hero-chips">
            <span class="tag">energia solar</span>
            <span class="tag">quintal</span>
            <span class="tag">piscina</span>
            <span class="tag">3 quartos</span>
            <span class="tag">garagem</span>
            <span class="tag">varanda</span>
          </div>
        </div>
      </section>

      <section id="para-quem" class="lp-section">
        <div class="lp-container">
          <h2>Para quem é o ImobIA</h2>
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

      <section id="como-funciona" class="lp-section lp-section-alt">
        <div class="lp-container">
          <h2>Como funciona</h2>
          <div class="lp-steps">
            <div class="lp-step">
              <span class="lp-step-num">1</span>
              <h3>Entre na plataforma</h3>
              <p>Acesso com e-mail e senha. Crie sua conta e comece a usar.</p>
            </div>
            <div class="lp-step">
              <span class="lp-step-num">2</span>
              <h3>Combine os filtros</h3>
              <p>Escolha finalidade, tipo de imóvel, bairro, valor máximo e diferenciais.</p>
            </div>
            <div class="lp-step">
              <span class="lp-step-num">3</span>
              <h3>Veja os resultados e envie</h3>
              <p>Os cards aparecem na hora. Copie o resumo e envie no WhatsApp.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="parceiros" class="lp-section">
        <div class="lp-container">
          <h2>Para corretores parceiros</h2>
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

      <section id="transparencia" class="lp-section lp-section-alt">
        <div class="lp-container">
          <h2>O que já funciona e o que está em desenvolvimento</h2>
          <p class="lp-lead">
            Estamos em versão MVP e priorizamos transparência. Veja o que você encontra hoje.
          </p>
          <div class="lp-grid-2">
            <div class="lp-card">
              <h3>Já disponível</h3>
              <ul>
                <li>Busca com filtros combinados (finalidade, tipo, bairro, valor, características).</li>
                <li>Cards de resultados com contato e descrição.</li>
                <li>Resumo do imóvel copiado para o WhatsApp.</li>
                <li>Login e cadastro com e-mail e senha.</li>
                <li>Acesso pelo celular ou computador (PWA).</li>
              </ul>
            </div>
            <div class="lp-card">
              <h3>Em desenvolvimento</h3>
              <ul>
                <li>Captação de imóveis por mensagem de WhatsApp.</li>
                <li>Coleta automática de anúncios de portais externos.</li>
                <li>Upload e galeria de fotos dos imóveis.</li>
                <li>Área do corretor com painel do acervo.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section class="lp-section lp-cta">
        <div class="lp-container">
          <h2>Pronto para buscar um imóvel de verdade?</h2>
          <button class="btn btn-primary btn-lg" onclick="window.irParaApp()">Acessar a plataforma</button>
        </div>
      </section>
    </main>

    <footer class="lp-footer">
      <div class="lp-container">
        <p><strong>ImobIA</strong> — agregador imobiliário inteligente.</p>
        <p>Versão MVP · © 2026</p>
      </div>
    </footer>
  `;

  document.getElementById('lp-entrar')!.addEventListener('click', irParaApp);
}
