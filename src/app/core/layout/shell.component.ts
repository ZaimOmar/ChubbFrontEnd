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
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NotificationBellComponent } from './notification-bell.component';
import { Crumb } from './breadcrumbs';
import { NavGroup } from './nav-items';

@Component({
  selector: 'app-shell',
  imports: [
    MatToolbarModule,
    MatTooltipModule,
    NotificationBellComponent,
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
  readonly crumbs = input<readonly Crumb[]>([]);
  readonly groups = input.required<readonly NavGroup[]>();
  readonly homeUrl = input('/');
  readonly logout = output<void>();

  private readonly main = viewChild.required<ElementRef<HTMLElement>>('main');
  protected readonly initials = computed(() =>
    this.userName()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join(''),
  );
  protected readonly isMultiGroup = computed(() => this.groups().length > 1);

  protected labelFor(group: NavGroup, label: string): string {
    return this.isMultiGroup() ? `${group.heading}: ${label}` : label;
  }

  /** Moves focus to the page heading (or main) after navigation so keyboard and screen reader users land on the new content. */
  focusContent(): void {
    const main = this.main().nativeElement;
    (main.querySelector<HTMLElement>('h1') ?? main).focus();
  }

  protected skipToMain(event: Event, main: HTMLElement): void {
    event.preventDefault();
    main.focus();
  }
}
