import { BreakpointObserver } from '@angular/cdk/layout';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { map } from 'rxjs';
import { NavGroup } from './nav-items';

@Component({
  selector: 'app-shell',
  imports: [
    MatToolbarModule,
    MatSidenavModule,
    MatButtonModule,
    MatIconModule,
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
  /** Role area derived from the URL prefix (mockup 00 section 1); empty outside an area. */
  readonly areaLabel = input('');
  readonly groups = input.required<readonly NavGroup[]>();
  readonly logout = output<void>();

  private readonly main = viewChild.required<ElementRef<HTMLElement>>('main');
  private readonly breakpoints = inject(BreakpointObserver);
  protected readonly isNarrow = toSignal(
    this.breakpoints.observe('(max-width: 959.98px)').pipe(map((state) => state.matches)),
    { initialValue: false },
  );
  protected readonly showHeadings = computed(() => this.groups().length > 1);

  /** Moves focus to the page heading (or main) after navigation so keyboard and screen reader users land on the new content. */
  focusContent(): void {
    const main = this.main().nativeElement;
    (main.querySelector<HTMLElement>('h1') ?? main).focus();
  }

  protected closeIfNarrow(drawer: MatSidenav): void {
    if (this.isNarrow()) void drawer.close();
  }

  protected skipToMain(event: Event, main: HTMLElement): void {
    event.preventDefault();
    main.focus();
  }
}
