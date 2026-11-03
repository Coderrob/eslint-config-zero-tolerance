# max-function-lines

Keep function bodies short enough to read and review.

Type: suggestion. No automatic fix.

## What it counts

Counts the source lines occupied by a function body, including braces. Expression-bodied arrows are included. The rule's default limit is 30 lines; an existing configuration can set a different limit.

## Options

| Option           | Default | Meaning                                          |
| ---------------- | ------- | ------------------------------------------------ |
| max              | 30      | Maximum body length; must be a positive integer. |
| `skipBlankLines` | false   | Exclude lines containing only whitespace.        |
| `skipComments`   | false   | Exclude lines containing only comments.          |

```js
'zero-tolerance/max-function-lines': ['error', {
  max: 30,
  skipBlankLines: true,
  skipComments: true,
}]
```

## Examples

```typescript
// Three body lines, including braces.
function getValue() {
  return 1;
}

// Five expression-body lines.
const getValues = () => [1, 2, 3];
```

## Counting details

Code beside a comment still counts. Comment-like text inside strings or template literals is code. Multiple comments on one line, Windows line endings, and TypeScript assertions do not change these rules.

Line count measures size, not branching. Use complexity and max-depth separately when you also want to limit decision paths and nesting.
