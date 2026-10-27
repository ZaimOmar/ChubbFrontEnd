import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';

// The app runs zoneless, so tests must too.
beforeEach(() => {
  TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
});
