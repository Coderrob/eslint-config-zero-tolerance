# eslint-config-zero-tolerance

Zero-tolerance ESLint plugin and config for enforcing strict code quality standards.

**✨ Now supports ESLint 9 with Flat Config! ✨**

## Packages

This monorepo contains two packages:

- `eslint-plugin-zero-tolerance` - ESLint plugin with custom rules
- `eslint-config-zero-tolerance` - ESLint config that exports recommended and strict presets

## Requirements

- ESLint 8.57.0+ or 9.x
- TypeScript-ESLint 8.x
- TypeScript 5.x

## Installation

```bash
pnpm install
```

## Building

```bash
pnpm build
```

## Testing

```bash
pnpm test
```

## Usage

### ESLint 9+ (Flat Config)

**Using the recommended preset:**
```javascript
// eslint.config.js
import zeroTolerance from 'eslint-plugin-zero-tolerance';

export default [
  zeroTolerance.configs.recommended,
  // your other configs...
];
```

**Using the strict preset:**
```javascript
// eslint.config.js
import zeroTolerance from 'eslint-plugin-zero-tolerance';

export default [
  zeroTolerance.configs.strict,
  // your other configs...
];
```

**Alternative: Import presets directly:**
```javascript
// eslint.config.js
import recommended from 'eslint-config-zero-tolerance/recommended';
// or
import strict from 'eslint-config-zero-tolerance/strict';

export default [
  recommended, // or strict
  // your other configs...
];
```

**Custom configuration:**
```javascript
// eslint.config.js
import zeroTolerance from 'eslint-plugin-zero-tolerance';

export default [
  {
    plugins: {
      'zero-tolerance': zeroTolerance,
    },
    rules: {
      'zero-tolerance/interface-prefix': 'error',
      'zero-tolerance/no-literal-unions': 'warn',
      // ... other rules
    },
  },
];
```

### ESLint 8.x (Legacy Config)

**Using .eslintrc.js:**
```javascript
module.exports = {
  plugins: ['zero-tolerance'],
  extends: ['plugin:zero-tolerance/legacy-recommended'],
  // or for strict mode:
  // extends: ['plugin:zero-tolerance/legacy-strict'],
};
```

**Or configure rules individually:**
```javascript
module.exports = {
  plugins: ['zero-tolerance'],
  rules: {
    'zero-tolerance/interface-prefix': 'error',
    'zero-tolerance/test-description-style': 'error',
    'zero-tolerance/zod-schema-description': 'error',
    'zero-tolerance/no-banned-types': 'error',
    'zero-tolerance/no-relative-parent-imports': 'error',
    'zero-tolerance/no-dynamic-import': 'error',
    'zero-tolerance/no-literal-unions': 'error',
  },
};
```

## Rules

### interface-prefix
Enforces that TypeScript interface names start with "I" (capitalized).

**Example:**
```typescript
// ✓ Good
interface IUser {
  name: string;
}

// ✗ Bad
interface User {
  name: string;
}
```

### test-description-style
Enforces that test descriptions start with "should".

**Example:**
```typescript
// ✓ Good
it("should render correctly", () => {});
test("should handle errors", () => {});

// ✗ Bad
it("renders correctly", () => {});
test("handles errors", () => {});
```

### zod-schema-description
Enforces that Zod schemas have `.describe()` called.

**Example:**
```typescript
// ✓ Good
const schema = z.string().describe("A string value");
const userSchema = z.object({
  name: z.string()
}).describe("User object");

// ✗ Bad
const schema = z.string();
const userSchema = z.object({
  name: z.string()
});
```

### no-banned-types
Bans the use of `ReturnType` and indexed access types.

**Example:**
```typescript
// ✓ Good
type MyFunction = (x: number) => number;

// ✗ Bad
type MyReturnType = ReturnType<typeof myFunction>;
type Value = MyObject["key"];
```

### no-relative-parent-imports
Bans imports and re-exports using `../` (parent directory imports).

**Example:**
```typescript
// ✓ Good
import { foo } from "./sibling";
import { bar } from "./child/module";
import pkg from "package-name";

// ✗ Bad
import { foo } from "../parent";
export { bar } from "../../grandparent";
```

### no-dynamic-import
Bans `await import()` and `require()` except in test files (*.test.* or *.spec.*).

**Example:**
```typescript
// ✓ Good (in test files)
// file: mymodule.test.ts
const module = await import("./module");
const pkg = require("./package");

// ✗ Bad (in non-test files)
// file: mymodule.ts
const module = await import("./module");
const pkg = require("./package");
```

### no-literal-unions
Bans literal union types in favor of enums.

**Example:**
```typescript
// ✓ Good
enum Status {
  Active = "active",
  Inactive = "inactive"
}

// ✗ Bad
type Status = "active" | "inactive";
type Size = "small" | "medium" | "large";
```
## Test Coverage

This project maintains comprehensive test coverage with:
- **114 test cases** covering all rules
- Named test cases for better documentation
- Edge cases for each rule including:
  - Generic types and type parameters
  - Async/await patterns  
  - Multiple error scenarios
  - Boundary conditions

## Publishing

This monorepo provides automated scripts to handle versioned releases:

### Automated Publishing Process

```bash
# 1. Build all packages
pnpm build

# 2. Run tests to ensure everything works
pnpm test

# 3. Prepare packages for publishing (converts workspace:* to versioned dependencies)
pnpm prepare-publish

# 4. Publish the plugin package
cd packages/plugin
npm publish

# 5. Publish the config package
cd ../config
npm publish

# 6. Restore workspace:* for local development
cd ../..
pnpm restore-workspace
```

### Manual Publishing Process

If you prefer to publish manually:

1. Update version in `packages/plugin/package.json`
2. Update version in `packages/config/package.json`
3. In `packages/config/package.json`, change:
   - From: `"eslint-plugin-zero-tolerance": "workspace:*"`
   - To: `"eslint-plugin-zero-tolerance": "^1.0.0"` (or current version)
4. Build and publish both packages
5. Restore `workspace:*` for continued development

The automated scripts handle step 3 and 5 for you.

## License

MIT