# HoneyBook Provider Discovery

## Status

Discovery. The package is not published.

Proposed package: `@ottoai/zuno-honeybook`

## Purpose

The HoneyBook provider can support provider-native client and project workflows. Zuno will not map
HoneyBook into a universal CRM model.

## Discovery Questions

1. What public or partner API access is available?
2. Which authentication method does the API require?
3. Which webhook events are available?
4. Which resources support read and write operations?
5. Which rate limits and pagination rules apply?
6. Which test accounts and synthetic fixtures are available?
7. Which provider terms affect an open-source SDK?

## Candidate Scope

The first scope can include these resources when approved API access supports them:

- projects
- contacts
- invoices
- payments
- sessions or meetings
- files
- webhooks

## Delivery Conditions

Do not start implementation until the maintainers confirm API access, test-account access, and the
allowed public SDK scope.
