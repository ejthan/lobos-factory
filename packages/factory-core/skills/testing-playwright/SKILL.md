---
name: testing-playwright
description: Use when writing or running e2e tests in a factory repo - the smoke tag, screenshots, and what an e2e test is for.
---

# Playwright in the factory

Every product ticket ends with green unit tests **and** at least one Playwright test that
takes a screenshot. The screenshot is what a human looks at when the numbers say fine.

## The smoke test

Exactly one path through the app, tagged `@smoke`, run after every merge:

```ts
test('board loads @smoke', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Lobos Factory' })).toBeVisible();
  await page.screenshot({ path: 'test-results/smoke.png', fullPage: true });
});
```

It must pass on a cold start with no API key and no network: it proves the app is alive,
nothing more. Keep it under ten seconds.

## Rules

- Query by role and accessible name, not by CSS class. A test that breaks on a class
  rename tests nothing.
- No `waitForTimeout`. Wait for a condition — Playwright's auto-waiting already does.
- One user-visible behaviour per test, named after what the user does.
- Agent transcripts and runs are tested against **fake-agent mode**, replaying a recorded
  JSONL file. E2E tests never call a real model: CI has no API key.
- Screenshots are artifacts, not assertions. Assert on the DOM, then take the picture.
