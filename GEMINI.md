# GEMINI.md

This file provides guidance to GEMINI Code when working with code in this repository.

## Project Overview

A full-stack personal expense tracking application. FastAPI backend with SQLAlchemy ORM (SQLite), React/TypeScript frontend with Tailwind CSS. Packaged as a single PyInstaller executable for distribution.

## Architecture

### Backend (`backend/`)
- **Entry point**: `run.py` — production server with static file serving for the built frontend
- **API**: `app/main.py` — FastAPI application with lifespan startup for table creation and database seeding
- **Router pattern**: All API routes live in `app/routers/`. Imported and registered in `app/main.py` with `/api` prefix. Routers mirror frontend features: `expenses`, `metrics`, `auth`, `export`, `recurring`, `tags`, `budgets`, `income`, `reminders`, `analytics`, `payees`, `subcategories`, `groups`, `splits`, `templates`, `batch`, `accounts`, `savings`, `payment_methods`, `currency`, `reports`, `data_import`, `family`.
- **Models**: `app/models.py` — SQLAlchemy declarative models. `User` is the root entity; most tables have `user_id` FK for row-level isolation. Key models: `Expense`, `RecurringExpense`, `Tag`, `CategoryBudget`, `Income`, `Payee`, `SubCategory`, `SplitExpense`, `ExpenseGroup`, `Account`, `SavingsGoal`, `PaymentMethod`, `CurrencyRate`, `Family`/`FamilyMember`.
- **Schemas**: `app/schemas.py` — Pydantic v2 models (use `model_dump()`, not `dict()`). `StatusEnum`, `FrequencyEnum` are string enums.
- **CRUD**: `app/crud.py` — low-level database operations. Authz is enforced by `user_id` filtering in queries.
- **Auth**: `app/auth.py` — JWT tokens (HS256, argon2 password hashing). `get_current_user` dependency injects the authenticated user into all protected routes.
- **Database**: SQLite via SQLAlchemy. During dev: `backend/data/expenses.db`. When frozen (PyInstaller): `~/.local/share/ExpenseTracker/expenses.db` (Linux), `~/Library/Application Support/ExpenseTracker/expenses.db` (macOS), `%APPDATA%\ExpenseTracker\expenses.db` (Windows). Configured in `app/database.py`.

### Frontend (`frontend/`)
- **Entry point**: `src/main.tsx` → `src/App.tsx`
- **Build tool**: Vite with PWA plugin (`vite-plugin-pwa`). Static files served by backend in production.
- **Proxy**: Vite dev server proxies `/api` to `http://localhost:8000` (see `vite.config.ts`)
- **Routing**: No React Router. App.tsx is a single component with `activeTab` state that conditionally renders page components: `expenses`, `recurring`, `income`, `tags`, `analytics`, `organize`, `finance`, `data`.
- **API layer**: `src/services/api.ts` — all Axios API calls. Each feature has a namespaced export (e.g., `expenseApi`, `incomeApi`). JWT is injected via request interceptor reading `localStorage.getItem('auth_token')`.
- **Types**: `src/types.ts` — mirrors backend Pydantic schemas. Contains helper functions `formatBillingMonth()`, `getCurrentBillingMonth()`, `generateMonthRange()`.
- **UI components**: `src/components/` contains feature pages (e.g., `Dashboard.tsx`, `IncomeDashboard.tsx`). Shared UI primitives are in `src/components/ui/` (Button, Card, Input, etc.)
- **State**: React `useState` and `useCallback` in `App.tsx`. No external state library.
- **Styling**: Tailwind CSS with dark: variants. Custom animations in `src/index.css`.

## Development Commands

### Backend (Python 3.11+)
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
```
Run dev server: `python -m uvicorn app.main:app --reload` (localhost:8000)

### Frontend (Node 18+)
```bash
cd frontend
npm install
```
Run dev: `npm run dev` (localhost:5173)
Build: `npm run build` (output to `frontend/dist/`, served by backend)
Lint: `npm run lint`
Preview: `npm run preview`

### Combined (Packaged Build)
Build frontend first, then run PyInstaller:
```bash
cd frontend && npm run build
cd ../backend
pyinstaller expense_tracker.spec --clean
# Output: backend/dist/ExpenseTracker (or .exe on Windows)
```

## Key Conventions

- **Backend auth**: Use `current_user: models.User = Depends(get_current_user)` in every route that needs auth. Always filter queries by `current_user.id`.
- **Pydantic v2**: Use `model_dump()` and `model_dump(exclude_unset=True)`, not `dict()`.
- **Billing month format**: `YYYY-MM` string. Use `get_current_billing_month()` in backend; `getCurrentBillingMonth()` in frontend.
- **Expense status**: String values — `Unpaid`, `Paid`, `Completely Paid`. Backend uses `StatusEnum` schema; frontend uses `ExpenseStatus` type.
- **Currency default**: `INR`.
- **Frontend auth**: Token and user data stored in localStorage under `auth_token` and `auth_user`.
- **API base**: Frontend uses relative path `/api`. Vite proxy handles forwarding in dev; production serves via `run.py` static file mount.
- **Data import/export**: `DataPage` component handles CSV import, JSON backup, and data sharing (family).
