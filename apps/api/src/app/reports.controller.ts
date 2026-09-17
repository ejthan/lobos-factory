import { Controller, Get, Param } from '@nestjs/common';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import type { Report } from '@lobos-factory/models';
import { docsDir, getRepo } from './factory';

/** Pulls "| **PR-to-merge** | 1.5 h |" style rows out of a report. */
function metric(markdown: string, label: string): number | null {
  const row = new RegExp(`\\|\\s*\\*{0,2}${label}[^|]*\\*{0,2}\\s*\\|\\s*([^|]+)\\|`, 'i').exec(markdown);
  if (!row) return null;
  const value = parseFloat(row[1].replace(',', '.'));
  return Number.isFinite(value) ? value : null;
}

@Controller('repos/:id/reports')
export class ReportsController {
  @Get()
  async list(@Param('id') id: string): Promise<Report[]> {
    const repo = await getRepo(id);
    const dir = join(await docsDir(repo), 'reports');
    let names: string[] = [];
    try {
      names = (await fs.readdir(dir)).filter((n) => n.endsWith('.md'));
    } catch {
      return [];
    }
    const reports: Report[] = [];
    for (const name of names.sort()) {
      const md = await fs.readFile(join(dir, name), 'utf8');
      reports.push({
        id: name.replace(/\.md$/, ''),
        title: (/^#\s*Report\s+\S+\s+—\s*(.+)$/m.exec(md)?.[1] ?? name).trim(),
        leadTimeHours: metric(md, 'lead time'),
        prToMergeHours: metric(md, 'PR-to-merge'),
        reviewRounds: metric(md, 'review rounds'),
        autonomousRatePct: metric(md, 'autonomous rate'),
        doneAt: /\|\s*done\s*\|\s*([0-9T:\-Z]+)\s*\|/i.exec(md)?.[1] ?? null,
      });
    }
    return reports;
  }

  @Get('quality')
  async quality(@Param('id') id: string): Promise<{ markdown: string }> {
    const repo = await getRepo(id);
    try {
      return { markdown: await fs.readFile(join(await docsDir(repo), 'quality.md'), 'utf8') };
    } catch {
      return { markdown: '' };
    }
  }
}
