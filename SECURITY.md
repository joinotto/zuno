# Security Policy

## Supported Versions

Zuno has no supported public release.
The maintainers will publish the support table with the first release.

## Report a Vulnerability

Do not open a public issue.
Use GitHub private vulnerability reporting.

If private reporting is not available, contact the repository owner privately.
Do not include credentials or customer data in the first message.

Include this information:

- affected package
- affected version
- impact
- reproduction steps
- proof-of-concept data
- suggested correction

Use synthetic data when possible.
Encrypt sensitive supporting files.

## Response Targets

The security team will:

- acknowledge the report within three business days
- provide an initial assessment within seven business days
- provide status updates at least every seven business days
- coordinate publication with the reporter

These targets can change for a complex report.

## Disclosure

Do not publish the vulnerability before a coordinated release.
The maintainers will credit the reporter when the reporter requests credit.

## Security Scope

Reports can include:

- token exposure
- OAuth state failure
- webhook verification failure
- signature verification failure
- secret logging
- tenant data exposure
- unsafe retry behavior
- dependency compromise
- package publication compromise

## Excluded Reports

Do not submit:

- reports without a security impact
- automated scanner output without validation
- denial-of-service tests against production services
- tests that use data without authorization
- social engineering

## Secret Exposure

Revoke an exposed credential immediately.
Do not wait for the incident review.
Remove the credential from logs and build artifacts.
Record the incident and the corrective action.
