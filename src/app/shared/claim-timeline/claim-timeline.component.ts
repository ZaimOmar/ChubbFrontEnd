import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';
import { AppError } from '../../core/http/app-error';
import { EmptyStateComponent } from '../empty-state/empty-state.component';
import { ErrorPanelComponent } from '../error-panel/error-panel.component';
import { LoadingBarComponent } from '../loading-bar/loading-bar.component';
import { TimelineEntryComponent } from './timeline-entry.component';
import { TimelineAudience, TimelineEntry } from './timeline-entry.model';

let nextTimelineId = 0;

@Component({
  selector: 'app-claim-timeline',
  imports: [TimelineEntryComponent, LoadingBarComponent, EmptyStateComponent, ErrorPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './claim-timeline.component.scss',
  template: `
    <section class="card" [attr.aria-labelledby]="headingId" [attr.aria-busy]="loading()">
      <div class="card-head">
        <div>
          <h2 [id]="headingId">Claim timeline</h2>
          <p class="caption">Every step on this claim, oldest first.</p>
        </div>
      </div>
      @if (loading()) {
        <app-loading-bar variant="table" />
      } @else if (error(); as problem) {
        <app-error-panel
          [message]="problem.message"
          [correlationId]="problem.correlationId"
          (retry)="retry.emit()"
        />
      } @else if (visibleEntries().length === 0) {
        <app-empty-state message="No activity yet." icon="history" />
      } @else {
        @if (visibleEntries().length > 8) {
          <button type="button" class="jump" (click)="jumpToLatest()">Jump to latest</button>
        }
        <ol #list class="timeline">
          @for (entry of visibleEntries(); track entry.id) {
            <li tabindex="-1">
              <app-timeline-entry [entry]="entry" [audience]="audience()" />
            </li>
          }
        </ol>
      }
    </section>
  `,
})
export class ClaimTimelineComponent {
  /** Unique per instance so two timelines on one page do not share a heading id. */
  protected readonly headingId = `timeline-heading-${nextTimelineId++}`;

  readonly entries = input<readonly TimelineEntry[]>([]);
  readonly audience = input<TimelineAudience>('staff');
  readonly loading = input(false);
  readonly error = input<AppError | null>(null);
  readonly retry = output<void>();

  private readonly list = viewChild<ElementRef<HTMLOListElement>>('list');

  /**
   * The server is authoritative for what a claimant may see. Dropping Internal and Correction
   * entries here is defence in depth only (BR-09, BR-74), never the rule itself.
   */
  protected readonly visibleEntries = computed(() => {
    const ordered = [...this.entries()].sort(
      (a, b) => Date.parse(a.occurredAt) - Date.parse(b.occurredAt),
    );
    return this.audience() === 'claimant'
      ? ordered.filter((e) => e.visibility === 'Public' && e.kind === 'Standard')
      : ordered;
  });

  protected jumpToLatest(): void {
    const last = this.list()?.nativeElement.lastElementChild as HTMLElement | null | undefined;
    last?.scrollIntoView?.({ block: 'center' });
    last?.focus();
  }
}
