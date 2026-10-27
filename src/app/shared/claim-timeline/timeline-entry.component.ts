import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DateTimePipe } from '../pipes/date-time.pipe';
import { TimelineAudience, TimelineEntry } from './timeline-entry.model';

interface VisibilityBadge {
  readonly label: string;
  readonly icon: string;
  readonly tone: string;
}

@Component({
  selector: 'app-timeline-entry',
  imports: [MatIconModule, DateTimePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrl: './timeline-entry.component.scss',
  template: `
    <div class="entry">
      <time [attr.datetime]="entry().occurredAt" [title]="entry().occurredAt">
        {{ entry().occurredAt | dateTime }}
      </time>
      @if (badge(); as b) {
        <span class="badge" [class]="'tone-' + b.tone">
          <mat-icon aria-hidden="true" [fontIcon]="b.icon" />{{ b.label }}
        </span>
      }
      <span class="summary">{{ entry().summary }}</span>
      <span class="actor">{{ actorText() }}</span>
      @if (isStaff()) {
        @if (entry().makerName || entry().checkerName) {
          <span class="detail">
            @if (entry().makerName) {
              maker {{ entry().makerName }}
            }
            @if (entry().checkerName) {
              checker {{ entry().checkerName }}
            }
          </span>
        }
        @if (entry().proposalId) {
          <span class="detail">Proposal {{ entry().proposalId }}</span>
        }
        @if (entry().correctedBy) {
          <span class="detail">Corrected by {{ entry().correctedBy }}</span>
        }
      }
      @if (entry().reason) {
        <span class="detail">Reason: {{ entry().reason }}</span>
      }
    </div>
  `,
})
export class TimelineEntryComponent {
  readonly entry = input.required<TimelineEntry>();
  readonly audience = input.required<TimelineAudience>();

  protected readonly isStaff = computed(() => this.audience() === 'staff');

  /** Badges are staff-only (US-09, BR-09). */
  protected readonly badge = computed<VisibilityBadge | null>(() => {
    if (!this.isStaff()) return null;
    const { kind, visibility } = this.entry();
    if (kind === 'Refused') return { label: 'Refused', icon: 'warning', tone: 'refused' };
    if (kind === 'Correction')
      return { label: 'Correction', icon: 'edit_note', tone: 'correction' };
    return visibility === 'Internal'
      ? { label: 'Internal', icon: 'lock', tone: 'internal' }
      : { label: 'Public', icon: 'visibility', tone: 'public' };
  });

  /** Claimants see the role only, never a name. */
  protected readonly actorText = computed(() => {
    const { actorName, actorRole } = this.entry();
    return this.isStaff() && actorName ? `by ${actorName} (${actorRole})` : `by ${actorRole}`;
  });
}
