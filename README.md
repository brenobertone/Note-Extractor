# 📸 SnapFlow

SnapFlow is an intelligent note extraction application that transforms your physical notes, screenshots, and images into actionable digital records. Using OpenAI's vision models, it automatically categorizes your content into **Tasks** or **Habits** and persists them to a Supabase backend.

## 🚀 Key Features

- **AI Text Extraction**: Instantly extracts text from uploaded images using GPT-4o.
- **Multi-Image Upload**: Upload multiple images at once for combined analysis as a related package.
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

## 📸 Usage

### Single Image Upload

Click "Choose File", select an image, and click "Upload & Categorize". SnapFlow will extract text and categorize it automatically.

### Multi-Image Upload

1. Click "Choose File" and select multiple images (Cmd/Ctrl+Click or Shift+Click)
2. The UI will display the number of selected files
3. Click "Upload & Categorize"
4. GPT-4o will analyze all images together, understanding them as a related package
5. The combined content will be categorized and saved as a single entry

**Example use case**: Upload photos of whiteboard notes from a brainstorming session, and SnapFlow will combine them into one cohesive task list.

## 🧪 Testing & CI/CD

SnapFlow uses a multi-layered validation strategy to ensure code quality and prevent regressions.

### 🛡️ Validation Layers

| Layer           | Environment | Trigger      | Scope                                                |
| :-------------- | :---------- | :----------- | :--------------------------------------------------- |
| **Pre-commit**  | Local       | `git commit` | Lint, Types, Unit Tests, Integration Tests           |
| **CI (GitHub)** | Linux VM    | `git push`   | All standard checks + **Full Build** + **E2E Tests** |
| **Manual**      | Local       | Developer    | Quick feedback on UI changes                         |

### ⚓ Local Commands

- **Unit Tests**: `npm run test` (Fast, mocks external services)
- **Integration Tests**: `npm run test:integration` (Requires local Supabase Docker)
- **E2E Tests**: `npx playwright test` (Browser-based flow)
- **Format Fix**: `npm run format:write`

### 🤖 CI Workflow (GitHub Actions)

Our [.github/workflows/ci.yml](.github/workflows/ci.yml) uses the **Supabase CLI** to start a full local stack in the cloud. It dynamically extracts JWT keys at runtime using `supabase status -o json` to maintain perfect security without hardcoding secrets.

## 📂 Project Structure

- `/src/app`: Next.js pages and API routes.
- `/src/components`: UI components including the `UploadComponent`.
- `/src/__tests__`: Unit and Integration test suites.
- `/e2e`: Playwright end-to-end specifications.
- `/supabase`: Database migrations and configuration.
- `.agent/rules.md`: Local AI instructions for consistent development.

## 🌟 Best Practices for Advancing

To keep SnapFlow robust as you add features:

1. **Follow TDD**: Always add a test in `src/__tests__` before implementing a new API route or complex component.
2. **Schema-First**: When changing the database, use `npx supabase db diff` to generate migrations. Never edit the DB directly.
3. **Secret Hygiene**: Use the `supabase status` method for keys in CI. Never commit `sb_` keys to the repository.
4. **Isolate Logic**: Keep LLM prompts and parsing in dedicated utility files as the complexity of your extractions grows.

---

Built with ❤️ by Antigravity
