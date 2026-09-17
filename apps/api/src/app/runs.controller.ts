import { BadRequestException, Body, Controller, Param, Post, Sse } from '@nestjs/common';
import { Observable, concat, from, of } from 'rxjs';
import { map } from 'rxjs/operators';
import type { Run, RunEvent } from '@lobos-factory/models';
import { RunsService } from './runs.service';

/** The command goes into the agent's prompt, so it is a fixed list, not free text. */
const COMMANDS = [
  'factory-intake',
  'factory-spec',
  'factory-plan',
  'factory-implement',
  'factory-review',
  'factory-release',
  'factory-improve',
  'factory-run',
  'factory-status',
  'factory-init',
  'factory-doctor',
];

@Controller('runs')
export class RunsController {
  constructor(private readonly runs: RunsService) {}

  @Post()
  start(@Body() body: { repoId: string; ticketId: string; command: string }): Promise<Run> {
    if (!COMMANDS.includes(body.command)) {
      throw new BadRequestException(`unknown factory command '${body.command}'`);
    }
    if (!/^\d{1,6}$/.test(body.ticketId)) {
      throw new BadRequestException(`invalid ticket id '${body.ticketId}'`);
    }
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
