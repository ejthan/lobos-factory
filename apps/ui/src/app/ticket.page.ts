import { Component, OnDestroy, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { nextCommand, type RunEvent, type Ticket } from '@lobos-factory/models';
import { Api } from './api';
import { MarkdownPipe } from './markdown';

@Component({
  selector: 'lf-ticket',
  imports: [RouterLink, MarkdownPipe],
  template: `
    @if (ticket(); as t) {
      <header class="row">
        <h1><span class="id">{{ t.id }}</span> {{ t.title }}</h1>
        <nav>
          <a [routerLink]="['/repo', repoId()]">Board</a>
        </nav>
      </header>

      <div class="meta">
        <span class="state">{{ t.state }}</span>
        @if (t.risk) { <span class="risk {{ t.risk }}">{{ t.risk }}</span> }
        <span class="type">{{ t.type }}</span>
        @if (t.branch) { <code>{{ t.branch }}</code> }
        @if (t.pr) { <a [href]="t.pr" target="_blank" rel="noopener">PR öffnen</a> }
      </div>

      <div class="gates">
        @if (next(t); as cmd) {
          <button type="button" class="primary" (click)="start(cmd)" [disabled]="running()">
            {{ running() ? 'läuft…' : '/' + cmd + ' ' + t.id }}
          </button>
        }
        @if (t.state === 'spec-draft') {
          <button type="button" class="gate" (click)="setState('spec-approved')">Gate 1: Spec freigeben</button>
        }
        @if (t.state === 'in-review') {
          <button type="button" class="gate" (click)="setState('merged')">Gate 2: als gemergt markieren</button>
        }
      </div>

      <div class="split">
        <article class="doc">
          <div [innerHTML]="t.body | markdown"></div>
          @if (spec()) {
            <hr />
            <h2>Spec &amp; Plan</h2>
            <div [innerHTML]="spec() | markdown"></div>
          }
        </article>

        <section class="transcript">
          <h2>Transkript</h2>
          @if (!events().length) { <p class="hint">Noch kein Lauf. Der Button oben startet einen.</p> }

          @for (event of events(); track $index) {
            <div class="event {{ event.type }}">
              @switch (event.type) {
                @case ('agent.message') { <p>{{ event.text }}</p> }
                @case ('agent.tool_use') { <code class="tool">{{ event.tool }} {{ short(event.input) }}</code> }
                @case ('agent.tool_result') {
                  <code class="result {{ event.ok ? 'ok' : 'bad' }}">{{ short(event.output) }}</code>
                }
                @case ('run.started') { <p class="sys">Lauf gestartet: {{ event.command }}</p> }
                @case ('run.finished') { <p class="sys">Ende: {{ event.status }} — {{ event.summary }}</p> }
                @case ('agent.question') { <p class="ask">Frage: {{ event.text }}</p> }
                @case ('agent.permission') {
                  <div class="permission">
                    <p>Der Agent will <b>{{ event.tool }}</b> ausführen:</p>
                    <code>{{ short(event.input) }}</code>
                    <button type="button" (click)="decide(event, true)">Erlauben</button>
                    <button type="button" (click)="decide(event, false)">Ablehnen</button>
                  </div>
                }
              }
            </div>
          }

          @if (waiting()) {
            <form class="answer" (submit)="send($event)">
              <input name="text" placeholder="Antwort an den Agenten" aria-label="Antwort" />
              <button type="submit">Senden</button>
            </form>
          }
        </section>
      </div>
    }
  `,
})
export class TicketPage implements OnDestroy {
  private readonly api = inject(Api);
  readonly repoId = input.required<string>();
  readonly ticketId = input.required<string>();
  readonly ticket = signal<Ticket | null>(null);
  readonly spec = signal('');
  readonly events = signal<RunEvent[]>([]);
  readonly running = signal(false);
  readonly waiting = signal(false);
  private runId = '';
  private source?: EventSource;

  constructor() {
    queueMicrotask(() => void this.load());
  }

  ngOnDestroy() {
    this.source?.close();
  }

  next(t: Ticket) {
    return nextCommand(t.state);
  }

  short(value: unknown): string {
    const text = typeof value === 'string' ? value : JSON.stringify(value ?? '');
    return text.length > 300 ? text.slice(0, 300) + '…' : text;
  }

  private async load() {
    this.ticket.set(await this.api.ticket(this.repoId(), this.ticketId()));
    this.spec.set((await this.api.spec(this.repoId(), this.ticketId())).markdown);
  }

  async setState(state: string) {
    await this.api.setState(this.repoId(), this.ticketId(), state);
    await this.load();
  }

  async start(command: string) {
    this.running.set(true);
    this.events.set([]);
    const run = await this.api.startRun(this.repoId(), this.ticketId(), command);
    this.runId = run.id;
    this.source?.close();
    this.source = this.api.runEvents(run.id, (event) => {
      this.events.set([...this.events(), event]);
      if (event.type === 'agent.question') this.waiting.set(true);
      if (event.type === 'run.finished') {
        this.running.set(false);
        this.source?.close();
        void this.load();
      }
    });
  }

  async decide(event: RunEvent, allow: boolean) {
    if (event.requestId) await this.api.permission(this.runId, event.requestId, allow);
  }

  async send(submit: Event) {
    submit.preventDefault();
    const form = submit.target as HTMLFormElement;
    const text = String(new FormData(form).get('text') ?? '');
    await this.api.answer(this.runId, text);
    this.waiting.set(false);
    form.reset();
  }
}
