# no-array-mutation

Prevent changes to known arrays and tuples through mutating methods.

Type: suggestion. No automatic fix. No options.

## What it checks

Reports calls to push, pop, shift, unshift, splice, sort, reverse, fill, and copyWithin on known arrays. Optional calls and static computed names, such as `items['push']()`, are also checked.

With TypeScript type information, the rule recognizes arrays, tuples, constrained generics, unions, intersections, and inherited array types. Enable `parserOptions.projectService` to check typed parameters and imported values.

Without type information, the rule checks array literals and local aliases whose values are not reassigned. TypeScript assertions around an array literal preserve detection. A cast alone does not prove that an unknown value is an array.

## Examples

```typescript
const items = [1, 2];
items.push(3); // Reported: changes the original array.
const next = [...items, 3]; // Allowed: creates a new array.
router.push('/home'); // Allowed when the receiver is not a known array.
```

## Limits

This rule checks method calls, not every way to change an array. Unknown receivers are skipped without type information. There is no automatic rewrite because copying an array can change return values and how other references observe it.
