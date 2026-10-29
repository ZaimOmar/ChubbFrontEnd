import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';

const GROUPS: readonly { title: string; items: readonly (readonly [string, string])[] }[] = [
  {
    title: 'Global',
    items: [
      ['Ctrl+K', 'Command palette'],
      ['?', 'This help'],
      ['[', 'Collapse or expand the rail'],
      ['g h', 'Go to Home'],
      ['g q', 'Go to the queue (officer)'],
      ['g p', 'Go to pending approvals (manager)'],
      ['g o', 'Go to outstanding claims (manager)'],
      ['g c', 'Go to my claims (claimant)'],
      ['g r', 'Report an incident (claimant)'],
    ],
  },
  {
    title: 'Lists',
    items: [
      ['j / k or arrows', 'Move between rows'],
      ['Enter', 'Open the focused claim'],
      ['/', 'Filter by claim number'],
      ['x', 'Mark or unmark the focused row'],
      ['p', 'Pick up the focused claim (queue)'],
      ['r', 'Refresh the list'],
    ],
  },
  {
    title: 'Claim and forms',
    items: [
      ['Esc', 'Back to the list; on the report form, cancel'],
      ['Ctrl+Enter', 'Submit the report form'],
    ],
  },
];

@Component({
  selector: 'app-shortcuts-help',
  imports: [MatDialogModule, MatButtonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    h3 {
      margin: 12px 0 4px;
      font: 700 10px/16px var(--font-mono);
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: var(--slate-500);
    }
    dl {
      display: grid;
      grid-template-columns: 140px 1fr;
      gap: 4px 12px;
      margin: 0;
      font: 400 12px/16px var(--font-mono);
    }
    dt kbd {
      padding: 0 6px;
      border: 1px solid var(--slate-300);
      border-radius: 4px;
      background: var(--slate-50);
    }
    dd {
      margin: 0;
      color: var(--slate-600);
    }
  `,
  template: `
    <h2 mat-dialog-title>Keyboard shortcuts</h2>
    <mat-dialog-content>
      @for (group of groups; track group.title) {
        <h3>{{ group.title }}</h3>
        <dl>
          @for (item of group.items; track item[0]) {
            <dt>
              <kbd>{{ item[0] }}</kbd>
            </dt>
            <dd>{{ item[1] }}</dd>
          }
        </dl>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-flat-button type="button" mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
})
export class ShortcutsHelpComponent {
  protected readonly groups = GROUPS;
}
