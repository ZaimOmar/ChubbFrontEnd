/** Freezes plain data recursively so a pending request cannot be mutated by later form edits. */
export function deepFreeze<T>(value: T): Readonly<T> {
  if (typeof value === 'object' && value !== null && !Object.isFrozen(value)) {
    Object.values(value as object).forEach((child: unknown) => deepFreeze(child));
    Object.freeze(value);
  }
  return value;
}
