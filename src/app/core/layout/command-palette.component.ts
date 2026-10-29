import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { catchError, debounceTime, map, Observable, of, Subject, switchMap } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { ClaimsFacade } from '../claims/claims.facade';
import { navGroupsFor } from './nav-items';
import { RecentClaimsService } from './recent-claims';
import { UiPrefsService } from './ui-prefs';

interface FoundClaim {
  readonly id: string;
  readonly claimNumber: string;
  readonly market: string;
  readonly type: string;
}

interface PaletteItem {
  readonly id: string;
  readonly label: string;
  readonly hint: string;
  readonly icon: string;
  readonly run: () => void;
}

/** Ctrl+K: go to a claim by number, jump to a screen, or run an action. */
@Component({
  selector: 'app-command-palette',
  imports: [MatDialogModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .box {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      border-bottom: 1px solid var(--slate-100);
    }
    input {
      flex: 1;
      min-width: 0;
      font: 400 14px/20px var(--font-mono);
      color: var(--slate-900);
      background: none;
      border: 0;
      outline: 0;
    }
    ul {
      max-height: 340px;
      margin: 0;
      padding: 8px;
      overflow: auto;
      list-style: none;
    }
    li {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 8px 12px;
      border-radius: 12px;
      font: 400 12px/16px var(--font-mono);
      color: var(--slate-700);
      cursor: pointer;
    }
    li[aria-selected='true'] {
      color: #fff;
      background: var(--indigo-600);
    }
    .hint {
      margin-left: auto;
      font-size: 10px;
      opacity: 0.8;
    }
    .empty {
      padding: 16px;
      font: 400 12px/16px var(--font-mono);
      color: var(--slate-500);
    }
    .group {
      padding: 8px 12px 0;
      font: 700 10px/16px var(--font-mono);
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--slate-500);
    }
  `,
  template: `
    <div class="box">
      <mat-icon aria-hidden="true">search</mat-icon>
      <input
        #box
        type="text"
        role="combobox"
        aria-label="Command palette"
        aria-controls="palette-list"
        aria-expanded="true"
        [attr.aria-activedescendant]="'palette-' + active()"
        placeholder="Go to a claim number, a screen, or an action"
        autocomplete="off"
        cdkFocusInitial
        (input)="onType(box.value)"
        (keydown)="onKey($event)"
      />
    </div>
    <ul id="palette-list" role="listbox" aria-label="Results">
      @for (item of items(); track item.id; let i = $index) {
        <li
          role="option"
          [id]="'palette-' + i"
          [attr.aria-selected]="i === active()"
          tabindex="-1"
          (click)="choose(item)"
          (keydown.enter)="choose(item)"
          (mousemove)="active.set(i)"
        >
          <mat-icon aria-hidden="true">{{ item.icon }}</mat-icon>
          <span>{{ item.label }}</span>
          <span class="hint">{{ item.hint }}</span>
        </li>
      }
    </ul>
    @if (items().length === 0) {
      <p class="empty">No matches. Type a claim number such as CLM-SG-2026-000001.</p>
    }
  `,
})
export class CommandPaletteComponent {
  private readonly ref = inject(MatDialogRef<CommandPaletteComponent>);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly claims = inject(ClaimsFacade);
  private readonly recent = inject(RecentClaimsService);
  private readonly prefs = inject(UiPrefsService);

  private readonly query = signal('');
  private readonly found = signal<readonly PaletteItem[]>([]);
  protected readonly active = signal(0);
  private readonly typed = new Subject<string>();

  private readonly base = computed(() => {
    const roles = this.auth.roles();
    return roles.includes('Officer')
      ? '/staff/claims'
      : roles.includes('Manager')
        ? '/manager/claims'
        : '/claimant/claims';
  });

  private readonly commands = computed<readonly PaletteItem[]>(() => {
    const nav = navGroupsFor(this.auth.roles()).flatMap((g) =>
      g.items.map((i) => ({
        id: `nav:${i.url}`,
        label: `Go to ${i.label}`,
        hint: g.heading,
        icon: i.icon,
        run: () => void this.router.navigateByUrl(i.url),
      })),
    );
    const actions: PaletteItem[] = [
      {
        id: 'density',
        label:
          this.prefs.density() === 'compact'
            ? 'Switch to comfortable density'
            : 'Switch to compact density',
        hint: 'Action',
        icon: 'density_small',
        run: () =>
          this.prefs.setDensity(this.prefs.density() === 'compact' ? 'comfortable' : 'compact'),
      },
    ];
    return [...nav, ...actions];
  });

  protected readonly items = computed<readonly PaletteItem[]>(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) {
      const recent = this.recent.list().map((r) => ({
        id: `recent:${r.id}`,
        label: r.number,
        hint: 'Recent',
        icon: 'history',
        run: () => void this.router.navigateByUrl(`${r.base}/${r.id}`),
      }));
      return [...recent, ...this.commands()];
    }
    return [...this.found(), ...this.commands().filter((c) => c.label.toLowerCase().includes(q))];
  });

  constructor() {
    this.typed
      .pipe(
        debounceTime(250),
        switchMap((q) => {
          const text = q.trim();
          if (text.length < 3) return of([] as readonly FoundClaim[]);
          const staff = this.auth.roles().some((r) => r === 'Officer' || r === 'Manager');
          const request: Observable<{ items: readonly FoundClaim[] }> = staff
            ? this.claims.listOldest({ filters: { claimNumber: text }, page: 1, pageSize: 5 })
            : this.claims.listMine(1, 5, 'newest', { claimNumber: text });
          return request.pipe(
            map((page): readonly FoundClaim[] => page.items),
            catchError(() => of([] as readonly FoundClaim[])),
          );
        }),
        takeUntilDestroyed(inject(DestroyRef)),
      )
      .subscribe((claims) => {
        this.found.set(
          claims.map((c) => ({
            id: `claim:${c.id}`,
            label: c.claimNumber,
            hint: `${c.market} ${c.type}`,
            icon: 'description',
            run: () => void this.router.navigateByUrl(`${this.base()}/${c.id}`),
          })),
        );
        this.active.set(0);
      });
  }

  protected onType(value: string): void {
    this.query.set(value);
    this.active.set(0);
    this.typed.next(value);
  }

  protected onKey(event: KeyboardEvent): void {
    const count = this.items().length;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.active.set(Math.min(count - 1, this.active() + 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.active.set(Math.max(0, this.active() - 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const item = this.items()[this.active()];
      if (item) this.choose(item);
    }
  }

  protected choose(item: PaletteItem): void {
    this.ref.close();
    item.run();
  }
}
