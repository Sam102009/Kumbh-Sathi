---
name: GitHub push access
description: Distinguish an account-level GitHub connection from authentication available to the project shell.
---

An account-level GitHub connection does not guarantee that `git` or `gh` in the project workspace can push. Verify workspace-shell authentication before reporting a push as complete; do not keep retrying an account-level connection that remains unavailable to the shell.

**Why:** The GitHub connection appeared authorized and binding returned success, but the project shell remained unauthenticated and GitHub rejected pushes. A reauthorization proposal also requires a valid connected integration, not the account-level connection ID.

**How to apply:** Keep credentials out of chat. If the project shell cannot authenticate, ask the user to connect GitHub to the Repl through a valid workspace integration or push the already-created local commit themselves.
