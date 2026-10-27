import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { navGroupsFor } from './nav-items';
import { ShellComponent } from './shell.component';
import { Role } from '../auth/roles';

@Component({
  imports: [ShellComponent],
  template: `<app-shell
    userName="Aisha Tan"
    areaLabel="Officer"
    [roleText]="roles.join(' + ')"
    [groups]="groups"
    (logout)="logouts = logouts + 1"
    ><p>content</p></app-shell
  >`,
})
class HostComponent {
  roles: Role[] = ['Officer'];
  groups = navGroupsFor(this.roles);
  logouts = 0;
}

describe('Shell', () => {
  async function render(roles: Role[]): Promise<ComponentFixture<HostComponent>> {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [provideRouter([{ path: 'staff/queue', component: HostComponent }])],
    }).compileComponents();
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.roles = roles;
    fixture.componentInstance.groups = navGroupsFor(roles);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  const text = (f: ComponentFixture<unknown>) => (f.nativeElement as HTMLElement).textContent ?? '';

  it('DualRole_ShowsOfficerAndManagerGroups', async () => {
    const fixture = await render(['Officer', 'Manager']);
    const headings = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('h2')).map(
      (h) => h.textContent?.trim(),
    );
    expect(headings).toEqual(['Officer', 'Manager']);
    expect(text(fixture)).toContain('Incoming queue');
    expect(text(fixture)).toContain('Pending approvals');
  });

  it('Claimant_ShowsOnlyClaimantItems', async () => {
    const fixture = await render(['Claimant']);
    expect(text(fixture)).toContain('Report incident');
    expect(text(fixture)).toContain('My claims');
    expect(text(fixture)).not.toContain('Incoming queue');
    expect(text(fixture)).not.toContain('Pending approvals');
  });

  it('HasLandmarksSkipLinkAndLogout', async () => {
    const fixture = await render(['Officer']);
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('header')).not.toBeNull();
    expect(root.querySelector('nav[aria-label="Main"]')).not.toBeNull();
    expect(root.querySelector('main#main-content')).not.toBeNull();
    expect(root.querySelector('a.skip-link')?.getAttribute('href')).toBe('#main-content');
    expect(text(fixture)).toContain('Aisha Tan (Officer)');
    (
      Array.from(root.querySelectorAll('button')).find((b) =>
        b.textContent?.includes('Logout'),
      ) as HTMLButtonElement
    ).click();
    expect(fixture.componentInstance.logouts).toBe(1);
  });

  it('ActiveLink_HasAriaCurrentPage', async () => {
    const fixture = await render(['Officer']);
    await TestBed.inject(Router).navigateByUrl('/staff/queue');
    fixture.detectChanges();
    const current = (fixture.nativeElement as HTMLElement).querySelectorAll(
      'a[aria-current="page"]',
    );
    expect(current.length).toBe(1);
    expect(current[0].textContent?.trim()).toBe('Incoming queue');
  });

  it('Toolbar_ShowsAreaLabelAndTruncatesLongNames', async () => {
    const fixture = await render(['Officer']);
    const root = fixture.nativeElement as HTMLElement;
    expect(text(fixture)).toContain('Area: Officer');
    const user = root.querySelector('.user') as HTMLElement;
    expect(getComputedStyle(user).textOverflow).toBe('ellipsis');
    expect(getComputedStyle(user).minWidth).toBe('0px');
  });

  it('FocusContent_MovesFocusToHeadingOrMain', async () => {
    const fixture = await render(['Officer']);
    const shell = fixture.debugElement.children[0].componentInstance as ShellComponent;
    shell.focusContent();
    expect(document.activeElement?.id).toBe('main-content');
  });
});
