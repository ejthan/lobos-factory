import { Component, OnDestroy, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GATE_STATES, TICKET_STATES, type Ticket, type TicketState } from '@lobos-factory/models';
import { Api } from './api';

@Component({
  selector: 'lf-board',
  imports: [RouterLink],
  template: `
    <header class="row">
      <h1>Board</h1>
      <nav>
        <a routerLink="/">Repos</a>
        <a [routerLink]="['/repo', repoId(), 'dashboard']">Dashboard</a>
        <button type="button" (click)="showForm.set(!showForm())">Neues Ticket</button>
      </nav>
    </header>

    @if (showForm()) {
      <form class="new-ticket" (submit)="create($event)">
        <input name="title" placeholder="Titel" required />
        <textarea name="goal" placeholder="Goal — was soll danach wahr sein?" rows="2"></textarea>
        <textarea name="context" placeholder="Context — was existiert heute?" rows="2"></textarea>
        <textarea name="criteria" placeholder="Akzeptanzkriterien (Entwurf)" rows="3"></textarea>
        <button type="submit">Anlegen</button>
      </form>
    }

    <div class="board">
      @for (state of states; track state) {
        <section class="column">
          <h2>
            {{ state }}
            <span class="count">{{ byState()[state].length }}</span>
          </h2>
          @if (gate(state); as label) { <p class="gate">wartet auf dich: {{ label }}</p> }
          @for (ticket of byState()[state]; track ticket.id) {
            <a class="ticket" [routerLink]="['/repo', repoId(), 'ticket', ticket.id]">
              <span class="id">{{ ticket.id }}</span>
              <span class="title">{{ ticket.title }}</span>
              <span class="badges">
                @if (ticket.risk) { <span class="risk {{ ticket.risk }}">{{ ticket.risk }}</span> }
                @if (ticket.type !== 'product') { <span class="type">{{ ticket.type }}</span> }
              </span>
            </a>
          }
        </section>
      }
    </div>
  `,
})
export class BoardPage implements OnDestroy {
  private readonly api = inject(Api);
  readonly repoId = input.required<string>();
  readonly states = TICKET_STATES;
  readonly tickets = signal<Ticket[]>([]);
  readonly showForm = signal(false);
  private source?: EventSource;

  readonly byState = computed(() => {
    const groups = Object.fromEntries(TICKET_STATES.map((s) => [s, [] as Ticket[]])) as Record<TicketState, Ticket[]>;
    for (const ticket of this.tickets()) groups[ticket.state]?.push(ticket);
    return groups;
  });

  constructor() {
    queueMicrotask(() => {
      void this.load();
      // a ticket file edited on disk moves the card, no reload
      this.source = this.api.ticketChanges(this.repoId(), () => void this.load());
    });
  }

  ngOnDestroy() {
    this.source?.close();
  }

  gate(state: TicketState): string | undefined {
    return GATE_STATES[state];
  }

  private async load() {
    this.tickets.set(await this.api.tickets(this.repoId()));
  }

  async create(event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const data = new FormData(form);
    await this.api.createTicket(this.repoId(), {
      title: String(data.get('title') ?? ''),
      goal: String(data.get('goal') ?? ''),
      context: String(data.get('context') ?? ''),
      criteria: String(data.get('criteria') ?? ''),
    });
    form.reset();
    this.showForm.set(false);
    await this.load();
  }
}
