import { Injectable, signal } from '@angular/core';
import type { DoctorFinding, Report, RepoConfig, Run, RunEvent, Ticket } from '@lobos-factory/models';

// Die API läuft auf einem eigenen Port. Wird der geändert (FACTORY_API_PORT),
// muss er hier mit — der Browser-Bundle liest keine Umgebungsvariablen.
const BASE = 'http://localhost:4711/api';

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(BASE + url, {
    ...init,
    headers: init?.body ? { 'content-type': 'application/json' } : undefined,
  });
  if (!res.ok) throw new Error((await res.text()) || res.statusText);
  return (await res.json()) as T;
}

@Injectable({ providedIn: 'root' })
export class Api {
  readonly error = signal('');

  repos = () => json<RepoConfig[]>('/repos');
  addRepo = (path: string) => json<RepoConfig>('/repos', { method: 'POST', body: JSON.stringify({ path }) });
  doctor = (id: string) => json<DoctorFinding[]>(`/repos/${id}/doctor`);

  tickets = (id: string) => json<Ticket[]>(`/repos/${id}/tickets`);
  ticket = (id: string, ticketId: string) => json<Ticket>(`/repos/${id}/tickets/${ticketId}`);
  spec = (id: string, ticketId: string) => json<{ markdown: string }>(`/repos/${id}/tickets/${ticketId}/spec`);
  createTicket = (id: string, body: Record<string, string>) =>
    json<Ticket>(`/repos/${id}/tickets`, { method: 'POST', body: JSON.stringify(body) });
  setState = (id: string, ticketId: string, state: string) =>
    json<{ ok: true }>(`/repos/${id}/tickets/${ticketId}/state`, { method: 'POST', body: JSON.stringify({ state }) });

  reports = (id: string) => json<Report[]>(`/repos/${id}/reports`);
  quality = (id: string) => json<{ markdown: string }>(`/repos/${id}/reports/quality`);

  startRun = (repoId: string, ticketId: string, command: string) =>
    json<Run>('/runs', { method: 'POST', body: JSON.stringify({ repoId, ticketId, command }) });
  permission = (runId: string, requestId: string, allow: boolean) =>
    json<{ ok: boolean }>(`/runs/${runId}/permission`, { method: 'POST', body: JSON.stringify({ requestId, allow }) });
  answer = (runId: string, text: string) =>
    json<{ ok: boolean }>(`/runs/${runId}/answer`, { method: 'POST', body: JSON.stringify({ text }) });

  /** The live transcript. Replays what happened before, then streams. */
  runEvents(runId: string, onEvent: (e: RunEvent) => void): EventSource {
    const source = new EventSource(`${BASE}/runs/${runId}/events`);
    source.onmessage = (m) => onEvent(JSON.parse(m.data) as RunEvent);
    return source;
  }

  /** Fires whenever a ticket file on disk changes. */
  ticketChanges(repoId: string, onChange: () => void): EventSource {
    const source = new EventSource(`${BASE}/repos/${repoId}/tickets/events`);
    source.onmessage = () => onChange();
    return source;
  }
}
