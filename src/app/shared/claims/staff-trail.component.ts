import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { AppError } from '../../core/http/app-error';
import { ClaimTimelineComponent } from '../claim-timeline/claim-timeline.component';
import { TimelineEntry } from '../claim-timeline/timeline-entry.model';

type TrailFilter = 'all' | 'Public' | 'Internal';

/** Full staff trail with the All / Public / Internal filter (mockups 05 and 09). */
@Component({
  selector: 'app-staff-trail',
  imports: [MatButtonToggleModule, ClaimTimelineComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    mat-button-toggle-group {
      margin-bottom: 16px;
      padding: 4px;
      background: var(--slate-100);
      border: 1px solid var(--slate-200);
      border-radius: 12px;
      font: 400 12px/16px var(--font-mono);
      --mat-button-toggle-shape: 8px;
      --mat-button-toggle-background-color: transparent;
      --mat-button-toggle-selected-state-background-color: #fff;
      --mat-button-toggle-selected-state-text-color: #4f46e5;
      --mat-button-toggle-text-color: #475569;
      --mat-button-toggle-divider-color: transparent;
      --mat-button-toggle-height: 32px;
    }
    mat-button-toggle {
      border-radius: 8px;
      font-weight: 700;
    }
    mat-button-toggle.mat-button-toggle-checked {
      box-shadow: var(--shadow-sm);
    }
  `,
  template: `
    <mat-button-toggle-group
      aria-label="Filter trail by visibility"
      [value]="filter()"
      (change)="filter.set($event.value)"
    >
      <mat-button-toggle value="all">All</mat-button-toggle>
      <mat-button-toggle value="Public">Public</mat-button-toggle>
      <mat-button-toggle value="Internal">Internal</mat-button-toggle>
    </mat-button-toggle-group>
    <app-claim-timeline
      audience="staff"
      [entries]="visible()"
      [loading]="loading()"
      [error]="error()"
      (retry)="retry.emit()"
    />
  `,
})
export class StaffTrailComponent {
  readonly entries = input<readonly TimelineEntry[]>([]);
  readonly loading = input(false);
  readonly error = input<AppError | null>(null);
  readonly retry = output<void>();

  protected readonly filter = signal<TrailFilter>('all');
  protected readonly visible = computed(() =>
    this.filter() === 'all'
      ? this.entries()
      : this.entries().filter((e) => e.visibility === this.filter()),
  );
}
