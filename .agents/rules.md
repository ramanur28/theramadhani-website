# Autonomous Build-Update-Verify Law
For every feature request, bug fix, or refactor:
1. Delegate to `@architect` to design the spec and auto-generate/update `.agents/qa_matrix.md`.
2. Delegate to `@implementer` to write the code, sync any discovered edge cases into `.agents/qa_matrix.md`, and write automated tests.
3. Delegate to `@qa-verifier` to execute every item in `.agents/qa_matrix.md` (running automated suites for untouched modules + live Chrome `/browser` and API edge-case testing for all modified flows).
4. Never return control to the user until `@qa-verifier` marks 100% of `.agents/qa_matrix.md` as `[PASS]`.