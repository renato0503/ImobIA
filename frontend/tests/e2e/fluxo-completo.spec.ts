import { test, expect } from '@playwright/test';

const EMAIL = process.env.E2E_EMAIL || 'e2e.teste@imobia.app';
const SENHA = process.env.E2E_SENHA || 'E2ETeste@2026';

test.describe('ImobIA — fluxo completo', () => {
  test('A1: landing renderiza com CTA', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Encontre o imóvel');
    await expect(page.getByRole('button', { name: 'Acessar plataforma' }).first()).toBeVisible();
  });

  test('A2: navegar para o app sem sessão mostra login', async ({ page }) => {
    await page.goto('/#/app');
    await expect(page.locator('#login-email')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Entrar' })).toBeVisible();
  });

  test('A3: login com credenciais de teste → dashboard', async ({ page }) => {
    await page.goto('/#/app');
    await page.locator('#login-email').fill(EMAIL);
    await page.locator('#login-senha').fill(SENHA);
    await page.getByRole('button', { name: 'Entrar' }).click();

    // aguarda o dashboard e a busca carregar
    await expect(page.locator('.filtros')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.cards')).toBeVisible();
  });

  test('B2: login com senha errada mostra erro', async ({ page }) => {
    await page.goto('/#/app');
    await page.locator('#login-email').fill(EMAIL);
    await page.locator('#login-senha').fill('senha-errada-123');
    await page.getByRole('button', { name: 'Entrar' }).click();

    await expect(page.locator('#login-erro')).toContainText('E-mail ou senha incorretos');
  });

  test('B2b: aplicar filtro de busca e ver resultados', async ({ page }) => {
    await page.goto('/#/app');
    await page.locator('#login-email').fill(EMAIL);
    await page.locator('#login-senha').fill(SENHA);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.locator('.filtros')).toBeVisible({ timeout: 15000 });

    // filtro por finalidade Aluguel
    await page.locator('#f-finalidade').selectOption('aluguel');
    await page.getByRole('button', { name: 'Buscar' }).click();

    // a busca retorna cards (a base seed tem imóveis de aluguel)
    await expect(page.locator('.card').first()).toBeVisible({ timeout: 15000 });
  });

  test('B7: copiar resumo individual', async ({ page }) => {
    await page.goto('/#/app');
    await page.locator('#login-email').fill(EMAIL);
    await page.locator('#login-senha').fill(SENHA);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.locator('.card').first()).toBeVisible({ timeout: 15000 });

    await page.locator('.copy-one').first().click();
    await expect(page.locator('#toast')).toContainText('Resumo copiado');
  });

  test('B12: galeria de fotos abre e navega', async ({ page }) => {
    await page.goto('/#/app');
    await page.locator('#login-email').fill(EMAIL);
    await page.locator('#login-senha').fill(SENHA);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.locator('.card').first()).toBeVisible({ timeout: 15000 });

    // a galeria abre ao clicar na foto clicável
    await page.locator('.card-foto.clicavel').first().click();
    await expect(page.locator('#galeria')).toBeVisible();
    await expect(page.locator('#galeria-contador')).toContainText('/');

    // navega para a próxima foto e fecha
    await page.locator('#galeria-proxima').click();
    await page.locator('#galeria-fechar').click();
    await expect(page.locator('#galeria')).not.toBeVisible();
  });

  test('A6: sair volta para a landing', async ({ page }) => {
    await page.goto('/#/app');
    await page.locator('#login-email').fill(EMAIL);
    await page.locator('#login-senha').fill(SENHA);
    await page.getByRole('button', { name: 'Entrar' }).click();
    await expect(page.locator('.filtros')).toBeVisible({ timeout: 15000 });

    await page.getByRole('button', { name: 'Sair' }).click();
    await expect(page.locator('.lp-hero')).toBeVisible();
  });
});
