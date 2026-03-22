# require-bdd-spec

Enforce that every TypeScript source file has a valid sibling `.ts.bdd.json` BDD specification file.

## Rule Details

| Property        | Value        |
| --------------- | ------------ |
| **Type**        | `suggestion` |
| **Fixable**     | No           |
| **Recommended** | `warn`       |
| **Strict**      | `error`      |

## Rationale

Every non-test TypeScript source file in the plugin must be accompanied by a sibling `.ts.bdd.json` file that documents its behaviour in BDD (Given/When/Then) format. This rule validates that the file exists and that its content is semantically valid: required fields are present, types are correct, the `specifications` array is non-empty, all scenario names start with `"should"`, and the `module.exports` list exactly matches the named exports in the source file.

Violations are reported as an aggregated list of errors so all problems are visible in a single ESLint run.

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

BDD spec whose `module.exports` does not match the source file's named exports:

```json
{
  "module": {
    "exports": ["myRule", "nonExistentExport"]
  }
}
```

## Configuration

This rule has no options:

```js
'zero-tolerance/require-bdd-spec': 'error'
```
