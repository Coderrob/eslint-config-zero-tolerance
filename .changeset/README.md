# Changesets

The plugin release workflow uses `CHANGELOG.md` as the release record. Add user-facing changes under `[Unreleased]` as they are made. Run the **Prepare plugin release** workflow to create the version PR; it does not consume Changesets files. The config workspace package remains internal and is not published.
