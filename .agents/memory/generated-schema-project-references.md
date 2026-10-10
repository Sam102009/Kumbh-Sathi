---
name: Generated schema project references
description: API server typechecks can see stale generated declarations after OpenAPI code generation.
---

After OpenAPI code generation, the API server may report generated `@workspace/api-zod` exports as missing until that referenced TypeScript project has been built.

**Why:** The workspace uses TypeScript project references, and `tsc --noEmit` in the API server does not rebuild its referenced schema package.

**How to apply:** When new generated schema exports appear missing, build the `api-zod` project reference before rerunning the API server typecheck.
