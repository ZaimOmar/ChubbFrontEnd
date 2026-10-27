import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AppError } from '../../core/http/app-error';
import { ClaimTimelineComponent } from './claim-timeline.component';
import { TimelineAudience, TimelineEntry } from './timeline-entry.model';

function entry(overrides: Partial<TimelineEntry>): TimelineEntry {
  return {
    id: 'e1',
    occurredAt: '2026-10-28T09:12:00Z',
    summary: 'Claim received',
    visibility: 'Public',
    kind: 'Standard',
    actorRole: 'Claimant',
    ...overrides,
  };
}

const ENTRIES: TimelineEntry[] = [
  entry({
    id: 'e3',
    occurredAt: '2026-10-28T14:02:00Z',
    summary: 'Decision confirmed',
    visibility: 'Internal',
    actorRole: 'Manager',
    actorName: 'Mark Lee',
    makerName: 'Aisha Tan',
    checkerName: 'Mark Lee',
    proposalId: 'PRP-12',
  }),
  entry({ id: 'e1' }),
  entry({
    id: 'e2',
    occurredAt: '2026-10-28T11:30:00Z',
    summary: 'Decision proposed',
    visibility: 'Internal',
    actorRole: 'Officer',
    actorName: 'Aisha Tan',
    reason: 'repair quote verified',
    correctedBy: 'e9',
  }),
  entry({
    id: 'e4',
    occurredAt: '2026-10-28T14:03:00Z',
    summary: 'Refused: tried to confirm own proposal',
    visibility: 'Internal',
    kind: 'Refused',
    actorRole: 'Officer',
    actorName: 'Aisha Tan',
  }),
  entry({
    id: 'e5',
    occurredAt: '2026-10-28T14:04:00Z',
    summary: 'Earlier entry corrected',
    visibility: 'Internal',
    kind: 'Correction',
    actorRole: 'Manager',
  }),
  entry({
    id: 'e6',
    occurredAt: '2026-10-28T10:01:00Z',
    summary: 'Claim picked up for review',
    actorRole: 'Officer',
    actorName: 'Olivia Officer',
  }),
];

describe('ClaimTimeline', () => {
  let fixture: ComponentFixture<ClaimTimelineComponent>;
  let root: HTMLElement;

  function render(inputs: {
    entries?: TimelineEntry[];
    audience?: TimelineAudience;
    loading?: boolean;
    error?: AppError | null;
  }): void {
    fixture = TestBed.createComponent(ClaimTimelineComponent);
    for (const [key, value] of Object.entries(inputs)) fixture.componentRef.setInput(key, value);
    fixture.detectChanges();
    root = fixture.nativeElement as HTMLElement;
  }

  const items = () => Array.from(root.querySelectorAll('ol > li'));

  it('StaffAudience_ShowsAllEntriesWithVisibilityBadgesActorsReasonMakerChecker', () => {
    render({ entries: ENTRIES, audience: 'staff' });
    const text = root.textContent ?? '';
    expect(items().length).toBe(6);
    for (const word of ['Public', 'Internal', 'Refused', 'Correction'])
      expect(text).toContain(word);
    expect(text).toContain('by Aisha Tan (Officer)');
    expect(text).toContain('Reason: repair quote verified');
    expect(text).toContain('maker Aisha Tan');
    expect(text).toContain('checker Mark Lee');
    expect(text).toContain('Proposal PRP-12');
    expect(text).toContain('Corrected by e9');
  });

  it('ClaimantAudience_ShowsOnlyPublic_NoBadgesIdsOrNames', () => {
    render({ entries: ENTRIES, audience: 'claimant' });
    const text = root.textContent ?? '';
    expect(items().length).toBe(2);
    expect(text).toContain('by Claimant');
    expect(text).toContain('by Officer');
    for (const hidden of ['Public', 'Internal', 'Olivia', 'Aisha', 'PRP-12', 'Reason'])
      expect(text).not.toContain(hidden);
  });

  it('ClaimantAudience_InternalEntryFromServer_IsNotRendered', () => {
    render({
      entries: [entry({ summary: 'secret note', visibility: 'Internal' })],
      audience: 'claimant',
    });
    expect(root.textContent).not.toContain('secret note');
    expect(root.textContent).toContain('No activity yet.');
  });

  it('ClaimantAudience_CorrectionEntry_IsNotRendered', () => {
    render({ entries: [entry({ summary: 'fixed', kind: 'Correction' })], audience: 'claimant' });
    expect(root.textContent).not.toContain('fixed');
  });

  it('Entries_RenderedOldestFirstInOrderedList', () => {
    render({ entries: ENTRIES, audience: 'staff' });
    const times = Array.from(root.querySelectorAll('ol time')).map((t) =>
      t.getAttribute('datetime'),
    );
    expect(times).toEqual([...times].sort());
    expect(times[0]).toBe('2026-10-28T09:12:00Z');
    expect(root.querySelector('ol')).not.toBeNull();
  });

  it('Loading_ShowsProgressAndBusy', () => {
    render({ loading: true });
    expect(root.querySelector('mat-progress-bar')).not.toBeNull();
    expect(root.querySelector('section')?.getAttribute('aria-busy')).toBe('true');
    expect(items().length).toBe(0);
  });

  it('Empty_ShowsNoActivityYet', () => {
    render({ entries: [] });
    expect(root.textContent).toContain('No activity yet.');
    expect(root.textContent).not.toContain('Jump to latest');
  });

  it('Error_ShowsMessageAndReferenceAndRetryEmits', () => {
    render({
      error: {
        status: 500,
        kind: 'server',
        message: 'Something went wrong. Please try again.',
        correlationId: '3f2b8c1e-9d4a-4e7b-8a6c-1f2e3d4c5b6a',
      },
    });
    let retries = 0;
    fixture.componentInstance.retry.subscribe(() => retries++);
    expect(root.querySelector('[role="alert"]')?.textContent).toContain('Something went wrong');
    expect(root.textContent).toContain('3f2b8c1e-9d4a-4e7b-8a6c-1f2e3d4c5b6a');
    (root.querySelector('button') as HTMLButtonElement).click();
    expect(retries).toBe(1);
  });

  it('SummaryWithHtml_IsRenderedAsText', () => {
    render({ entries: [entry({ summary: '<img src=x onerror=alert(1)><b>bold</b>' })] });
    expect(root.querySelector('ol img')).toBeNull();
    expect(root.querySelector('ol b')).toBeNull();
    expect(root.textContent).toContain('<b>bold</b>');
  });

  it('Headings_AreUniquePerInstance', () => {
    const ids = [0, 1].map(() => {
      const fixture = TestBed.createComponent(ClaimTimelineComponent);
      fixture.detectChanges();
      const el = fixture.nativeElement as HTMLElement;
      const id = el.querySelector('h2')?.id;
      expect(el.querySelector('section')?.getAttribute('aria-labelledby')).toBe(id as string);
      return id;
    });
    expect(ids[0]).not.toBe(ids[1]);
  });
});
