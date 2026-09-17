import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve, basename, dirname } from 'node:path';
import { promisify } from 'node:util';
import type { RepoConfig, Ticket, TicketState } from '@lobos-factory/models';

const run = promisify(execFile);

/** Overridable so tests do not write into the developer's real registry. */
export const REGISTRY = process.env['FACTORY_REGISTRY'] ?? join(homedir(), '.factory', 'repos.json');

/** The Core ships with this app; scripts are run from here, not from the target repo. */
export function coreRoot(): string {
  return process.env['FACTORY_CORE_ROOT'] ?? resolve(process.cwd(), 'packages/factory-core');
}

export function script(name: string): string {
  return join(coreRoot(), 'scripts', name);
}

export function repoId(path: string): string {
  return createHash('sha1').update(resolve(path)).digest('hex').slice(0, 8);
}

export async function sh(cmd: string, args: string[], cwd: string): Promise<string> {
  const { stdout } = await run(cmd, args, {
    cwd,
    env: { ...process.env, FACTORY_REPO: cwd },
    maxBuffer: 16 * 1024 * 1024,
  });
  return stdout;
}

export async function readRegistry(): Promise<RepoConfig[]> {
  try {
    return JSON.parse(await fs.readFile(REGISTRY, 'utf8')) as RepoConfig[];
  } catch {
    return [];
  }
}

export async function writeRegistry(repos: RepoConfig[]): Promise<void> {
  await fs.mkdir(dirname(REGISTRY), { recursive: true });
  await fs.writeFile(REGISTRY, JSON.stringify(repos, null, 2) + '\n');
}

export async function addRepo(path: string): Promise<RepoConfig> {
  const abs = resolve(path.replace(/^~/, homedir()));
  try {
    await fs.access(join(abs, '.git'));
  } catch {
    throw new Error(`${abs} is not a git repository`);
  }
  const repos = await readRegistry();
  const id = repoId(abs);
  if (repos.some((r) => r.id === id)) throw new Error(`${abs} is already registered`);
  const repo: RepoConfig = { id, path: abs, name: basename(abs) };
  await writeRegistry([...repos, repo]);
  return repo;
}

export async function getRepo(id: string): Promise<RepoConfig> {
  const repo = (await readRegistry()).find((r) => r.id === id);
  if (!repo) throw new Error(`unknown repo ${id}`);
  return repo;
}

/** The tickets folder, from the repo's .factory.yml. */
export async function ticketsDir(repo: RepoConfig): Promise<string> {
  try {
    const out = await sh(script('cfg.sh'), ['tickets', 'tickets'], repo.path);
    return join(repo.path, out.trim());
  } catch {
    return join(repo.path, 'tickets');
  }
}

export async function docsDir(repo: RepoConfig): Promise<string> {
  try {
    const out = await sh(script('cfg.sh'), ['docs', 'docs'], repo.path);
    return join(repo.path, out.trim());
  } catch {
    return join(repo.path, 'docs');
  }
}

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

export function parseTicket(raw: string, file: string): Ticket | null {
  const m = FRONTMATTER.exec(raw);
  if (!m) return null;
  const fm: Record<string, string> = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i < 1) continue;
    fm[line.slice(0, i).trim()] = line
      .slice(i + 1)
      .trim()
      .replace(/^["']|["']$/g, '');
  }
  if (!fm['id']) return null;
  return {
    id: fm['id'],
    title: fm['title'] ?? '',
    type: (fm['type'] as Ticket['type']) || 'product',
    risk: (fm['risk'] as Ticket['risk']) || '',
    state: (fm['state'] as TicketState) || 'backlog',
    created: fm['created'] ?? '',
    branch: fm['branch'] ?? '',
    pr: fm['pr'] ?? '',
    spec: fm['spec'] ?? '',
    report: fm['report'] ?? '',
    file,
    body: m[2],
  };
}

export async function listTickets(repo: RepoConfig): Promise<Ticket[]> {
  const dir = await ticketsDir(repo);
  let names: string[] = [];
  try {
    names = await fs.readdir(dir);
  } catch {
    return [];
  }
  const tickets: Ticket[] = [];
  for (const name of names.filter((n) => /^\d+.*\.md$/.test(n)).sort()) {
    const raw = await fs.readFile(join(dir, name), 'utf8');
    const t = parseTicket(raw, name);
    if (t) tickets.push(t);
  }
  return tickets;
}
