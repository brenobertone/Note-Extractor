# 📸 SnapFlow

SnapFlow is an intelligent note extraction application that transforms your physical notes, screenshots, and images into actionable digital records. Using OpenAI's vision models, it automatically categorizes your content into **Tasks** or **Habits** and persists them to a Supabase backend.

## 🚀 Key Features

- **AI Text Extraction**: Instantly extracts text from uploaded images using GPT-4o.
- **Auto-Categorization**: Intelligently separates "Tasks" (to-do items) from "Habits" (recurring behaviors).
- **Local Infrastructure**: Runs a complete Supabase stack locally using Docker for development.
- **Tested with TDD**: Built with a strict Test-Driven Development workflow using Vitest and Playwright.

## 🛠️ Technology Stack

- **Frontend**: Next.js (App Router), Tailwind CSS
- **AI**: OpenAI Vision (AI SDK)
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Tests**: Vitest (Unit), Playwright (E2E)
- **Dev Tools**: Docker Desktop, Supabase CLI

## 🏁 Getting Started

### 1. Prerequisites

- [Node.js v20+](https://nodejs.org/)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (must be running for local database)

### 2. Installation

```bash
npm install
```

### 3. Setup Infrastructure

Initialize and start the local Supabase environment:

```bash
npx supabase start
```

_Wait for the "Started supabase local development setup" message. Studio will be available at http://127.0.0.1:54323._

### 4. Configuration

Create a `.env.local` file (one was automatically created for you during the initial setup):

```env
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=your_real_openai_key
```

### 5. Running the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start using SnapFlow.

## 🧪 Testing

### Unit Tests (Vitest)

Tests for individual components and API logic using mocks.

```bash
npm run test
```

### Integration Tests (Database)

Verify the connection to your local Docker database:

```bash
npx tsx src/scripts/test-db-connection.ts
```

### E2E Tests (Playwright)

Browser-based verification of the entire user flow.

```bash
npx playwright test
```

## 📂 Project Structure

- `/src/app`: Next.js pages and API routes.
- `/src/components`: UI components including the `UploadComponent`.
- `/src/__tests__`: Unit and Integration test suites.
- `/e2e`: Playwright end-to-end specifications.
- `/supabase`: Database migrations and configuration.

---

Built with ❤️ by Antigravity
