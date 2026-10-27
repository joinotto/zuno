# License and Provenance Review

## Current Status

The project uses the Apache License 2.0. The public `main` branch contains a clean project history.

The project publishes packages through npm trusted publishing. The protected release workflow
creates provenance for each package.

## Review Scope

Review these content groups:

- repository commit history
- source code
- generated code
- copied provider specifications
- fixtures
- documentation
- images and trademarks
- dependencies
- build output

## Required Record

Create one provenance record for each imported content group.

Each record must include:

- source location
- source revision
- copyright owner
- source license
- import date
- imported files
- local modifications
- reviewer
- approval result

## Legacy References

The clean branch does not contain unverified prototype source. See the dated provenance audit for
the removal record.

## Approved License

The approved project license is Apache License 2.0. Package metadata must use the `Apache-2.0` SPDX
identifier.

## Source File Notices

Apply SPDX identifiers to package metadata and new source files. Use the REUSE specification for
license metadata.

Do not add a notice to third-party code without checking its license. Keep required third-party
notices in the distribution.

## Publication Approval

Public release requires all these approvals:

1. A reviewer approves the provenance record.
2. A reviewer approves third-party notices.
3. CI passes the license checks.
4. CI passes the package-content check.
5. The npm organization accepts the package ownership.

## Approved Runtime Dependencies

### `jose`

- Purpose: Verify Plaid ES256 webhook signatures.
- Source: npm package `jose`.
- License: MIT.
- Imported code: None.
- Local modifications: None.
- Distribution: Runtime dependency of `@ottoai/zuno-plaid`.
