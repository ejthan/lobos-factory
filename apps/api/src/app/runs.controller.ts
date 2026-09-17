import { Body, Controller, Param, Post, Sse } from '@nestjs/common';
import { Observable, concat, from, of } from 'rxjs';
import { map } from 'rxjs/operators';
import type { Run, RunEvent } from '@lobos-factory/models';
import { RunsService } from './runs.service';

@Controller('runs')
export class RunsController {
  constructor(private readonly runs: RunsService) {}

  @Post()
  start(@Body() body: { repoId: string; ticketId: string; command: string }): Promise<Run> {
    return this.runs.start(body.repoId, body.ticketId, body.command);
  }

  /** Replays what already happened, then goes live. */
  @Sse(':id/events')
  events(@Param('id') id: string): Observable<MessageEvent> {
    const state = this.runs.get(id);
    if (!state) return of();
    const wrap = (e: RunEvent) => ({ data: e }) as MessageEvent;
    return concat(from([...state.events]).pipe(map(wrap)), state.stream.pipe(map(wrap)));
  }

  @Post(':id/permission')
  permission(
    @Param('id') id: string,
    @Body() body: { requestId: string; allow: boolean },
  ): { ok: boolean } {
    return { ok: this.runs.decide(id, body.requestId, body.allow) };
  }

  @Post(':id/answer')
  answer(@Param('id') id: string, @Body() body: { text: string }): { ok: boolean } {
    return { ok: this.runs.answer(id, body.text) };
  }
}
