import { TestBed } from '@angular/core/testing';
import { FIXED_NOW_MS } from '../../../testing/jwt';
import { NOW } from '../../core/auth/clock';
import { AgePipe } from './age.pipe';
import { DateTimePipe } from './date-time.pipe';
import { MoneyPipe } from './money.pipe';

describe('MoneyPipe', () => {
  const pipe = new MoneyPipe();

  it('Transform_FormatsSgdIdrWithCode', () => {
    expect(pipe.transform(8000, 'SGD')).toBe('SGD 8,000.00');
    expect(pipe.transform(12500000, 'IDR')).toBe('IDR 12,500,000.00');
  });

  it('Transform_Null_ReturnsEmpty', () => {
    expect(pipe.transform(null, 'SGD')).toBe('');
    expect(pipe.transform(undefined, 'SGD')).toBe('');
  });
});

describe('DateTimePipe', () => {
  const pipe = new DateTimePipe();

  it('Transform_FormatsLocal', () => {
    const local = new Date(2026, 9, 28, 14, 5);
    expect(pipe.transform(local)).toBe('28 Oct 2026, 14:05');
    expect(pipe.transform(local, 'date')).toBe('28 Oct 2026');
  });

  it('Transform_UtcIsoString_ShownInLocalTime', () => {
    const iso = '2026-10-28T06:05:00Z';
    const expected = new DateTimePipe().transform(new Date(iso));
    expect(pipe.transform(iso)).toBe(expected);
  });

  it('Transform_EmptyOrInvalid_ReturnsEmpty', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform('garbage')).toBe('');
  });
});

describe('AgePipe', () => {
  it('Transform_DaysHoursAndHoursOnly', () => {
    TestBed.configureTestingModule({ providers: [{ provide: NOW, useValue: () => FIXED_NOW_MS }] });
    const pipe = TestBed.runInInjectionContext(() => new AgePipe());
    const ago = (hours: number) => new Date(FIXED_NOW_MS - hours * 3_600_000).toISOString();
    expect(pipe.transform(ago(76))).toBe('3d 4h');
    expect(pipe.transform(ago(5))).toBe('5h');
    expect(pipe.transform(ago(24))).toBe('1d 0h');
    expect(pipe.transform(null)).toBe('');
  });
});
