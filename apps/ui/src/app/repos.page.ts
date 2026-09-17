import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { DoctorFinding, RepoConfig } from '@lobos-factory/models';
import { Api } from './api';

@Component({
  selector: 'lf-repos',
  imports: [RouterLink],
  template: `
    <h1>Repos</h1>
    <p class="hint">
      Die Fabrik arbeitet auf lokalen Klonen. Browser können keine absoluten Pfade
      zurückgeben, also tippe den Pfad — oder nimm <code>factory add .</code> im Repo.
    </p>

    <form (submit)="add($event)">
      <input name="path" [value]="path()" (input)="path.set($any($event.target).value)"
             placeholder="/Users/du/projekte/dein-repo" aria-label="Repo-Pfad" />
      <button type="submit" [disabled]="busy()">Repo hinzufügen</button>
    </form>
    @if (error()) { <p class="error">{{ error() }}</p> }

    <ul class="cards">
      @for (repo of repos(); track repo.id) {
        <li class="card">
          <div>
            <a [routerLink]="['/repo', repo.id]"><strong>{{ repo.name }}</strong></a>
            <div class="path">{{ repo.path }}</div>
          </div>
          <div class="actions">
            <a [routerLink]="['/repo', repo.id]">Board</a>
            <a [routerLink]="['/repo', repo.id, 'dashboard']">Dashboard</a>
            <button type="button" (click)="check(repo)">Doctor</button>
          </div>
          @if (findings()[repo.id]; as f) {
            @if (f.length) {
              <ul class="findings">
                @for (finding of f; track finding.check) {
                  <li><b>{{ finding.check }}</b> — {{ finding.message }} <em>{{ finding.fix }}</em></li>
                }
              </ul>
            } @else { <p class="ok">Alles da, was die Fabrik braucht.</p> }
          }
        </li>
      } @empty { <li class="empty">Noch kein Repo registriert.</li> }
    </ul>
  `,
})
export class ReposPage {
  private readonly api = inject(Api);
  readonly repos = signal<RepoConfig[]>([]);
  readonly findings = signal<Record<string, DoctorFinding[]>>({});
  readonly path = signal('');
  readonly error = signal('');
  readonly busy = signal(false);

  constructor() {
    void this.load();
  }

  private async load() {
    this.repos.set(await this.api.repos());
  }

  async add(event: Event) {
    event.preventDefault();
    this.error.set('');
    this.busy.set(true);
    try {
      await this.api.addRepo(this.path());
      this.path.set('');
      await this.load();
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : String(e));
    } finally {
      this.busy.set(false);
    }
  }

  async check(repo: RepoConfig) {
    this.findings.set({ ...this.findings(), [repo.id]: await this.api.doctor(repo.id) });
  }
}
