import { Routes } from '@angular/router';
import { AreaPlaceholderComponent } from '../../shared/area-placeholder/area-placeholder.component';

export const CLAIMANT_ROUTES: Routes = [
  {
    path: '**',
    component: AreaPlaceholderComponent,
    title: 'Claimant area - Chubb Claims',
    data: { title: 'Claimant area' },
  },
];
