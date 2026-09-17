import { test, expect, type Page } from '@playwright/test';
import { workspaceRoot } from '@nx/devkit';

const API = 'http://localhost:4711/api';

/** The e2e API keeps its own registry; seed it with this very repo. */
async function repoId(page: Page): Promise<string> {
  const existing = await (await page.request.get(`${API}/repos`)).json();
  if (existing.length) return existing[0].id;
  const created = await page.request.post(`${API}/repos`, { data: { path: workspaceRoot } });
  return (await created.json()).id;
}

test('board shows the tickets of this repo @smoke', async ({ page }) => {
  const id = await repoId(page);

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Repos', level: 1 })).toBeVisible();
  await page.screenshot({ path: 'test-results/repos.png', fullPage: true });

  await page.goto(`/repo/${id}`);
  await expect(page.getByRole('heading', { name: 'Board', level: 1 })).toBeVisible();
  // ticket 001 is the one that bootstrapped this workspace
  await expect(page.getByText('Bootstrap Nx workspace')).toBeVisible();
  await page.screenshot({ path: 'test-results/board.png', fullPage: true });
});

test('a run streams, asks for permission and asks a question', async ({ page }) => {
  const id = await repoId(page);
  await page.goto(`/repo/${id}/ticket/001`);

  await expect(page.getByRole('heading', { name: /Bootstrap Nx workspace/ })).toBeVisible();
  await page.getByRole('button', { name: /factory-spec 001/ }).click();

  // the agent wants to run a command, the human decides
  await expect(page.getByText('Der Agent will')).toBeVisible();
  await page.screenshot({ path: 'test-results/permission.png', fullPage: true });
  await page.getByRole('button', { name: 'Erlauben' }).click();

  // and then it asks instead of guessing
  await expect(page.getByText(/Vitest oder Jest/)).toBeVisible();
  await expect(page.getByPlaceholder('Antwort an den Agenten')).toBeVisible();
  await page.screenshot({ path: 'test-results/question.png', fullPage: true });
});

test('dashboard renders quality.md', async ({ page }) => {
  const id = await repoId(page);
  await page.goto(`/repo/${id}/dashboard`);
  await expect(page.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'quality.md' })).toBeVisible();
  await page.screenshot({ path: 'test-results/dashboard.png', fullPage: true });
});
