import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import { parseTicket } from './factory';

const repoRoot = join(__dirname, '..', '..', '..', '..');

describe('parseTicket', () => {
  it('reads every ticket file of this repo', async () => {
    const dir = join(repoRoot, 'tickets');
    const names = (await fs.readdir(dir)).filter((n) => /^\d+.*\.md$/.test(n));
    expect(names.length).toBeGreaterThanOrEqual(7);

    for (const name of names) {
      const ticket = parseTicket(await fs.readFile(join(dir, name), 'utf8'), name);
      expect(ticket).not.toBeNull();
      expect(ticket?.id).toMatch(/^\d{3}$/);
      expect(ticket?.title).toBeTruthy();
      expect(ticket?.state).toBeTruthy();
      // the id in the frontmatter and the one in the filename must agree
      expect(name.startsWith(`${ticket?.id}-`)).toBe(true);
    }
  });

  it('keeps the body and strips the frontmatter', () => {
    const ticket = parseTicket('---\nid: "042"\ntitle: Thing\nstate: backlog\n---\n\n## Goal\n\nDo it.\n', '042-thing.md');
    expect(ticket?.title).toBe('Thing');
    expect(ticket?.body).toContain('## Goal');
    expect(ticket?.body).not.toContain('id:');
  });

  it('refuses a file without frontmatter', () => {
    expect(parseTicket('# just markdown\n', 'x.md')).toBeNull();
  });
});
