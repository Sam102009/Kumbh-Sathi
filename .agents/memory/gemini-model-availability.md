---
name: Gemini model availability
description: Direct Gemini API keys can reject model names that are unavailable to newly enabled users.
---

For direct Gemini API calls, Google rejected `gemini-2.5-flash` for a newly enabled key with a 404 and recommended `gemini-3.8-flash`; the latter worked for schedule translation on 2026-10-10.

**Why:** Model availability can vary independently of SDK support, so a provider model 404 does not necessarily mean the API key is invalid.

**How to apply:** When a direct Gemini request returns a model 404, use the provider's error guidance and verify the replacement model with a small request before debugging credentials.
