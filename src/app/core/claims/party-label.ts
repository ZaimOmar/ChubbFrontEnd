const SHORT_ID_LENGTH = 8;

/** The API gives ids only (no names): "You" for the signed-in user, else the role plus a short id. */
export function partyLabel(
  id: string | null | undefined,
  role: string,
  currentUserId: string | undefined,
): string {
  if (!id) return '';
  return id === currentUserId ? 'You' : `${role} ${id.slice(0, SHORT_ID_LENGTH)}`;
}
