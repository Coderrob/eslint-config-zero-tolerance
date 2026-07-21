# Changesets

Add a changeset for every user-facing package change by running `pnpm changeset`.
Select only the affected published packages and choose the appropriate semantic-version bump.
The plugin and config packages are versioned independently; Changesets updates internal dependency ranges when required.

Release maintainers use `pnpm release:status` to review pending releases, `pnpm release:version` to consume changesets and update package versions, and `pnpm release:publish` to build, test, and publish the prepared versions.
