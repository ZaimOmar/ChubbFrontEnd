import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  Injector,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { BreadcrumbService, crumbsFor } from './breadcrumbs';
import { navGroupsFor } from './nav-items';
import { ShellComponent } from './shell.component';

/** Wires the presentational shell to the session and the router. */
@Component({
  selector: 'app-shell-container',
  imports: [ShellComponent, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-shell
      [userName]="userName()"
      [roleText]="roleText()"
      [crumbs]="crumbs()"
      [groups]="groups()"
      [homeUrl]="auth.landingUrl()"
      (logout)="logout()"
    >
      <router-outlet />
    </app-shell>
  `,
})
export class ShellContainerComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly shell = viewChild.required(ShellComponent);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  protected readonly userName = computed(() => this.auth.user()?.name ?? '');
  protected readonly roleText = computed(() => this.auth.roles().join(' + '));
  protected readonly groups = computed(() => navGroupsFor(this.auth.roles()));
  private readonly breadcrumbs = inject(BreadcrumbService);
  protected readonly crumbs = computed(() => crumbsFor(this.url(), this.breadcrumbs.leaf()));

  constructor() {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe(() =>
        afterNextRender(() => this.shell().focusContent(), { injector: this.injector }),
      );
  }

  protected logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
}
