# Documentation Standard

## Purpose

This standard controls public Zuno documentation. It applies to prose in Markdown, examples, issues,
and release notes.

## Standard Basis

Use ASD-STE100 Issue 9 principles for technical text. Use the official ASD-STE100 specification
during formal reviews.

This file does not replace the official specification. The project does not claim certified
conformance.

## Writing Rules

1. Use short sentences.
2. Write one instruction in each sentence.
3. Use the active voice.
4. Use the imperative form for instructions.
5. Put the action before the reason.
6. Use the same term for the same item.
7. Do not use a synonym only to change the wording.
8. Define project terms before first use.
9. Keep paragraphs short.
10. Use lists for a sequence of actions.
11. Use tables only for direct comparisons.
12. Put conditions before actions.
13. Identify the actor when the actor is not clear.
14. Avoid informal language.
15. Avoid idioms and cultural references.
16. Avoid vague references such as “this” or “it.”
17. Avoid unnecessary adjectives.
18. Avoid unnecessary adverbs.
19. Use positive instructions when possible.
20. Use approved technical names when no approved word exists.

## Sentence Limits

- Keep an instruction at 20 words or fewer.
- Keep a descriptive sentence at 25 words or fewer.
- Split a sentence when it contains more than one action.
- Keep one subject in each paragraph when possible.

These limits are project controls. They support the ASD-STE100 writing target.

## Requirement Words

Use these words only with the specified meaning:

- `must` states a requirement.
- `must not` states a prohibition.
- `should` states a recommendation.
- `may` states permission.
- `can` states an ability.

Do not use `should` for a requirement. Do not use `may` when you mean ability.

## Terms

Use these project terms:

- Use `provider` for an external service such as QuickBooks.
- Use `provider package` for one npm package that accesses a provider.
- Use `application` for software that uses Zuno.
- Use `connection` for one authorized provider account.
- Use `token store` for application-owned token persistence.
- Use `adapter` for an explicit data conversion package.
- Use `legacy prototype` for the first Worker implementation.

Do not use `integration` when `provider package` is more precise. Do not use `unified model` for
provider-native data.

## Code Examples

1. Keep examples complete enough to run.
2. Use fake identifiers and fake secrets.
3. Show required error handling.
4. State the runtime requirement.
5. State the package version.
6. Do not use production customer data.
7. Do not copy provider payloads without a license review.

## Document Structure

Use this order when the sections apply:

1. Purpose
2. Scope
3. Prerequisites
4. Procedure
5. Result
6. Errors
7. Security notes
8. References

Use sentence-style headings. Do not use decorative emoji in technical headings.

## Review Process

Every public document requires these reviews:

1. Run the automated style checks.
2. Verify each command.
3. Verify each external link.
4. Verify each technical claim.
5. Verify all examples contain synthetic data.
6. Complete a human ASD-STE100 review.
7. Record exceptions in the pull request.

## Exceptions

Code, API names, trademarks, and quoted text can use non-approved words. Mark quoted text and keep
the quote short.

Machine-readable specifications do not use this prose standard. Their descriptions must still use
clear controlled language.

## References

- [ASD-STE100](https://www.asd-ste100.org/)
- [GitHub Open Source Guides](https://opensource.guide/)
