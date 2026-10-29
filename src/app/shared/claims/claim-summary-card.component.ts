import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

export type SummarySection = 'Claim' | 'Money' | 'Handling' | 'Description';

export interface SummaryItem {
  readonly label: string;
  readonly value: string;
  readonly section: SummarySection;
  /** Money amounts: mono, right-aligned; the first one is emphasised. */
  readonly numeric?: boolean;
  readonly emphasis?: boolean;
  /** The value is not set yet (shown as a muted dash chip). */
  readonly unset?: boolean;
}

const SECTION_ORDER: readonly SummarySection[] = ['Claim', 'Money', 'Handling'];
const LONG_DESCRIPTION = 160;

/** Claim summary in titled sections, with a responsive value grid and a clamped description. */
@Component({
  selector: 'app-claim-summary-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    :host {
      display: block;
      container-type: inline-size;
    }
    h2 {
      margin-bottom: 16px;
    }
    section.part {
      padding-top: 12px;
      margin-top: 12px;
      border-top: 1px solid var(--slate-100);
    }
    section.part:first-of-type {
      padding-top: 0;
      margin-top: 0;
      border-top: 0;
    }
    h3.title {
      margin: 0 0 8px;
      font: 700 10px/16px var(--font-mono);
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--slate-500);
    }
    dl {
      margin: 0;
      display: grid;
      gap: 12px 16px;
      grid-template-columns: 1fr;
    }
    @container (min-width: 360px) {
      dl {
        grid-template-columns: repeat(2, 1fr);
      }
    }
    @container (min-width: 560px) {
      dl {
        grid-template-columns: repeat(3, 1fr);
      }
    }
    dt {
      font: 700 10px/16px var(--font-mono);
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--slate-500);
    }
    dd {
      margin: 0;
      font: 400 14px/20px var(--font-sans);
      color: var(--slate-900);
      overflow-wrap: anywhere;
    }
    dd.num {
      font-family: var(--font-mono);
      font-variant-numeric: tabular-nums;
      text-align: right;
    }
    dd.emph {
      font-size: 16px;
      font-weight: 700;
    }
    .unset {
      display: inline-block;
      padding: 0 8px;
      font: 400 12px/20px var(--font-mono);
      color: var(--slate-500);
      background: var(--slate-100);
      border-radius: 9999px;
    }
    .desc {
      margin: 0;
      font: 400 14px/20px var(--font-sans);
      color: var(--slate-900);
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }
    .desc.clamp {
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .more {
      margin-top: 4px;
      padding: 0;
      font: 700 12px/16px var(--font-mono);
      color: var(--indigo-600);
      background: none;
      border: 0;
      cursor: pointer;
    }
    .more:focus-visible {
      outline: 2px solid var(--indigo-500);
      outline-offset: 2px;
    }
  `,
  template: `
    <section class="card" aria-labelledby="summary-title">
      <h2 id="summary-title">Claim summary</h2>
      @for (group of groups(); track group.title) {
        <section class="part" [attr.aria-label]="group.title">
          <h3 class="title">{{ group.title }}</h3>
          <dl>
            @for (item of group.items; track item.label) {
              <div>
                <dt>{{ item.label }}</dt>
                <dd [class.num]="item.numeric" [class.emph]="item.emphasis">
                  @if (item.unset) {
                    <span class="unset"
                      >&ndash; <span class="cdk-visually-hidden-text">Not set</span></span
                    >
                  } @else {
                    {{ item.value }}
                  }
                </dd>
              </div>
            }
          </dl>
        </section>
      }
      @if (description(); as text) {
        <section class="part" aria-label="Description">
          <h3 class="title">Description</h3>
          <p class="desc" [id]="'summary-desc'" [class.clamp]="isLong() && !expanded()">
            {{ text }}
          </p>
          @if (isLong()) {
            <button
              type="button"
              class="more"
              aria-controls="summary-desc"
              [attr.aria-expanded]="expanded()"
              (click)="expanded.set(!expanded())"
            >
              {{ expanded() ? 'Show less' : 'Show more' }}
            </button>
          }
        </section>
      }
    </section>
  `,
})
export class ClaimSummaryCardComponent {
  readonly items = input.required<readonly SummaryItem[]>();
  protected readonly expanded = signal(false);

  protected readonly groups = computed(() =>
    SECTION_ORDER.map((title) => ({
      title,
      items: this.items().filter((i) => i.section === title),
    })).filter((g) => g.items.length > 0),
  );
  protected readonly description = computed(
    () => this.items().find((i) => i.section === 'Description')?.value ?? '',
  );
  protected readonly isLong = computed(() => this.description().length > LONG_DESCRIPTION);
}
