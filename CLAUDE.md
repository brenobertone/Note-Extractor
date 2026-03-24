# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SnapFlow is an AI-powered note extraction application that transforms images into categorized digital records. It uses OpenAI's GPT-4o vision model to extract text from images and automatically categorizes content as "Tasks" or "Habits", persisting to a Supabase PostgreSQL backend.

## Development Commands

### Setup

```bash
npx supabase start              # Start local Supabase (Docker required)
npm install                     # Install dependencies
```

### Development

```bash
npm run dev                     # Start Next.js dev server (http://localhost:3000)
npm run build                   # Production build
```

### Testing

```bash
npm run test                    # Unit tests (mocked, fast)
npm run test:watch              # Unit tests in watch mode
npm run test:integration        # Integration tests (requires Supabase Docker)
npx playwright test             # E2E tests (auto-starts dev server)
```

### Code Quality

```bash
npm run lint                    # ESLint
npm run type-check              # TypeScript validation
npm run format:write            # Auto-fix formatting issues
npm run format:check            # Check formatting
```

## Architecture

### Core Flow

1. User uploads image via `UploadComponent` (frontend)
2. POST to `/api/process` with FormData
3. API route converts image to base64, sends to OpenAI GPT-4o
4. LLM returns JSON: `{content: string, category: "Tasks"|"Habits"}`
5. Data persisted to `user_actions` table in Supabase
6. Response returned to frontend

### Key Files

- **API Route**: `src/app/api/process/route.ts` - Main processing endpoint
- **Database Schema**: `supabase/migrations/20260323000000_create_user_actions.sql`
- **Frontend**: `src/components/UploadComponent.tsx`
- **Unit Tests**: `src/__tests__/api/process.test.ts` (mocks Supabase & OpenAI)
- **Integration Tests**: `src/__tests__/integration/database.test.ts` (real Supabase)
- **E2E Tests**: `e2e/upload.spec.ts` (Playwright)

### Database

- Local Supabase stack runs via Docker (`npx supabase start`)
- Schema defined in SQL migrations under `supabase/migrations/`
- Table: `user_actions` with columns: id, content, category, created_at
- RLS enabled with permissive policy for development

### Testing Strategy

Three test layers with different scopes:

1. **Unit Tests** (`npm run test`): Mock external services (Supabase, OpenAI). Fast feedback.
2. **Integration Tests** (`npm run test:integration`): Real Supabase connection. Validates DB operations.
3. **E2E Tests** (`npx playwright test`): Full browser flow. Validates UI interactions.

**Test Exclusion**: Vitest config excludes `e2e/` directory; Playwright config targets `e2e/` only.

## Development Workflow

### Test-Driven Development (TDD)

**Always write tests before implementation**. Pattern:

1. Write test in `src/__tests__/` (unit or integration)
2. Run test to verify it fails
3. Implement minimal code to pass
4. Refactor if needed
5. Commit progress (see Git workflow below)

### Database Migrations

When modifying schema:

```bash
# Make manual changes to migrations or edit live schema in Studio
npx supabase db diff -f <migration_name>  # Generate migration file
npx supabase db reset                      # Apply to local DB
```

Never edit the database directly without creating a migration.

### Git Workflow

- **Never commit directly to main**: Always create a feature branch and open a PR for review
- **Pre-commit hooks** (via Husky): Run format, lint, type-check, unit tests, and integration tests
- **Auto-commits encouraged**: Commit frequently to mark progress on your feature branch
- **Never force commits**: Let pre-commit hooks fail if tests break
- **CI Pipeline**: GitHub Actions validates on push (includes full build + E2E tests)

### Secret Management

- **Local**: Use `.env.local` for development keys
- **CI**: GitHub Actions dynamically extracts JWT keys via `supabase status -o json`
- **Never commit**: Real Supabase keys (prefixed `sb_`) or OpenAI keys to the repository

### CI/CD Pipeline

`.github/workflows/ci.yml` runs on push/PR:

1. Lint, type-check, format check
2. Build Next.js app
3. Run unit tests
4. Start Supabase via CLI in GitHub runner
5. Extract ANON_KEY and SERVICE_ROLE_KEY dynamically using `jq`
6. Run integration tests against Supabase
7. Install Playwright browsers
8. Run E2E tests
9. Upload Playwright report as artifact

**Key insight**: CI uses `supabase status -o json | jq` to extract keys at runtime, avoiding hardcoded secrets.

## Important Practices

### When Adding Features

1. Start with a test in `src/__tests__/`
2. Keep LLM prompts and parsing logic in dedicated utility files if complexity grows
3. Update README.md when architectural patterns change
4. Ensure integration tests cover new database operations

### Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase endpoint (local: `http://127.0.0.1:54321`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Public anon key
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (for API routes)
- `OPENAI_API_KEY`: OpenAI API key for GPT-4o access

### Path Aliases

TypeScript configured with `@/` alias pointing to `src/` directory (see `vitest.config.ts` and `tsconfig.json`).
