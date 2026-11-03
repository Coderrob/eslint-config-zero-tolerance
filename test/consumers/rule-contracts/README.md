# Built plugin file contracts

Each rule directory contains a valid file and a file with one known violation. The cases.json manifest lists the rule, its options, and the expected message ID and line.

The runner in scripts/rule-file-contracts.test.mjs uses ESLint to read these files and loads the built plugin from packages/plugin/dist/index.mjs. Invalid files must produce exactly one matching error. Valid files must produce no diagnostics. Parsing failures and extra diagnostics fail the test.

These fixtures are excluded from normal repository linting because their violations are intentional. The contract runner uses a separate configuration that enables one rule at a time. Existing dogfooding tests verify the repository's combined configuration.

Run from the repository root after building:

```bash
pnpm build
node --test scripts/rule-file-contracts.test.mjs
```

The checks also run as part of pnpm test and CI. When adding a case, keep the manifest's expected line in sync with its source file. Never add lint-disable comments to make a fixture pass.
