import { Pipe, PipeTransform, SecurityContext } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { inject } from '@angular/core';
import { marked } from 'marked';

@Pipe({ name: 'markdown' })
export class MarkdownPipe implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer);
  transform(value: string | null | undefined): SafeHtml {
    if (!value) return '';
    const html = marked.parse(value, { async: false }) as string;
    return this.sanitizer.sanitize(SecurityContext.HTML, html) ?? '';
  }
}
