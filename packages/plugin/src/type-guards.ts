/**
 * Returns true when the value is neither null nor undefined.
 * @param value - The value to check.
 * @returns True if the value is defined, false otherwise.
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Returns true when the value is null or undefined.
 * @param value - The value to check.
 * @returns True if the value is null or undefined, false otherwise.
 */
export function isNullOrUndefined(value: unknown): value is null | undefined {
  return value === null || value === undefined;
}

/**
 * Returns true when the runtime value is a string primitive.
 * @param value - The value to check.
 * @returns True if the value is a string, false otherwise.
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Returns true when the runtime value is a boolean primitive.
 * @param value - The value to check.
 * @returns True if the value is a boolean, false otherwise.
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

/**
 * Returns true when the runtime value is a number primitive.
 * @param value - The value to check.
 * @returns True if the value is a number, false otherwise.
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number';
}
