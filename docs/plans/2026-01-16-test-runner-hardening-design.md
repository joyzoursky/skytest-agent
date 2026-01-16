# Test runner hardening — design notes

**Date:** 2026-01-16

## Goals
- Make `src/lib/test-runner.ts` production-ready for multi-tenant use.
- Reduce security risk from:
  - Playwright-code execution
  - file uploads used from Playwright code
  - SSRF (DNS rebinding / redirect chains)
  - global env API-key leakage across concurrent runs
- Improve correctness and ergonomics around credential usage.

## Key decisions

### 1) Credentials
- Treat `RunTestOptions.config.username/password` as defaults for the implicit `main` browser target.
- Also continue supporting `browserConfig.<id>.username/password` for multi-browser setups.
- Expose credentials to Playwright code via `username`, `password`, and `credentials` bindings.

### 2) Runtime SSRF controls
- Keep existing static URL validation (`validateTargetUrl`) for fast feedback.
- Add *runtime* request filtering at the Playwright context layer:
  - validate every request URL (protocol/hostname allowlist)
  - DNS resolve hostnames and block private IP ranges (DNS rebinding protection)
  - cache DNS results with TTL to reduce overhead

### 3) File upload controls for Playwright code
- Enforce the promise in error messages: only files uploaded for the current test case.
- For Playwright code steps, build an allowlist of absolute file paths from:
  - `testCaseId`
  - `TestStep.files` (file IDs)
  - `RunTestOptions.config.files` (file metadata)
- Intercept `setInputFiles` on *any* object produced from `page` (Page/Locator/ElementHandle/etc.) by wrapping return values.
- Reject any file path not in the step allowlist.

### 4) Playwright-code sandbox hardening
- Continue using `node:vm` but assume it is not a perfect sandbox.
- Add defense-in-depth:
  - disable code generation from strings/wasm in the VM context
  - add a synchronous execution timeout to `runInContext` to reduce infinite-loop risk
  - wrap timers and clean them up at the end of the Playwright-code step

### 5) OpenRouter / Midscene API key isolation
- Avoid cross-run API key leakage by introducing a process-level manager:
  - allows concurrent runs only when the API key is identical
  - serializes runs across *different* keys
  - sets env at acquisition time and restores previous env at release

## Non-goals
- Replacing Playwright-code with a DSL or running in an external container.
- Repo-wide lint cleanup (out of scope).
