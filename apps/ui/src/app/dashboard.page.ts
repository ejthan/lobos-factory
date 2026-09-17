import { Component, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Report } from '@lobos-factory/models';
import { Api } from './api';
import { MarkdownPipe } from './markdown';

const avg = (values: (number | null)[]): number | null => {
  const numbers = values.filter((v): v is number => v !== null);
  return numbers.length ? numbers.reduce((a, b) => a + b, 0) / numbers.length : null;
};

@Component({
  selector: 'lf-dashboard',
  imports: [RouterLink, MarkdownPipe],
  template: `
    <header class="row">
      <h1>Dashboard</h1>
      <nav>
        <a routerLink="/">Repos</a>
        <a [routerLink]="['/repo', repoId()]">Board</a>
      </nav>
    </header>

    <div class="tiles">
      <div class="tile">
        <span class="value">{{ fmt(prToMerge(), 'h') }}</span>
        <span class="label">PR bis Merge</span>
      </div>
      <div class="tile">
        <span class="value">{{ fmt(autonomous(), '%') }}</span>
        <span class="label">Autonomie-Rate</span>
      </div>
      <div class="tile">
        <span class="value">{{ fmt(leadTime(), 'h') }}</span>
        <span class="label">Durchlaufzeit</span>
      </div>
      <div class="tile">
        <span class="value">{{ reports().length }}</span>
        <span class="label">abgeschlossene Tickets</span>
      </div>
    </div>

    @if (reports().length) {
      <table>
        <thead>
          <tr><th>Ticket</th><th>Durchlauf</th><th>PR→Merge</th><th>Runden</th><th>Autonomie</th></tr>
        </thead>
        <tbody>
          @for (report of reports(); track report.id) {
            <tr>
              <td>{{ report.id }} — {{ report.title }}</td>
              <td>{{ fmt(report.leadTimeHours, 'h') }}</td>
              <td>{{ fmt(report.prToMergeHours, 'h') }}</td>
              <td>{{ report.reviewRounds ?? '—' }}</td>
              <td>{{ fmt(report.autonomousRatePct, '%') }}</td>
            </tr>
          }
        </tbody>
      </table>
    } @else {
      <p class="hint">Noch kein Report. Die entstehen, wenn ein Ticket <code>done</code> wird.</p>
    }

    <h2>quality.md</h2>
    <article class="doc" [innerHTML]="quality() | markdown"></article>
  `,
})
export class DashboardPage {
  private readonly api = inject(Api);
  readonly repoId = input.required<string>();
  readonly reports = signal<Report[]>([]);
  readonly quality = signal('');

  readonly prToMerge = computed(() => avg(this.reports().map((r) => r.prToMergeHours)));
  readonly autonomous = computed(() => avg(this.reports().map((r) => r.autonomousRatePct)));
  readonly leadTime = computed(() => avg(this.reports().map((r) => r.leadTimeHours)));

  constructor() {
    queueMicrotask(async () => {
      this.reports.set(await this.api.reports(this.repoId()));
      this.quality.set((await this.api.quality(this.repoId())).markdown);
    });
  }

  fmt(value: number | null, unit: string): string {
    return value === null ? '—' : `${Math.round(value * 10) / 10} ${unit}`;
  }
}
