import { Body, Controller, Get, Param, Post, Sse } from '@nestjs/common';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { Observable, Subject } from 'rxjs';
import chokidar from 'chokidar';
import type { Ticket } from '@lobos-factory/models';
import { docsDir, getRepo, listTickets, script, sh, ticketsDir } from './factory';

/** One watcher per repo; it only ever says "something changed". */
const changes = new Subject<{ repoId: string }>();
const watched = new Set<string>();

async function watch(repoId: string): Promise<void> {
  if (watched.has(repoId)) return;
  watched.add(repoId);
  const repo = await getRepo(repoId);
  const dir = await ticketsDir(repo);
  chokidar
    .watch(dir, { ignoreInitial: true, depth: 1 })
    .on('all', () => changes.next({ repoId }));
}

@Controller()
export class TicketsController {
  @Get('repos/:id/tickets')
  async list(@Param('id') id: string): Promise<Ticket[]> {
    await watch(id);
    return listTickets(await getRepo(id));
  }

  @Sse('repos/:id/tickets/events')
  events(@Param('id') id: string): Observable<MessageEvent> {
    void watch(id);
    return new Observable((sub) => {
      const s = changes.subscribe((c) => {
        if (c.repoId === id) sub.next({ data: { changed: true } } as MessageEvent);
      });
      return () => s.unsubscribe();
    });
  }

  @Get('repos/:id/tickets/:ticketId')
  async get(@Param('id') id: string, @Param('ticketId') ticketId: string): Promise<Ticket> {
    const t = (await listTickets(await getRepo(id))).find((x) => x.id === ticketId);
    if (!t) throw new Error(`unknown ticket ${ticketId}`);
    return t;
  }

  /** The spec and plan live in one markdown file next to the ticket. */
  @Get('repos/:id/tickets/:ticketId/spec')
  async spec(@Param('id') id: string, @Param('ticketId') ticketId: string): Promise<{ markdown: string }> {
    const repo = await getRepo(id);
    const docs = await docsDir(repo);
    try {
      return { markdown: await fs.readFile(join(docs, 'specs', `${ticketId}.md`), 'utf8') };
    } catch {
      return { markdown: '' };
    }
  }

  @Post('repos/:id/tickets')
  async create(
    @Param('id') id: string,
    @Body() body: { title: string; type?: string; goal?: string; context?: string; criteria?: string },
  ): Promise<Ticket> {
    const repo = await getRepo(id);
    const out = await sh(script('ticket.sh'), ['new', body.title, body.type ?? 'product'], repo.path);
    const file = out.trim();
    const raw = await fs.readFile(file, 'utf8');
    const filled = raw
      .replace('## Goal\n', `## Goal\n\n${body.goal ?? ''}\n`)
      .replace('## Context\n', `## Context\n\n${body.context ?? ''}\n`)
      .replace('## Acceptance criteria (draft)\n', `## Acceptance criteria (draft)\n\n${body.criteria ?? ''}\n`);
    await fs.writeFile(file, filled);
    const tickets = await listTickets(repo);
    return tickets[tickets.length - 1];
  }

  /** Gate 1 and the manual half of gate 2 both come down to a state change. */
  @Post('repos/:id/tickets/:ticketId/state')
  async setState(
    @Param('id') id: string,
    @Param('ticketId') ticketId: string,
    @Body() body: { state: string },
  ): Promise<{ ok: true }> {
    const repo = await getRepo(id);
    await sh(script('ticket.sh'), ['state', ticketId, body.state], repo.path);
    changes.next({ repoId: id });
    return { ok: true };
  }
}
