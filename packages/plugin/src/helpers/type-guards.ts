/**
 * Copyright 2026 Robert Lindley
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *        http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Returns true when the runtime value is a boolean primitive.
 * @param value - The value to check.
 * @returns True if the value is a boolean, false otherwise.
 */
export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

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
 * Returns true when the runtime value is a number primitive.
 * @param value - The value to check.
 * @returns True if the value is a number, false otherwise.
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number';
}

/**
 * Returns true when the value is a plain object with an object or null prototype.
 * @param value - The value to check.
 * @returns True if the value is a plain object, false otherwise.
 */
export function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  return isPlainObjectPrototype(value);
}

/**
 * Returns true when an object's prototype matches plain-object shapes.
 * @param value - The object to inspect.
 * @returns True if the object prototype is Object.prototype or null.
 */
function isPlainObjectPrototype(value: object): boolean {
  const prototype = Object.getPrototypeOf(value);
  return prototype === null || Object.getPrototypeOf(prototype) === null;
}

/**
 * Returns true when the runtime value is a string primitive.
 * @param value - The value to check.
 * @returns True if the value is a string, false otherwise.
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}
