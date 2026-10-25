# License and Provenance Review

## Current Status

The repository does not have an approved public license.
The repository is not ready for public distribution.

Do not publish npm packages from this repository.
Do not accept external contributions before license approval.

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

The `legacy/references` directory contains unverified material.
Do not distribute these files.

Remove a file when the project cannot verify its source or license.
Replace removed material with a link to the official source.

## License Selection

The maintainers must select the project license.

The review must compare at least:

- Apache License 2.0
- MIT License

The review must consider patent protection.
The review must consider dependency compatibility.
The review must consider contributor expectations.

Do not add a `LICENSE` file before the maintainers approve the selection.

## Source File Notices

After license approval, apply SPDX identifiers.
Use the REUSE specification for license metadata.

Do not add a notice to third-party code without checking its license.
Keep required third-party notices in the distribution.

## Publication Approval

Public release requires all these approvals:

1. The repository owner approves the license.
2. A reviewer approves the provenance record.
3. A reviewer approves third-party notices.
4. CI passes the license checks.
5. CI passes the package-content check.
6. The npm organization accepts the package ownership.
