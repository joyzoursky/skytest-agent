# Test runner hardening — implementation plan

**Goal:** Harden `src/lib/test-runner.ts` for production multi-tenant use (credentials, SSRF, uploads, sandbox hardening, API key isolation).

## Task 1: Fix lint/type issues in test runner (no behavior changes)
**Files:**
- `src/lib/test-runner.ts`

**Steps:**
- Replace `any` usage in Playwright console listener with Playwright types.
- Remove unused imports and dead code.

**Validation:**
- `npx tsc -p tsconfig.json --noEmit`

## Task 2: Credentials correctness
**Files:**
- `src/lib/test-runner.ts`

**Steps:**
- Thread `RunTestOptions.config.username/password` into the implicit `main` browser config.
- Ensure Playwright-code and placeholder replacement see consistent credentials.

**Validation:**
- `npx tsc -p tsconfig.json --noEmit`

## Task 3: Runtime SSRF request filtering (DNS rebinding / redirects)
**Files:**
- `src/lib/url-security.ts`
- `src/lib/url-security-runtime.ts` (new)
- `src/config/app.ts`
- `src/lib/test-runner.ts`

**Steps:**
- Add helpers for checking blocked IPs.
- Add runtime validator that resolves DNS with caching + TTL.
- Install Playwright `context.route` to block unsafe requests.

**Validation:**
- `npx tsc -p tsconfig.json --noEmit`

## Task 4: File allowlisting + intercept `setInputFiles` everywhere
**Files:**
- `src/lib/test-runner.ts`

**Steps:**
- Build per-step allowlist from `testCaseId` + `step.files`.
- Provide a `stepFiles` map in the Playwright VM context.
- Proxy-wrap any object returned from `page.*` methods that has `setInputFiles`.

**Validation:**
- `npx tsc -p tsconfig.json --noEmit`

## Task 5: Playwright-code sandbox hardening
**Files:**
- `src/config/app.ts`
- `src/lib/test-runner.ts`

**Steps:**
- Disable VM codegen from strings/wasm.
- Add sync execution timeout.
- Track/cleanup timers at end of Playwright-code step.

**Validation:**
- `npx tsc -p tsconfig.json --noEmit`

## Task 6: Midscene env isolation across concurrent runs
**Files:**
- `src/lib/midscene-env.ts` (new)
- `src/lib/test-runner.ts`

**Steps:**
- Implement keyed acquisition/restore manager.
- Run the test under the manager so env is consistent.

**Validation:**
- `npx tsc -p tsconfig.json --noEmit`

## Task 7: Operational polish
**Files:**
- `src/lib/test-runner.ts`

**Steps:**
- Fix screenshot MIME label to match configured type.
- Improve abort handling during setup to avoid misleading logs and partial state.

**Validation:**
- `npx tsc -p tsconfig.json --noEmit`
