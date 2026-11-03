# no-identical-expressions

Find likely copy-and-paste mistakes in comparisons and logical expressions.

Type: problem. No automatic fix. No options.

## What it checks

Reports repeated identifiers or primitive literals on both sides of ===, !==, ==, !=, &&, ||, or ??. Parentheses and comments do not hide a repeated identifier. Primitive literals include strings, numbers, booleans, null, and bigints.

## Examples

```typescript
const fallback = value || value; // Reported: repeats the same value.
const doubled = text + text; // Allowed: arithmetic may be intentional.
const same = next() === next(); // Allowed: calls may return different values.
const equal = /item/ === /item/; // Allowed: creates two separate objects.
```

## Limits

Calls, property reads, updates, and compound expressions are excluded because evaluating them can have effects. This includes optional calls, computed properties, and getters. Comparing the same regular-expression variable with itself is still reported.

A diagnostic asks you to review the expression; it does not prove that the result is constant. For example, self-comparison may intentionally test for NaN. There is no automatic fix because the intended replacement is unknown.
