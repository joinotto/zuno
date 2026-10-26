# Product Scope

## Purpose

Zuno reduces repeated integration work. Zuno supplies provider clients and integration
infrastructure.

## Product Principle

Each provider keeps its native data model.

QuickBooks data remains QuickBooks data. Plaid data remains Plaid data. Slack data remains Slack
data.

Applications can map provider data into their own models. Optional adapters can supply a specific
compatibility model.

## Users

### Application Teams

Application teams need one reliable provider SDK. They do not want to build OAuth, retries, and
webhooks.

### Multi-Provider Products

These products install multiple Zuno provider packages. They own the application data model.

### Provider Maintainers

Provider maintainers add or maintain one provider package. They use the Zuno test and release
process.

### Integration Platform Teams

Integration platforms use provider packages while retaining their databases, queues, and application
models.

## Supported Use Cases

### Accounting

- Read accounts and tracking dimensions.
- Read customers, vendors, and items.
- Read and write supported transactions.
- Read provider reports.
- Detect changes and deletions.
- Download attachments.
- Verify connection health.
- Reauthorize a connection.

### Banking

- Connect a financial institution.
- Read accounts and balances.
- Synchronize transactions with a cursor.
- Read identity and liability data.
- Process provider webhooks.
- Handle provider reauthorization.

### Storage

- List and search files.
- Upload and download files.
- Process file change events.
- Resolve file permissions.
- Stream large files.

### Messaging

- List users and channels.
- Send messages.
- Upload files.
- Process provider events.
- Handle workspace OAuth.

### Developer Tools

- Inspect provider capabilities.
- Record sanitized fixtures.
- Replay webhook payloads.
- Compare provider API versions.
- Generate provider reference documentation.

## Excluded Use Cases

Zuno does not supply one universal business data model. Zuno does not own application tenants. Zuno
does not own application authorization. Zuno does not require a Zuno-hosted service. Zuno does not
store production tokens by default. Zuno does not guarantee unsupported provider behavior.

## Product Decisions

1. Use provider-native public APIs.
2. Keep shared packages category-neutral.
3. Keep persistence outside provider packages.
4. Use capability manifests for discovery.
5. Use adapters only for explicit compatibility needs.
6. Build QuickBooks first.
7. Build Plaid second.
8. Add storage and messaging providers later.

## Release Decisions

The maintainers approved these decisions:

1. Use the Apache License 2.0.
2. Use the `@ottoai` npm scope.
3. Publish only the clean Zuno repository history.
4. Support Node.js 22.18.0 or later for the first release.
5. Keep QuickBooks at the `experimental` support level until it meets the release criteria.
6. Send private security reports to `security@joinotto.com`.
7. Use the `ottoai` npm organization for package ownership.

The project must add a second core maintainer before it marks a provider as `official`.
