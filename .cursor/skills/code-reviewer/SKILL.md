---
name: code-reviewer
description: Review a git diff for correctness, missed edge cases, error handling, naming and clarity, security flags such as hardcoded secrets or missing input validation, and test coverage gaps. Use when the user asks for a code review, reviews a diff, or invokes the code-reviewer skill.
disable-model-invocation: true
---

# Code review

Review the current diff. Read the changed files and nearby callers before commenting. Do not restyle unrelated code.

Check each change for:

- **Correctness** — the change does what it claims, including failure paths
- **Edge cases** — empty input, missing records, duplicates, boundaries
- **Error handling** — failures return a clear status or error instead of being swallowed
- **Naming and clarity** — names match the domain; dense logic is readable
- **Security** — hardcoded secrets, missing input validation, auth gaps, unsafe data exposure
- **Tests** — new behavior and the failure paths above have no covering test

## Output

Reply with a short bulleted list grouped by severity. Name the file and the change to make. If a group has no findings, say so in one line.

```markdown
## Critical
- `path`: what is wrong and what to change

## Warning
- `path`: what is wrong and what to change

## Note
- `path`: what is wrong and what to change
```

Severity:

- **Critical** — wrong behavior, a security issue, or a missing check that can lose or expose data
- **Warning** — an edge case, weak error handling, or a missing test
- **Note** — naming or clarity only

## Example

```markdown
## Critical
- `src/app/api/bookings/route.ts`: request body is cast, not validated. Parse it with Zod and return 400 on failure.

## Warning
- `src/app/api/bookings/route.ts`: no test covers the 409 response when a seat is already booked.

## Note
- None.
```
