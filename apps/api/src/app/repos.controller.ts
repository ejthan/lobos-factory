import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import type { DoctorFinding, RepoConfig } from '@lobos-factory/models';
import { addRepo, getRepo, readRegistry, script, sh } from './factory';

@Controller('repos')
export class ReposController {
  @Get()
  list(): Promise<RepoConfig[]> {
    return readRegistry();
  }

  @Post()
  add(@Body() body: { path: string }): Promise<RepoConfig> {
    return addRepo(body.path);
  }

  @Get(':id/doctor')
  async doctor(@Param('id') id: string): Promise<DoctorFinding[]> {
    const repo = await getRepo(id);
    const out = await sh(script('doctor.sh'), [repo.path], repo.path);
    return JSON.parse(out) as DoctorFinding[];
  }
}
