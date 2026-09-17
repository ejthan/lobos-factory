import { Module } from '@nestjs/common';
import { ReposController } from './repos.controller';
import { TicketsController } from './tickets.controller';
import { RunsController } from './runs.controller';
import { ReportsController } from './reports.controller';
import { RunsService } from './runs.service';

@Module({
  controllers: [ReposController, TicketsController, RunsController, ReportsController],
  providers: [RunsService],
})
export class AppModule {}
