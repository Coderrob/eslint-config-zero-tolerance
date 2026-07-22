# require-bdd-spec

Enforce that every TypeScript source file has a valid sibling `.ts.bdd.json` BDD specification file.

## Rule Details

| Property        | Value        |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | No           |
| **Recommended** | `off`        |
| **Strict**      | `off`        |

## Rationale

Every non-test TypeScript source file in the plugin must be accompanied by a sibling `.ts.bdd.json` file that documents its behaviour in BDD (Given/When/Then) format. The rule verifies the repository relationships available while ESLint is parsing the source: sibling presence, the exact `sourceFile` reference, and parity between `module.exports` and named exports discovered from the Program AST.

BDD document structure is intentionally validated only once, by `pnpm validate:bdd`. That command compiles the canonical `bdd-spec.schema.json` with Ajv, so required fields, types, scenario collections, and scenario naming have one implementation and one source of truth.

This rule is intentionally **opt-in** and is disabled by default in the built-in `recommended` and `strict` presets. Enable it explicitly for repositories that require BDD spec files.

## Examples

### ✅ Correct

A source file `rules/my-rule.ts` with a sibling `rules/my-rule.ts.bdd.json`:

```json
{
  "$schema": "../../../../bdd-spec.schema.json",
  "schemaVersion": "1.0.0",
  "sourceFile": "packages/plugin/src/rules/my-rule.ts",
  "module": {
    "name": "my-rule",
    "description": "Enforces a specific coding standard",
    "exports": ["myRule"]
  },
  "specifications": [
    {
      "feature": "My rule feature",
      "scenarios": [
        {
          "name": "should report a violation when the pattern is found",
          "given": "a TypeScript source file containing the prohibited pattern",
          "when": "ESLint runs the rule",
          "then": "a violation is reported with the correct message"
        }
      ]
    }
  ]
}
```

### ❌ Incorrect

Missing sibling `.ts.bdd.json`:

```
// my-rule.ts exists but my-rule.ts.bdd.json is absent
```

BDD spec with a scenario name that does not start with `"should"`:

```json
{
  "scenarios": [
    {
      "name": "validates the input",
      "given": "...",
      "when": "...",
      "then": "..."
    }
  ]
}
```

## Configuration

This rule has no options:

```js
'zero-tolerance/require-bdd-spec': 'error'
```
