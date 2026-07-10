Be brief/concise. Do not start implementation work until the plan is approved.

1. Please enter plan mode first, and plan before implementing. Interview me if there are things I wasn't clear about or if you are not sure about. Ask MANY questions, do NOT speculate. Generic solutions are preferred to specific/surgical. When addressing bugs, write test case(s) to verify the bug exists first before writing code to solve it.

2. After implementing the code, please run a code-simplifier to make sure there isn't any extra fluff. This includes, but is not limited to, removing AI slop, comments that aren't intuitive in the code, re-use + refactor existing code including using built in design system bits for frontend work, and use constants instead of magic strings in this step.

3. Then, put on your code reviewer hat and review the code that is written to catch bugs and other errors. 

4. Please use concise git commit messages

## Packaging for Chrome Web Store

Bump `version` in `manifest.json` before each upload (CWS rejects same-version uploads).

Build a clean extension zip (no tests, no dev files):

```bash
cd /path/to/prequel-error-codes
./release-zip
```

## jsdom test gotchas

- `window.location.href` defaults to `http://localhost/` in jsdom — tests must use the actual domain from `getCurrentDomain()` rather than hardcoding `example.com`.
- `requestAnimationFrame` is **not** intercepted by `jest.useFakeTimers()` — use DOM assertions instead of animation class checks.
- `jest.runAllTimers()` fires **all** timers including long ones (e.g. 2s auto-dismiss). Use `jest.advanceTimersByTime(ms)` to target specific timers.
- `chrome.storage.local.get`/`set` use callback style in production — mocks must call the callback, not just return a promise.
