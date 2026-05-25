---
description: Generate developer and user documentation for a feature
argument-hint: [feature-name]
allowed-tools: Read, Grep, Glob, LS, Bash(find *), Bash(ls *), Bash(git status *), Bash(git diff *), Bash(git log *), Write, Edit, MultiEdit
---

# Document Feature

Generate both developer-facing and user-facing documentation for the feature: **$ARGUMENTS**

## Goal
1
Create two separate documentation files for this feature:

1. Developer documentation with technical implementation details.
2. User documentation with simple, task-oriented guidance.

The generated docs must match the repository's existing documentation style, naming conventions, directory structure, and cross-linking patterns.

## Inputs

Feature name: `$ARGUMENTS`

If the feature name is missing, stop and ask for it before proceeding.

## Process

### 1. Discover documentation patterns

First, inspect the repository to understand how documentation is organized.

Look for:
- `docs/`, `documentation/`, `wiki/`, `README*`, `CONTRIBUTING*`
- developer docs folders such as `docs/dev`, `docs/developer`, `docs/architecture`, `docs/engineering`
- user docs folders such as `docs/user`, `docs/guides`, `docs/help`, `docs/manual`
- existing feature docs, how-to guides, architecture notes, API docs, ADRs, changelogs
- any templates or naming conventions already used

Also inspect relevant project signals:
- package manifests, solution files, build files, app folders, API folders, UI folders
- route definitions, controllers, endpoints, components, pages, services, handlers, migrations
- git history or recent diffs if the feature appears to be newly added

### 2. Locate relevant code

Find the code that implements or references `$ARGUMENTS`.

Use the feature name and close variants to search:
- exact feature name
- kebab-case
- PascalCase
- camelCase
- snake_case
- likely UI labels or endpoint names

Review the most relevant files to understand:
- purpose of the feature
- frontend behavior
- backend behavior
- data model changes
- API contracts
- configuration or permission changes
- tests covering the feature

### 3. Classify the feature

Determine whether the feature is:
- frontend
- backend
- full-stack
- infrastructure/configuration

Use that classification to adjust both docs:

- Frontend: emphasize screens, flows, interactions, validation, states, screenshots.
- Backend: emphasize architecture, endpoints, payloads, services, persistence, auth, side effects.
- Full-stack: cover both and explain the end-to-end flow.
- Infrastructure/configuration: cover setup, flags, environment variables, deployment and operational impact.

State the classification clearly inside the developer doc.

### 4. Choose output paths

Prefer existing repo conventions. If no clear convention exists, default to:

- Developer doc: `docs/dev/<feature-slug>-implementation.md`
- User doc: `docs/user/how-to-<feature-slug>.md`

Where `<feature-slug>` is a lowercase kebab-case version of the feature name.

Examples:
- `Password Reset` → `docs/dev/password-reset-implementation.md`
- `Password Reset` → `docs/user/how-to-reset-password.md`

If the repository already uses a better naming pattern, follow that instead.

### 5. Generate developer documentation

Write a technical document for developers that includes, where applicable:

# <Feature Name> Implementation

## Overview
- What the feature does
- Why it exists
- Feature classification: frontend/backend/full-stack/infrastructure

## Related Files
- Key files and directories involved
- Short description of each

## Architecture / Flow
- High-level request or interaction flow
- Important services, components, modules, jobs, events, or handlers

## API / Contracts
- Endpoints, commands, events, message formats, request/response shapes
- Auth/authorization requirements
- Validation and error cases

## Data / Storage
- Models, schema changes, migrations, persistence details
- Caching, queues, background processing if relevant

## Implementation Notes
- Non-obvious decisions
- Edge cases
- Flags, config, environment variables
- Limitations or known trade-offs

## Testing
- Existing automated test coverage
- Recommended manual verification steps
- Gaps to address later if tests are missing

## Related Documentation
- Links to existing docs
- Link to the generated user document

Keep it practical and based on the actual codebase. Do not invent APIs or architecture that are not supported by the code.

### 6. Generate user documentation

Write a simple, user-friendly guide that includes, where applicable:

# How to <do the feature action>

## What this does
- Plain-language explanation of the feature
- Who should use it

## Before you begin
- Prerequisites
- Required roles/permissions
- Any setup or navigation assumptions

## Steps
- Clear numbered steps
- UI labels as they appear in the product
- Expected results after each major action

## Screenshots
Insert screenshot placeholders at the most useful points, for example:

![Screenshot: <feature-name> entry point](../assets/placeholders/<feature-slug>-entry-point.png)
![Screenshot: <feature-name> form or main screen](../assets/placeholders/<feature-slug>-main-screen.png)
![Screenshot: <feature-name> success state](../assets/placeholders/<feature-slug>-success-state.png)

If the repository already has a screenshot convention, follow it instead.
If screenshots cannot be captured automatically, leave clear placeholders with descriptive alt text and captions.

## Troubleshooting
- Common mistakes
- Common error messages if visible in the UI
- What to do next

## Learn more
- Link to related user docs
- Link to the developer document for internal/technical readers if appropriate

Write for end users, not developers. Avoid code terms unless the UI exposes them.

### 7. Cross-link both documents

Ensure both generated documents link to each other.

- Developer doc should include a “User guide” or “Related documentation” link.
- User doc should include a “Technical reference” or internal link where appropriate.

Also link to any existing relevant docs found during discovery.

### 8. Screenshot automation when possible

If the repository has an established browser automation or screenshot setup, use it.

Look for tools/config such as:
- Playwright
- Cypress
- Puppeteer
- Storybook
- docs screenshot scripts
- visual regression tools

If screenshot automation is already available and can be reused safely:
- capture representative screenshots for the main user flow
- store them according to existing repo conventions
- reference them in the user guide

If not available, keep descriptive placeholders and add a short TODO note indicating which screenshots should be captured.

### 9. Write files

Create both documentation files.

Before writing:
- avoid overwriting high-quality existing docs without checking
- if a matching doc already exists, update it in place and preserve useful content
- otherwise create new files

### 10. Final check

Verify that:
- both files were created in the correct directories
- naming matches repo conventions
- links are valid and relative
- the docs reflect actual code
- user docs are simple and task-oriented
- developer docs are technical and implementation-oriented
- screenshot placeholders or captures are present
- classification was applied correctly

## Output

At the end, report:
- detected feature classification
- files created or updated
- whether screenshots were captured or placeholders were inserted
- related docs that were linked