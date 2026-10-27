import { Routes } from '@angular/router';
import { AreaPlaceholderComponent } from '../../shared/area-placeholder/area-placeholder.component';

export const STAFF_ROUTES: Routes = [
  {
    path: '**',
    component: AreaPlaceholderComponent,
    title: 'Officer area - Chubb Claims',
    data: { title: 'Officer area' },
  },
];
