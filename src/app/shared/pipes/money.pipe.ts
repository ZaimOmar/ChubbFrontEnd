import { Pipe, PipeTransform } from '@angular/core';

/** `SGD 8,000.00`: always two decimals and the currency code, never a bare symbol (00 section 3). */
@Pipe({ name: 'money' })
export class MoneyPipe implements PipeTransform {
  transform(amount: number | null | undefined, currency: string | null | undefined): string {
    if (amount === null || amount === undefined || !currency) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      currencyDisplay: 'code',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
      .format(amount)
      .replaceAll('\u00a0', ' ');
  }
}
