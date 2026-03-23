# SnapFlow Project Rules 🧠

Always read these rules before starting any task in this repository.

## 🚩 Dev Rules

- **TDD Workflow**: You must always write a test before the implementation.
- **Auto-Commits**: Always perform a `git commit` to mark successful progress.
- **Fail-Safe Checks**: Never force a commit. Let the `husky` pre-commit hooks ensure that `npm run test` and `npm run test:integration` currently pass.
- **Secret Hygiene**: Never hardcode real-looking secrets (like `sb_publishable_*` or `sb_secret_*`) in code or CI configs. Use dynamic extraction (`supabase status -o json`) or GitHub Secrets.
- **Living Documentation**: Always update `README.md` when adding features, changing architectural patterns, or fixing persistent bugs. Document the "Why" and "How" to avoid repeating past mistakes.

## 🔗 Architecture

- Backend is Supabase (handled locally via Docker).
- Integration tests must run against the local Docker container.
- Front-end is Next.js App Router with Tailwind CSS.

## 🧪 Testing State

- **Unit Tests**: `npm run test`.
- **Integration Tests**: `npm run test:integration` (Verifies real DB connectivity).
- **E2E Tests**: `npx playwright test`.
