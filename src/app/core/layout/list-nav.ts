import { Injectable, signal } from '@angular/core';

/**
 * Remembers the list the user came from (URL with filters, sort and page) and its claim ids, so a
 * detail page can return to the same state and step to the previous or next claim.
 */
@Injectable({ providedIn: 'root' })
export class ListNavService {
  readonly listUrl = signal<string | null>(null);
  readonly ids = signal<readonly string[]>([]);
  readonly linkBase = signal('');

  remember(url: string, ids: readonly string[], linkBase: string): void {
    this.listUrl.set(url);
    this.ids.set(ids);
    this.linkBase.set(linkBase);
  }
}
