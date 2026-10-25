# Governance

## Purpose

This document defines project roles and decisions.

## Roles

### Contributor

A contributor submits issues, documentation, tests, or code.

### Reviewer

A reviewer evaluates changes in an assigned area.
A reviewer cannot approve a conflicting personal change.

### Provider Maintainer

A provider maintainer owns one provider package.
The maintainer reviews provider API changes and support incidents.

### Core Maintainer

A core maintainer owns shared packages and release controls.
A core maintainer can approve architecture changes.

### Project Owner

The project owner manages legal ownership and final governance decisions.
The repository organization must publish the current project owner.

## Decision Process

Use a pull request for routine decisions.
Use an architecture decision record for a durable technical decision.
Use a governance proposal for a role or policy change.

Seek agreement before a vote.
Record unresolved objections.

## Approval Rules

- One maintainer approves a routine change.
- One provider maintainer approves a provider change.
- Two core maintainers approve a core public API change.
- Two maintainers approve a security-sensitive change.
- The project owner approves a license change.
- The project owner approves a governance change.

## Maintainer Selection

A candidate must show sustained and constructive work.
An existing maintainer nominates the candidate.
Two maintainers approve the nomination.

The project owner confirms access changes.

## Maintainer Removal

A maintainer can resign at any time.
The project can remove an inactive maintainer after notice.
The project can remove a maintainer for serious policy violations.

Record the removal decision privately when the record contains personal data.

## Provider Ownership

Each supported provider must have a named owner.
The `official` support level requires two maintainers.
The `community` support level requires one named maintainer.

Mark a provider `deprecated` when no maintainer remains.

## Conflicts of Interest

Disclose a financial or personal conflict.
Do not approve a change when the conflict affects judgment.

## Governance Changes

Submit governance changes as a pull request.
Allow at least seven calendar days for review.
The project owner makes the final decision.
