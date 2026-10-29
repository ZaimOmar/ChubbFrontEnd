export * from './auth.service';
import { AuthApi } from './auth.service';
export * from './claims.service';
import { ClaimsApi } from './claims.service';
export * from './notifications.service';
import { NotificationsApi } from './notifications.service';
export * from './reporting.service';
import { ReportingApi } from './reporting.service';
export const APIS = [AuthApi, ClaimsApi, NotificationsApi, ReportingApi];
