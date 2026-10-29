import { BreakpointObserver } from '@angular/cdk/layout';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { map } from 'rxjs';
import { ShortcutsService } from './shortcuts';
import { NavGroup } from './nav-items';
import { NotificationBellComponent } from './notification-bell.component';
import { UiPrefsService } from './ui-prefs';
import { UserMenuComponent } from './user-menu.component';

@Component({
  selector: 'app-shell',
  imports: [
    MatIconModule,
    MatTooltipModule,
    NotificationBellComponent,
    UserMenuComponent,
    RouterLink,
    RouterLinkActive,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './shell.component.scss',
  templateUrl: './shell.component.html',
})
export class ShellComponent {
  readonly userName = input.required<string>();
  readonly roleText = input.required<string>();
  readonly groups = input.required<readonly NavGroup[]>();
  readonly homeUrl = input('/');
  readonly logout = output<void>();

  protected readonly prefs = inject(UiPrefsService);
  protected readonly shortcuts = inject(ShortcutsService);
  private readonly main = viewChild.required<ElementRef<HTMLElement>>('main');
  private readonly breakpoints = inject(BreakpointObserver);
  protected readonly isMobile = toSignal(
    this.breakpoints.observe('(max-width: 599.98px)').pipe(map((state) => state.matches)),
    { initialValue: false },
  );
  protected readonly drawerOpen = signal(false);
  protected readonly isMultiGroup = computed(() => this.groups().length > 1);
  /** Desktop rail width; on phones the drawer always shows labels. */
  protected readonly expanded = computed(() => this.isMobile() || this.prefs.railExpanded());
  protected readonly bottomItems = computed(() =>
    this.groups()
      .flatMap((group) => group.items)
      .slice(0, 4),
  );

  protected labelFor(group: NavGroup, label: string): string {
    return this.isMultiGroup() ? `${group.heading}: ${label}` : label;
  }

  /** Moves focus to the page heading (or main) after navigation. */
  focusContent(): void {
    const main = this.main().nativeElement;
    (main.querySelector<HTMLElement>('h1') ?? main).focus();
    this.drawerOpen.set(false);
  }

  protected skipToMain(event: Event, main: HTMLElement): void {
    event.preventDefault();
    main.focus();
  }

  protected toggleRail(): void {
    if (this.isMobile()) this.drawerOpen.update((open) => !open);
    else this.prefs.toggleRail();
  }

  /** Global shortcuts: Ctrl+K, ?, g then a letter, and `[` for the rail. Ignored while typing. */
  @HostListener('document:keydown', ['$event'])
  protected onKey(event: KeyboardEvent): void {
    if (this.shortcuts.handle(event)) return;
    const target = event.target as HTMLElement | null;
    const typing = !!target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);
    if (event.key === '[' && !typing && !event.ctrlKey && !event.metaKey) this.toggleRail();
  }
}
