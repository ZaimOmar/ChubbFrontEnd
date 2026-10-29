import { ClaimsClaimantClaimView, ClaimsStaffClaimView } from '../../api/model/models';

export type ClaimView = ClaimsClaimantClaimView | ClaimsStaffClaimView;

/** The staff projection is the one carrying `claimantId`; claimants never receive it. */
export function isStaffView(view: ClaimView): view is ClaimsStaffClaimView {
  return 'claimantId' in view;
}
