import { formatDate } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';

export type DateTimeStyle = 'dateTime' | 'date';

const FORMATS: Record<DateTimeStyle, string> = {
  dateTime: 'dd MMM yyyy, HH:mm',
  date: 'dd MMM yyyy',
};

/** API values are UTC; they are shown in the user's local time zone (00 section 4). */
@Pipe({ name: 'dateTime' })
export class DateTimePipe implements PipeTransform {
  transform(value: string | Date | null | undefined, style: DateTimeStyle = 'dateTime'): string {
    if (value === null || value === undefined || value === '') return '';
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? '' : formatDate(date, FORMATS[style], 'en-US');
  }
}
