#!/usr/bin/env node
/**
 * pnpm factory            start the API and the UI, open the browser
 * pnpm factory add <path> register a repo (also: add . inside a repo)
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { homedir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';

const REGISTRY = process.env.FACTORY_REGISTRY ?? join(homedir(), '.factory', 'repos.json');
const UI = 'http://localhost:4200';

async function add(target) {
  const path = resolve((target ?? '.').replace(/^~/, homedir()));
  if (!existsSync(join(path, '.git'))) {
    console.error(`${path} ist kein git-Repository.`);
    process.exit(1);
  }
  let repos = [];
  try {
    repos = JSON.parse(await readFile(REGISTRY, 'utf8'));
  } catch {
    /* erstes Repo */
  }
  const id = createHash('sha1').update(path).digest('hex').slice(0, 8);
  if (repos.some((r) => r.id === id)) {
    console.error(`${path} ist schon registriert.`);
    process.exit(1);
  }
  repos.push({ id, path, name: basename(path) });
  await mkdir(dirname(REGISTRY), { recursive: true });
  await writeFile(REGISTRY, JSON.stringify(repos, null, 2) + '\n');
  console.log(`registriert: ${path}`);
}

async function waitFor(url, timeoutMs = 90_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url);
      if (res.ok || res.status < 500) return true;
    } catch {
      /* noch nicht da */
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  return false;
}

async function start() {
  const nx = spawn('pnpm', ['nx', 'run-many', '-t', 'serve', '-p', 'api', 'ui'], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  process.on('SIGINT', () => nx.kill('SIGINT'));

  if (await waitFor(UI)) {
    const open = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open';
    spawn(open, [UI], { stdio: 'ignore', detached: true, shell: process.platform === 'win32' }).unref();
    console.log(`\nFactory GUI: ${UI}\n`);
  } else {
    console.error(`${UI} kam nicht hoch — Logs oben.`);
  }
}

const [command, argument] = process.argv.slice(2);
if (command === 'add') await add(argument);
else await start();
