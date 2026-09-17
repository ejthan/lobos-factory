import { Injectable, Logger } from '@nestjs/common';
import { createReadStream, promises as fs } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { createInterface } from 'node:readline';
import { Subject } from 'rxjs';
import { query } from '@anthropic-ai/claude-agent-sdk';
import type { Run, RunEvent, RunStatus } from '@lobos-factory/models';
import { coreRoot, getRepo } from './factory';

interface Pending {
  resolve: (allow: boolean) => void;
}

interface RunState {
  run: Run;
  events: RunEvent[];
  stream: Subject<RunEvent>;
  permissions: Map<string, Pending>;
  /** resolves when a human answers a question the agent asked */
  answer?: (text: string) => void;
  logFile: string;
}

const now = () => new Date().toISOString();

@Injectable()
export class RunsService {
  private readonly log = new Logger('runs');
  private readonly runs = new Map<string, RunState>();

  async start(repoId: string, ticketId: string, command: string): Promise<Run> {
    const repo = await getRepo(repoId);
    const id = randomUUID();
    const dir = join(repo.path, '.factory', 'runs');
    await fs.mkdir(dir, { recursive: true });

    const state: RunState = {
      run: { id, repoId, ticketId, command, status: 'running', startedAt: now() },
      events: [],
      stream: new Subject<RunEvent>(),
      permissions: new Map(),
      logFile: join(dir, `${id}.jsonl`),
    };
    this.runs.set(id, state);

    this.emit(state, { type: 'run.started', at: now(), runId: id, ticketId, command });
    void this.drive(state, repo.path, `/factory-core:${command} ${ticketId}`);
    return state.run;
  }

  get(id: string): RunState | undefined {
    return this.runs.get(id);
  }

  /** Everything so far, then live. Survives a browser reload. */
  async history(id: string): Promise<RunEvent[]> {
    const state = this.runs.get(id);
    if (state) return state.events;
    return [];
  }

  async replayFromDisk(repoPath: string, runId: string): Promise<RunEvent[]> {
    const file = join(repoPath, '.factory', 'runs', `${runId}.jsonl`);
    const events: RunEvent[] = [];
    try {
      const rl = createInterface({ input: createReadStream(file), crlfDelay: Infinity });
      for await (const line of rl) if (line.trim()) events.push(JSON.parse(line) as RunEvent);
    } catch {
      /* no log yet */
    }
    return events;
  }

  decide(runId: string, requestId: string, allow: boolean): boolean {
    const pending = this.runs.get(runId)?.permissions.get(requestId);
    if (!pending) return false;
    pending.resolve(allow);
    this.runs.get(runId)?.permissions.delete(requestId);
    return true;
  }

  answer(runId: string, text: string): boolean {
    const state = this.runs.get(runId);
    if (!state?.answer) return false;
    state.answer(text);
    return true;
  }

  private emit(state: RunState, event: RunEvent): void {
    state.events.push(event);
    state.stream.next(event);
    void fs.appendFile(state.logFile, JSON.stringify(event) + '\n').catch(() => undefined);
  }

  private finish(state: RunState, status: RunStatus, summary: string): void {
    state.run.status = status;
    this.emit(state, { type: 'run.finished', at: now(), status, summary });
    state.stream.complete();
  }

  private async drive(state: RunState, cwd: string, prompt: string): Promise<void> {
    if (process.env['FACTORY_FAKE_AGENT']) {
      await this.replayFixture(state, process.env['FACTORY_FAKE_AGENT']);
      return;
    }
    try {
      const stream = query({
        prompt,
        options: {
          cwd,
          // the factory lives in AGENTS.md, the project settings and the plugin
          settingSources: ['user', 'project'],
          plugins: [{ type: 'local', path: coreRoot() }],
          permissionMode: 'default',
          canUseTool: async (tool: string, input: Record<string, unknown>) => {
            const requestId = randomUUID();
            const allowed = await new Promise<boolean>((resolve) => {
              state.permissions.set(requestId, { resolve });
              this.emit(state, { type: 'agent.permission', at: now(), requestId, tool, input });
            });
            return allowed
              ? { behavior: 'allow' as const, updatedInput: input }
              : { behavior: 'deny' as const, message: 'denied in the Factory GUI' };
          },
        },
      });

      for await (const message of stream) this.map(state, message);
      if (state.run.status === 'running') this.finish(state, 'ok', 'run finished');
    } catch (err) {
      this.log.error(err);
      this.finish(state, 'failed', err instanceof Error ? err.message : String(err));
    }
  }

  /** The SDK message shapes move between versions; stay defensive. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private map(state: RunState, message: any): void {
    if (!message || typeof message !== 'object') return;

    if (message.type === 'system' && message.session_id) {
      state.run.sessionId = message.session_id;
      return;
    }

    const blocks = message.message?.content ?? message.content;
    if (message.type === 'assistant') {
      for (const block of Array.isArray(blocks) ? blocks : []) {
        if (block.type === 'text' && block.text?.trim()) {
          this.emit(state, { type: 'agent.message', at: now(), role: 'assistant', text: block.text });
        } else if (block.type === 'tool_use') {
          this.emit(state, { type: 'agent.tool_use', at: now(), tool: block.name, input: block.input });
        }
      }
      return;
    }

    if (message.type === 'user') {
      for (const block of Array.isArray(blocks) ? blocks : []) {
        if (block.type === 'tool_result') {
          const output = typeof block.content === 'string' ? block.content : JSON.stringify(block.content);
          this.emit(state, {
            type: 'agent.tool_result',
            at: now(),
            tool: block.tool_use_id,
            output: (output ?? '').slice(0, 4000),
            ok: !block.is_error,
          });
        }
      }
      return;
    }

    if (message.type === 'result') {
      const text: string = message.result ?? message.subtype ?? '';
      // an agent that ends on a question is waiting for a human, not finished
      const asks = /\?\s*$/.test(text.trim());
      if (text.trim()) {
        this.emit(state, { type: 'agent.message', at: now(), role: 'assistant', text });
      }
      if (asks) {
        this.emit(state, { type: 'agent.question', at: now(), questionId: randomUUID(), text });
        this.finish(state, 'waiting-for-human', 'the agent asked a question');
      } else {
        this.finish(state, message.is_error ? 'failed' : 'ok', text.slice(0, 500));
      }
    }
  }

  /** Tests and demos: replay a recorded run, no API key needed. */
  private async replayFixture(state: RunState, file: string): Promise<void> {
    const events = await this.replayFixtureEvents(file);
    for (const event of events) {
      if (event.type === 'run.started') continue;
      this.emit(state, { ...event, at: now() });
      const requestId = event.requestId;
      if (event.type === 'agent.permission' && requestId) {
        await new Promise<boolean>((resolve) => state.permissions.set(requestId, { resolve }));
      }
      await new Promise((r) => setTimeout(r, Number(process.env['FACTORY_FAKE_DELAY'] ?? 120)));
    }
    if (state.run.status === 'running') this.finish(state, 'ok', 'replayed fixture');
  }

  private async replayFixtureEvents(file: string): Promise<RunEvent[]> {
    const raw = await fs.readFile(file, 'utf8');
    return raw
      .split('\n')
      .filter((l) => l.trim())
      .map((l) => JSON.parse(l) as RunEvent);
  }
}
