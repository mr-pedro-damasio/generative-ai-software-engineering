---
description: Generate developer and user documentation for a feature in this Next.js App Router project
argument-hint: [feature-name]
allowed-tools: Read, Grep, Glob, LS, Bash(find *), Bash(ls *), Bash(git status *), Bash(git diff *), Bash(git log *), Write, Edit, MultiEdit
---

# Document Feature

Generate developer-facing and user-facing documentation for the feature: **$ARGUMENTS**

This repository appears to be a Next.js project created with `create-next-app`, using the App Router and TypeScript conventions. Prefer Next.js documentation patterns and inspect `app/` first.

## Goal

Create two separate documentation files:

1. Developer documentation for engineers maintaining or extending the feature.
2. User documentation for end users interacting with the feature in the UI.

The generated documents must reflect the actual codebase, not assumptions.

## Input

Feature name: `$ARGUMENTS`

If no feature name is provided, stop and ask for it.

## Repository assumptions

Start from these likely project conventions, then verify them in code:

- Next.js App Router project
- Main routes and UI live under `app/`
- Entry page may begin at `app/page.tsx`
- Shared layout may live in `app/layout.tsx`
- Styling may be in `app/globals.css` and component-level styles
- Fonts may be configured with `next/font`
- The project may currently be frontend-only unless API routes or external services are found

Do not assume a backend exists unless files such as `app/api/**`, `route.ts`, server actions, database access, or service integrations are present.

## Process

### 1. Discover project structure

Inspect the repo to identify:

- `app/**`
- `components/**`
- `lib/**`
- `public/**`
- `app/api/**`
- `hooks/**`
- `styles/**`
- `middleware.ts`
- `next.config.*`
- `package.json`
- `tsconfig.json`
- `README.md`

Also inspect whether the feature uses:
- server components
- client components via `"use client"`
- server actions
- route handlers (`route.ts`)
- metadata generation
- form handling
- images in `public/`
- testing tools such as Playwright, Cypress, Jest, or Vitest

### 2. Find feature-related files

Search for `$ARGUMENTS` and close variants in:

- route segment names
- page/component names
- navigation labels
- headings and button text
- form fields
- API handlers
- helper functions
- tests

Search using variants:
- exact phrase
- kebab-case
- PascalCase
- camelCase
- singular/plural forms

Prioritize these files:
- `app/**/page.tsx`
- `app/**/layout.tsx`
- `app/**/route.ts`
- `app/**/_components/**`
- `components/**`
- `lib/**`
- `public/**`

### 3. Classify the feature

Determine whether the feature is:

- frontend
- backend/API
- full-stack
- platform/configuration

Use these cues:

- Frontend: mostly pages, components, forms, navigation, rendering, client state, styling
- Backend/API: route handlers, API endpoints, auth checks, database or external service calls
- Full-stack: UI plus route handlers/server actions/data mutations
- Platform/configuration: middleware, config, deployment, feature flags, env vars

In this project, default to **frontend** unless code evidence shows otherwise.

### 4. Choose output locations

Unless the repo already has a different documentation structure, use:

- Developer documentation: `docs/dev/<feature-slug>-implementation.md`
- User documentation: `docs/user/how-to-use-<feature-slug>.md`

Where `<feature-slug>` is the kebab-case feature name.

Examples:
- `Profile Settings` → `docs/dev/profile-settings-implementation.md`
- `Profile Settings` → `docs/user/how-to-use-profile-settings.md`

If `docs/dev` or `docs/user` do not exist, create them.

### 5. Generate developer documentation

Create a technical document with this structure:

# <Feature Name> Implementation

## Overview
- What the feature does
- Why it exists in the app
- Feature classification

## Next.js context
- Route or route segment where the feature lives
- Whether it uses App Router pages, layouts, route handlers, server actions, client components, or middleware
- Whether it depends on `next/font`, `next/image`, metadata, or other Next.js features

## Related Files
- List the relevant files with a one-line purpose for each

## Rendering and behavior
- Explain which parts render on the server vs client
- Note `"use client"` boundaries
- Explain props, state, hooks, and data flow
- Describe loading, empty, success, and error states if present

## API and data flow
Include only if relevant:
- Route handlers or API endpoints
- Request/response shapes
- Validation
- Auth/authorization
- External services or persistence
- Server actions and mutation flow

## UI details
- Main page or component flow
- Forms, buttons, navigation entry points
- Important conditional rendering and edge cases

## Assets and styling
- Relevant CSS, Tailwind, images from `public/`, icon usage, and font usage
- Any responsive behavior worth documenting

## Testing and verification
- Existing automated tests
- Manual test steps for localhost development
- Gaps if tests are missing

## Related documentation
- Link to the generated user doc
- Link to any existing README or related docs

Keep this practical, code-grounded, and specific to the repo.

### 6. Generate user documentation

Create a simple guide with this structure:

# How to use <Feature Name>

## What this feature does
- Plain-language description
- What users can accomplish with it

## Before you begin
- Where to find the feature in the app
- Any login, navigation, or prerequisites
- Anything the user must have configured first

## Steps
Write clear numbered steps using visible UI labels and route names where appropriate.

## What to expect
- Expected results
- Success confirmation
- Any delays, transitions, or states the user may see

## Screenshots
Insert screenshot references or placeholders near the relevant steps.

Preferred screenshot paths for this repo:
- `public/docs/<feature-slug>/<feature-slug>-entry.png`
- `public/docs/<feature-slug>/<feature-slug>-main.png`
- `public/docs/<feature-slug>/<feature-slug>-success.png`

If screenshots cannot be captured automatically, insert placeholders like:

![Screenshot placeholder: feature entry point](/docs/<feature-slug>/<feature-slug>-entry.png)
![Screenshot placeholder: main interaction screen](/docs/<feature-slug>/<feature-slug>-main.png)
![Screenshot placeholder: successful completion state](/docs/<feature-slug>/<feature-slug>-success.png)

Also add a short note beneath each placeholder describing what should be captured.

## Troubleshooting
- Common mistakes
- Validation errors or visible UI issues
- What to do if the expected result does not appear

## Related documentation
- Link to the developer implementation document
- Link to related user docs if they exist

Write for end users in plain language. Avoid internal code terminology unless it appears in the UI.

### 7. Cross-link documents

Add reciprocal links:

- Developer doc links to the user guide
- User doc links to the developer doc

Also link any relevant existing docs found in `README.md` or `docs/**`.

### 8. Screenshot automation

Check for existing screenshot tooling such as:
- Playwright
- Cypress
- Storybook
- existing screenshot scripts in `package.json`

If available and safe to reuse:
- run the app locally if needed
- capture screenshots for the main flow
- save them under `public/docs/<feature-slug>/`
- reference them in the user guide

If not available:
- create descriptive placeholders only
- do not invent screenshots

### 9. Write files

Create or update both documentation files.

Rules:
- Preserve useful existing content if matching docs already exist
- Follow existing markdown style if present
- Use relative links that work inside the repo

### 10. Final validation

Before finishing, verify:

- files exist in the intended paths
- links between docs are valid
- the docs reflect actual Next.js code organization
- frontend/backend/full-stack classification is accurate
- screenshots were either captured or clearly placeholdered
- Next.js-specific details are documented only when present in code

## Final response

Report:
- detected feature classification
- files created or updated
- main files analyzed
- whether screenshots were captured or placeholders were added
- related docs linked