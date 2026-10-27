import { Routes } from '@angular/router';
import { AreaPlaceholderComponent } from '../../shared/area-placeholder/area-placeholder.component';

export const MANAGER_ROUTES: Routes = [
  {
    path: '**',
    component: AreaPlaceholderComponent,
    title: 'Manager area - Chubb Claims',
    data: { title: 'Manager area' },
  },
];
