import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  inject,
  input,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map } from 'rxjs';
import { BreadcrumbService, crumbsFor } from '../../core/layout/breadcrumbs';
import { ListNavService } from '../../core/layout/list-nav';

const CLAIM_ID = /\/claims\/([^/?#]+)/;

/**
 * Title row of every page (40px): breadcrumb on the left, previous/next claim and page actions on
 * the right. The h1 is optional and can be visually hidden when a card repeats the title.
 */
@Component({
  selector: 'app-page-header',
  imports: [MatIconModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './page-header.component.scss',
  template: `
    <div class="row">
      <nav class="crumbs" aria-label="Breadcrumb">
        <ol>
          @for (crumb of crumbs(); track $index; let last = $last) {
            <li>
              @if (crumb.url && !last) {
                <a [routerLink]="crumb.url">{{ crumb.label }}</a>
                <mat-icon aria-hidden="true">chevron_right</mat-icon>
              } @else {
                <span [attr.aria-current]="last ? 'page' : null">{{ crumb.label }}</span>
              }
            </li>
          }
        </ol>
      </nav>
      <span class="spacer"></span>
      @if (neighbours(); as n) {
        <span class="pn">
          <button
            type="button"
            aria-label="Previous claim"
            [disabled]="!n.prev"
            (click)="go(n.prev)"
          >
            <mat-icon aria-hidden="true">chevron_left</mat-icon>
          </button>
          <span class="pn-count">{{ n.index + 1 }} / {{ n.total }}</span>
          <button type="button" aria-label="Next claim" [disabled]="!n.next" (click)="go(n.next)">
            <mat-icon aria-hidden="true">chevron_right</mat-icon>
          </button>
        </span>
      }
      <div class="actions"><ng-content select="[headerExtra]" /></div>
    </div>
    @if (title()) {
      <h1 [class.cdk-visually-hidden-text]="hiddenTitle()">{{ title() }}</h1>
    }
  `,
})
export class PageHeaderComponent {
  readonly title = input('');
  readonly hiddenTitle = input(false);

  private readonly router = inject(Router);
  private readonly breadcrumbs = inject(BreadcrumbService);
  private readonly listNav = inject(ListNavService);
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  protected readonly crumbs = computed(() =>
    crumbsFor(this.url(), this.breadcrumbs.leaf(), this.listNav.listUrl()),
  );

  /** Previous / next claim in the list the user came from (only when the claim is in that page). */
  protected readonly neighbours = computed(() => {
    const id = CLAIM_ID.exec(this.url().split('?')[0])?.[1];
    const ids = this.listNav.ids();
    if (!id || this.url().includes('/propose')) return null;
    const index = ids.indexOf(id);
    if (index < 0) return null;
    return { index, total: ids.length, prev: ids[index - 1] ?? null, next: ids[index + 1] ?? null };
  });

  protected go(id: string | null): void {
    if (id) void this.router.navigateByUrl(`${this.listNav.linkBase()}/${id}`);
  }

  /** Esc leaves a claim detail for the same list state. */
  @HostListener('document:keydown.escape', ['$event'])
  protected onEscape(event: Event): void {
    const target = event.target as HTMLElement | null;
    const typing = !!target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);
    const detail = CLAIM_ID.test(this.url().split('?')[0]) && !this.url().includes('/propose');
    const listUrl = this.listNav.listUrl();
    if (detail && listUrl && !typing && !document.querySelector('.cdk-overlay-pane')) {
      void this.router.navigateByUrl(listUrl);
    }
  }
}
