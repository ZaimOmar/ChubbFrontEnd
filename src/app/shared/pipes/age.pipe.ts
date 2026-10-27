import { inject, Pipe, PipeTransform } from '@angular/core';
import { NOW } from '../../core/auth/clock';

const MS_PER_HOUR = 3_600_000;

/** Calendar-time age: `3d 4h`, or `5h` under one day (BR-76). */
@Pipe({ name: 'age' })
export class AgePipe implements PipeTransform {
  private readonly now = inject(NOW);

  transform(from: string | Date | null | undefined): string {
    if (from === null || from === undefined || from === '') return '';
    const start = from instanceof Date ? from.getTime() : new Date(from).getTime();
    if (Number.isNaN(start)) return '';
    const totalHours = Math.max(0, Math.floor((this.now() - start) / MS_PER_HOUR));
    const days = Math.floor(totalHours / 24);
    return days > 0 ? `${days}d ${totalHours % 24}h` : `${totalHours}h`;
  }
}
