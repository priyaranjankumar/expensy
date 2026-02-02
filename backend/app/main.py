from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .database import engine, Base
from .routers import expenses, metrics, auth, export, recurring, tags, budgets, income, reminders, analytics, payees, subcategories, groups, splits, templates, batch, accounts, savings, payment_methods, currency, reports, data_import, family
from .seed import seed_database


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler for startup/shutdown events."""
    # Startup: Create tables and seed database
    Base.metadata.create_all(bind=engine)
    seed_database()
    yield
    # Shutdown: Nothing to clean up


app = FastAPI(
    title="Personal Expense Tracker API",
    description="A comprehensive API for tracking and managing personal expenses",
    version="2.0.0",
    lifespan=lifespan
)

# Configure CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(expenses.router, prefix="/api")
app.include_router(metrics.router, prefix="/api")
app.include_router(export.router, prefix="/api")
app.include_router(recurring.router, prefix="/api")
app.include_router(tags.router, prefix="/api")
app.include_router(budgets.router, prefix="/api")
app.include_router(income.router, prefix="/api")
app.include_router(reminders.router, prefix="/api")
app.include_router(analytics.router, prefix="/api")
app.include_router(payees.router, prefix="/api")
app.include_router(subcategories.router, prefix="/api")
app.include_router(groups.router, prefix="/api")
app.include_router(splits.router, prefix="/api")
app.include_router(templates.router, prefix="/api")
app.include_router(batch.router, prefix="/api")
app.include_router(accounts.router, prefix="/api")
app.include_router(savings.router, prefix="/api")
app.include_router(payment_methods.router, prefix="/api")
app.include_router(currency.router, prefix="/api")
app.include_router(reports.router, prefix="/api")
app.include_router(data_import.router, prefix="/api")
app.include_router(family.router, prefix="/api")


@app.get("/", tags=["root"])
def read_root():
    """Root endpoint with API information."""
    return {
        "message": "Personal Expense Tracker API",
        "version": "2.0.0",
        "docs": "/docs",
        "endpoints": {
            "auth": "/auth",
            "expenses": "/expenses",
            "metrics": "/metrics"
        }
    }


@app.get("/health", tags=["health"])
def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
