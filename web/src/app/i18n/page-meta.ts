import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { I18n } from './i18n';
import { DEFAULT_LANG, Lang, SUPPORTED_LANGS } from './languages';
import { SITE_URL } from './site';

export type PageKind = 'landing' | 'tool';

const PATHS: Record<PageKind, string> = { landing: '', tool: '/amistoso' };

@Injectable({ providedIn: 'root' })
export class PageMeta {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly document = inject(DOCUMENT);
  private readonly i18n = inject(I18n);
  private readonly siteUrl = inject(SITE_URL);

  apply(kind: PageKind): void {
    const { title, description } = this.i18n.t().meta[kind];
    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });
    this.updateLinks(kind);
  }

  private updateLinks(kind: PageKind): void {
    this.document.head.querySelectorAll('link[data-kora-seo]').forEach((el) => el.remove());

    const origin = this.siteUrl.replace(/\/+$/, '');
    if (!origin) return;

    const urlFor = (lang: Lang) => `${origin}/${lang}${PATHS[kind]}`;
    this.addLink('canonical', urlFor(this.i18n.lang()));
    for (const lang of SUPPORTED_LANGS) this.addLink('alternate', urlFor(lang), lang);
    this.addLink('alternate', urlFor(DEFAULT_LANG), 'x-default');
  }

  private addLink(rel: string, href: string, hreflang?: string): void {
    const link = this.document.createElement('link');
    link.setAttribute('rel', rel);
    link.setAttribute('href', href);
    if (hreflang) link.setAttribute('hreflang', hreflang);
    link.setAttribute('data-kora-seo', '');
    this.document.head.appendChild(link);
  }
}
