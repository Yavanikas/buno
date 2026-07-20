#Buno

A Next.js budgeting web app to set a monthly budget, log expenses, 
and analyze spending patterns over time without giving the actual figures

## Features
- Set and edit monthly budget
- Add and delete expenses
- Overview tab: current month budget vs. spending
- Patterns tab: monthly spending trends and category breakdown

## Setup

```bash
npm install
npm run dev
```

The app runs on `http://localhost:3000` by default. Build output uses 
the standard Next.js `.next` folder.

## Tech Stack
- Next.js (App Router)
- React (useReducer for state management)
- TypeScript

## AI Tooling Disclosure

This project used AI coding assistants during development. Details below 
for transparency:

### GPT-5.6
Used for architectural planning, state-shape design (reducer actions for 
budget/expense CRUD), and code review of components like `BudgetEditor` 
and `patternAnalysis.ts`. GPT-5.6 is OpenAI's flagship model family 
(Sol/Terra/Luna variants), released July 2026, with strong coding and 
agentic capabilities [web:16][web:18].

### Codex
Used for scaffolding boilerplate (component files, initial CRUD handlers) 
via a `codex-pr-review` branch. Note: not all AI-proposed changes were 
merged — some branch attempts were discarded after review found they 
didn't modify actual source files (only dependency locks), so only 
verified, tested diffs were merged into `main`.

### Review Process
All AI-generated code was manually reviewed, tested locally via 
`npm run dev`, and verified with `git diff` before merging to `main`. 
No AI output was merged without a human confirming the actual file diff.

## Project Structure

| File | Purpose |
|---|---|
| `app/page.tsx` | Overview: budget summary, edit UI, expense list |
| `app/patterns/page.tsx` | Patterns tab: insights and trend analysis |
| `components/BudgetEditor.tsx` | Editable budget UI |
| `components/ExpenseList.tsx` | Expense list with delete |
| `lib/patternAnalysis.ts` | Category totals, month-over-month diffs |
| `hooks/useBudgetState.ts` | useReducer state + actions |
