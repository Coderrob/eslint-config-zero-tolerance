# require-zod-schema-description

Enforce that Zod schema variable initialisers include a `.describe()` call.

## Rule Details

| | |
|---|---|
| **Type** | `suggestion` |
| **Recommended** | `warn` |
| **Strict** | `error` |

## Rationale

Zod's `.describe()` method attaches a human-readable description to a schema. This description is used by tools that generate JSON Schema, OpenAPI specs, and documentation from Zod schemas. Without `.describe()` the generated output lacks meaningful field descriptions.

## Examples

### ✅ Correct

```typescript
const nameSchema = z.string().describe('The user's display name');

const userSchema = z.object({
  name: z.string(),
  age:  z.number(),
}).describe('A registered user');

const statusSchema = z.enum(['active', 'inactive']).describe('Account status');
```

### ❌ Incorrect

```typescript
const nameSchema = z.string();

const userSchema = z.object({
  name: z.string(),
  age:  z.number(),
});
```

## Configuration

This rule has no options:

```js
'zero-tolerance/require-zod-schema-description': 'warn'
```
