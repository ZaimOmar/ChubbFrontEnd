import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { NotificationsApi } from '../../api/api/notifications.service';
import { ReportingApi } from '../../api/api/reporting.service';
import {
  NotificationPage,
  ReportingExposureView,
  ReportingOfficerWorkloadView,
  ReportingOutstandingView,
} from '../../api/model/models';

/** Thin facade over the generated Reporting and Notifications clients. */
@Injectable({ providedIn: 'root' })
export class DashboardFacade {
  private readonly reporting = inject(ReportingApi);
  private readonly notifications = inject(NotificationsApi);

  outstanding(): Observable<ReportingOutstandingView> {
    return this.reporting.getOutstandingDashboard();
  }

  exposure(): Observable<ReportingExposureView> {
    return this.reporting.getExposureDashboard();
  }

  workload(): Observable<ReportingOfficerWorkloadView[]> {
    return this.reporting.getStaffWorkload();
  }

  markNotificationRead(id: string): Observable<unknown> {
    return this.notifications.markNotificationRead(id);
  }

  latestNotifications(): Observable<NotificationPage> {
    return this.notifications.listNotifications(1, 20);
  }
}
