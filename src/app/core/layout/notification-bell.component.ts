import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Router } from '@angular/router';
import { catchError, EMPTY, of, startWith, Subject, switchMap, timer } from 'rxjs';
import { NotificationView } from '../../api/model/models';
import { DateTimePipe } from '../../shared/pipes/date-time.pipe';
import { DashboardFacade } from '../dashboard/dashboard.facade';

const POLL_MS = 60_000;

/** Where a notification's claim opens, by the kind of event (UX routing only). */
function claimUrl(n: NotificationView): string {
  const area =
    n.kind === 'DecisionAwaitsCheck'
      ? 'manager'
      : n.kind === 'ClaimAssigned'
        ? 'staff'
        : 'claimant';
  return `/${area}/claims/${n.claimId}`;
}

/** Top-bar bell with an unread badge and a popover list (polls every 60 s, refreshes on open). */
@Component({
  selector: 'app-notification-bell',
  imports: [MatIconModule, MatMenuModule, DateTimePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './notification-bell.component.scss',
  template: `
    <button
      type="button"
      class="bell"
      [matMenuTriggerFor]="panel"
      [attr.aria-label]="label()"
      (menuOpened)="refresh.next()"
    >
      <mat-icon aria-hidden="true">notifications</mat-icon>
      @if (unread() > 0) {
        <span class="badge" aria-hidden="true">{{ unread() > 9 ? '9+' : unread() }}</span>
      }
    </button>
    <mat-menu #panel="matMenu" class="notification-panel" xPosition="before">
      <div
        class="panel-head"
        (click)="$event.stopPropagation()"
        (keydown)="$event.stopPropagation()"
      >
        <h2>Notifications</h2>
      </div>
      @if (loading() && items().length === 0) {
        <div class="skeleton" aria-hidden="true">
          <div class="bar w66 shimmer-bg"></div>
          <div class="bar w33 shimmer-bg"></div>
          <div class="bar w66 shimmer-bg"></div>
        </div>
      } @else if (items().length === 0) {
        <p class="empty">No notifications.</p>
      } @else {
        @for (n of items(); track n.id) {
          <button mat-menu-item type="button" class="item" (click)="open(n)">
            <span class="msg" [class.unread]="!n.readAt">
              @if (!n.readAt) {
                <span class="dot" aria-hidden="true"></span>
                <span class="cdk-visually-hidden-text">Unread: </span>
              }
              {{ n.message }}
            </span>
            <span class="when">{{ n.createdAt | dateTime }}</span>
          </button>
        }
      }
    </mat-menu>
  `,
})
export class NotificationBellComponent {
  private readonly facade = inject(DashboardFacade);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly refresh = new Subject<void>();
  protected readonly items = signal<readonly NotificationView[]>([]);
  protected readonly loading = signal(true);
  protected readonly unread = computed(() => this.items().filter((n) => !n.readAt).length);
  protected readonly label = computed(() =>
    this.unread() > 0 ? `Notifications, ${this.unread()} unread` : 'Notifications, none unread',
  );

  constructor() {
    this.refresh
      .pipe(
        startWith(undefined),
        switchMap(() => timer(0, POLL_MS)),
        switchMap(() => this.facade.latestNotifications().pipe(catchError(() => EMPTY))),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((page) => {
        this.items.set(page.items);
        this.loading.set(false);
      });
  }

  protected open(n: NotificationView): void {
    if (!n.readAt) {
      this.items.update((list) =>
        list.map((i) => (i.id === n.id ? { ...i, readAt: new Date().toISOString() } : i)),
      );
      this.facade
        .markNotificationRead(n.id)
        .pipe(
          catchError(() => of(null)),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe();
    }
    if (n.claimId) void this.router.navigateByUrl(claimUrl(n));
  }
}
