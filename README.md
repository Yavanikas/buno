## Buno

A Next.js budgeting web app to set a monthly budget, log expenses, 
and analyze spending patterns over time without giving the actual figures.

## Features
- Set and edit monthly budget (USD / INR toggle support)
- Add and delete expenses
- Qualitative Spending Window: daily spending pace without numerical stress
- AI Pattern Insights: observations on spending rhythm and categories
- Editorial Ledger visual design system

## Setup

```bash
npm install
npm run dev
```

The app runs on `http://localhost:3000` by default. Build output uses 
the standard Next.js `.next` folder.

## Tech Stack
- Next.js (App Router)
- React & Tailwind CSS
- TypeScript

## AI Tooling & API Integration

This project integrates AI features within the product and utilized AI tools during development:

### ChatGPT 5.6 (OpenAI API & Development)
- **In-App API Integration**: ChatGPT 5.6 (via OpenAI API) powers Buno's backend endpoints (`/api/advice` and `/api/pattern-insight`). It generates friendly, qualitative budget guidance, greetings, and spending observations without ever showing numerical figures or currency amounts.
- **Development & Architecture**: ChatGPT 5.6 was used as an AI pair programmer for architectural planning, prompt engineering, qualitative safety guardrails, state management, and multi-currency conversion logic (INR/USD).

### Codex
- **Code Scaffolding & Layout Refactoring**: Codex was used for scaffolding component boilerplate, CSS layout refactoring (via `codex/*` branches), and PR reviews.
- **Review Process**: All AI-proposed changes and branch pull requests were manually code-reviewed, tested locally (`npm run dev` and `npm run test`), and verified before being merged into `main`.

## Project Structure

| File | Purpose |
|---|---|
| `app/page.tsx` | Main dashboard: editorial ledger layout, budget setup, and expense logging |
| `app/api/advice/route.ts` | Qualitative AI advice endpoint powered by ChatGPT 5.6 API |
| `app/api/pattern-insight/route.ts` | AI pattern insight endpoint powered by ChatGPT 5.6 API |
| `components/ProbabilityWindow.tsx` | Real-time qualitative spending pace and risk window |
| `components/PatternInsight.tsx` | AI spending pattern observations component |
| `lib/calc.ts` | Qualitative budget calculations and risk state evaluation |
| `lib/patterns.ts` | Spending rhythm analysis and pattern metrics |
