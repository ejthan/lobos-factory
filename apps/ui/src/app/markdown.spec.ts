import { TestBed } from '@angular/core/testing';
import { MarkdownPipe } from './markdown';

describe('MarkdownPipe', () => {
  const pipe = () => TestBed.runInInjectionContext(() => new MarkdownPipe());

  it('renders markdown', () => {
    expect(String(pipe().transform('## Goal'))).toContain('<h2');
  });

  it('survives an empty spec', () => {
    expect(pipe().transform('')).toBe('');
    expect(pipe().transform(null)).toBe('');
  });

  it('strips script tags', () => {
    expect(String(pipe().transform('<script>alert(1)</script>ok'))).not.toContain('<script');
  });
});
