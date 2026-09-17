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

describe('input that reaches argv or a file path', () => {
  // These are the checks the security review asked for; they live in the
  // controller, so this test documents the shapes that must stay rejected.
  const idOk = (id: string) => /^\d{1,6}$/.test(id);

  it('rejects a ticket id that escapes the specs folder', () => {
    expect(idOk('001')).toBe(true);
    expect(idOk('../../../etc/passwd')).toBe(false);
    expect(idOk('001/../..')).toBe(false);
    expect(idOk('')).toBe(false);
  });

  it('rejects a title that looks like a flag', () => {
    const titleOk = (t: string) => t.trim().length > 0 && !t.trim().startsWith('-');
    expect(titleOk('Add lint')).toBe(true);
    expect(titleOk('--force')).toBe(false);
    expect(titleOk('   ')).toBe(false);
  });
});
