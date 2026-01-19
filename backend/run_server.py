"""
Expense Tracker - Standalone Server Entry Point
This is a self-contained script that bundles everything for PyInstaller.
"""
import sys
import os

# Set up working directory
if getattr(sys, 'frozen', False):
    # Running as compiled executable
    application_path = os.path.dirname(sys.executable)
else:
    application_path = os.path.dirname(os.path.abspath(__file__))

os.chdir(application_path)

# Now do the actual imports
import uvicorn
import webbrowser
import threading
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum

# ============== DATABASE SETUP ==============
DATABASE_URL = f"sqlite:///{os.path.join(application_path, 'expenses.db')}"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ============== MODELS ==============
class Expense(Base):
    __tablename__ = "expenses"
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    category = Column(String(100), nullable=False, index=True)
    description = Column(String(255), nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String(50), nullable=False, default="Unpaid", index=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


# ============== SCHEMAS ==============
class StatusEnum(str, Enum):
    UNPAID = "Unpaid"
    PAID = "Paid"
    COMPLETELY_PAID = "Completely Paid"


class ExpenseBase(BaseModel):
    category: str = Field(..., min_length=1, max_length=100)
    description: str = Field(..., min_length=1, max_length=255)
    amount: float = Field(..., ge=0)
    status: StatusEnum = StatusEnum.UNPAID
    notes: Optional[str] = None


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(BaseModel):
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, min_length=1, max_length=255)
    amount: Optional[float] = Field(None, ge=0)
    status: Optional[StatusEnum] = None
    notes: Optional[str] = None


class ExpenseResponse(ExpenseBase):
    id: int
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True


class ExpenseListResponse(BaseModel):
    expenses: List[ExpenseResponse]
    total: int


class CategoryTotal(BaseModel):
    category: str
    total: float
    count: int


class MetricsResponse(BaseModel):
    total_amount: float
    total_paid: float
    total_unpaid: float
    remaining_amount: float
    category_totals: List[CategoryTotal]
    expense_count: int


# ============== CRUD ==============
def get_expenses(db: Session, status: Optional[str] = None, category: Optional[str] = None):
    query = db.query(Expense)
    if status:
        query = query.filter(Expense.status == status)
    if category:
        query = query.filter(Expense.category == category)
    return query.order_by(Expense.created_at.desc()).all()


def get_expense_count(db: Session, status: Optional[str] = None, category: Optional[str] = None):
    query = db.query(func.count(Expense.id))
    if status:
        query = query.filter(Expense.status == status)
    if category:
        query = query.filter(Expense.category == category)
    return query.scalar()


def get_expense(db: Session, expense_id: int):
    return db.query(Expense).filter(Expense.id == expense_id).first()


def create_expense(db: Session, expense: ExpenseCreate):
    db_expense = Expense(
        category=expense.category,
        description=expense.description,
        amount=expense.amount,
        status=expense.status.value,
        notes=expense.notes
    )
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense


def update_expense(db: Session, expense_id: int, expense_update: ExpenseUpdate):
    db_expense = get_expense(db, expense_id)
    if not db_expense:
        return None
    update_data = expense_update.model_dump(exclude_unset=True)
    if 'status' in update_data and update_data['status'] is not None:
        update_data['status'] = update_data['status'].value
    for field, value in update_data.items():
        setattr(db_expense, field, value)
    db.commit()
    db.refresh(db_expense)
    return db_expense


def delete_expense(db: Session, expense_id: int):
    db_expense = get_expense(db, expense_id)
    if not db_expense:
        return False
    db.delete(db_expense)
    db.commit()
    return True


def get_metrics(db: Session):
    total_amount = db.query(func.sum(Expense.amount)).scalar() or 0.0
    total_paid = db.query(func.sum(Expense.amount)).filter(
        Expense.status.in_(["Paid", "Completely Paid"])
    ).scalar() or 0.0
    total_unpaid = db.query(func.sum(Expense.amount)).filter(
        Expense.status == "Unpaid"
    ).scalar() or 0.0
    completely_paid = db.query(func.sum(Expense.amount)).filter(
        Expense.status == "Completely Paid"
    ).scalar() or 0.0
    remaining_amount = total_amount - completely_paid
    category_data = db.query(
        Expense.category,
        func.sum(Expense.amount).label('total'),
        func.count(Expense.id).label('count')
    ).group_by(Expense.category).all()
    category_totals = [{"category": cat, "total": total, "count": count} for cat, total, count in category_data]
    expense_count = db.query(func.count(Expense.id)).scalar() or 0
    return {
        "total_amount": round(total_amount, 2),
        "total_paid": round(total_paid, 2),
        "total_unpaid": round(total_unpaid, 2),
        "remaining_amount": round(remaining_amount, 2),
        "category_totals": category_totals,
        "expense_count": expense_count
    }


def get_categories(db: Session):
    categories = db.query(Expense.category).distinct().all()
    return [cat[0] for cat in categories]


# ============== SEED DATA ==============
SEED_DATA = [
    {"category": "Utilities", "description": "Fridge + Washing machine + Maid", "amount": 775.00, "status": "Unpaid", "notes": None},
    {"category": "Utilities", "description": "Electricity Bill", "amount": 0.00, "status": "Unpaid", "notes": None},
    {"category": "Subscription", "description": "Apple one", "amount": 365.00, "status": "Unpaid", "notes": None},
    {"category": "SIP", "description": "Mutual Funds", "amount": 33500.00, "status": "Unpaid", "notes": None},
    {"category": "Rent", "description": "Monthly Apartment Rent", "amount": 7500.00, "status": "Unpaid", "notes": None},
    {"category": "EMI", "description": "Washing Machine", "amount": 2102.49, "status": "Unpaid", "notes": None},
    {"category": "EMI", "description": "Loan( 61500 )", "amount": 5580.00, "status": "Paid", "notes": None},
    {"category": "Credit Card Bill", "description": "Standard Charted Rewards", "amount": 0.00, "status": "Completely Paid", "notes": None},
    {"category": "Credit Card Bill", "description": "Axis Bank My Zone", "amount": 0.00, "status": "Completely Paid", "notes": None},
    {"category": "Credit Card Bill", "description": "Hsbc Bank Platinum", "amount": 0.00, "status": "Completely Paid", "notes": None},
    {"category": "Credit Card Bill", "description": "Induslnd Bank Legend", "amount": 0.00, "status": "Completely Paid", "notes": None},
    {"category": "Credit Card Bill", "description": "Federal Bank Singet Platinum", "amount": 0.00, "status": "Completely Paid", "notes": None},
    {"category": "Credit Card Bill", "description": "Federal Bank Scapia Rupay", "amount": 0.00, "status": "Completely Paid", "notes": None},
    {"category": "Credit Card Bill", "description": "Icici Bank Amazon pay", "amount": 42.00, "status": "Unpaid", "notes": None},
    {"category": "Credit Card Bill", "description": "Idfc First Bank Millennia", "amount": 819.00, "status": "Paid", "notes": None},
    {"category": "Credit Card Bill", "description": "Federal Bank Scapia Visa", "amount": 1540.00, "status": "Unpaid", "notes": None},
    {"category": "Credit Card Bill", "description": "Axis Bank Flipkart", "amount": 2411.00, "status": "Unpaid", "notes": None},
    {"category": "Credit Card Bill", "description": "Hdfc Bank Swiggy", "amount": 4335.00, "status": "Completely Paid", "notes": None},
    {"category": "Credit Card Bill", "description": "Hdfc Bank Moneyback", "amount": 4660.00, "status": "Paid", "notes": None},
    {"category": "Credit Card Bill", "description": "Yes Bank Pop Card", "amount": 36504.00, "status": "Unpaid", "notes": None},
]


def seed_database():
    db = SessionLocal()
    try:
        existing_count = db.query(Expense).count()
        if existing_count > 0:
            print(f"Database already has {existing_count} records. Skipping seed.")
            return
        for expense_data in SEED_DATA:
            expense = Expense(**expense_data)
            db.add(expense)
        db.commit()
        print(f"Successfully seeded {len(SEED_DATA)} expense records.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()


# ============== FASTAPI APP ==============
from fastapi import Depends, HTTPException, Query

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    seed_database()
    yield

app = FastAPI(title="Personal Expense Tracker", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Expense endpoints
@app.get("/expenses", response_model=ExpenseListResponse)
def api_get_expenses(
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    expenses = get_expenses(db, status=status, category=category)
    total = get_expense_count(db, status=status, category=category)
    return {"expenses": expenses, "total": total}


@app.get("/expenses/categories", response_model=List[str])
def api_get_categories(db: Session = Depends(get_db)):
    return get_categories(db)


@app.get("/expenses/{expense_id}", response_model=ExpenseResponse)
def api_get_expense(expense_id: int, db: Session = Depends(get_db)):
    expense = get_expense(db, expense_id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense


@app.post("/expenses", response_model=ExpenseResponse, status_code=201)
def api_create_expense(expense: ExpenseCreate, db: Session = Depends(get_db)):
    return create_expense(db, expense)


@app.put("/expenses/{expense_id}", response_model=ExpenseResponse)
def api_update_expense(expense_id: int, expense_update: ExpenseUpdate, db: Session = Depends(get_db)):
    expense = update_expense(db, expense_id, expense_update)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense


@app.delete("/expenses/{expense_id}", status_code=204)
def api_delete_expense(expense_id: int, db: Session = Depends(get_db)):
    if not delete_expense(db, expense_id):
        raise HTTPException(status_code=404, detail="Expense not found")
    return None


# Metrics endpoint
@app.get("/metrics", response_model=MetricsResponse)
def api_get_metrics(db: Session = Depends(get_db)):
    return get_metrics(db)


# Serve static files if they exist
STATIC_DIR = os.path.join(application_path, "static")
if os.path.exists(STATIC_DIR):
    @app.get("/")
    async def serve_index():
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))
    
    app.mount("/assets", StaticFiles(directory=os.path.join(STATIC_DIR, "assets")), name="assets")
    
    @app.get("/{path:path}")
    async def serve_static(path: str):
        file_path = os.path.join(STATIC_DIR, path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))
else:
    @app.get("/")
    def root():
        return {"message": "Expense Tracker API", "docs": "/docs"}


# ============== MAIN ==============
HOST = "127.0.0.1"
PORT = 8000


def open_browser():
    time.sleep(2)
    webbrowser.open(f"http://{HOST}:{PORT}")


def main():
    print("=" * 50)
    print("  Personal Expense Tracker")
    print("=" * 50)
    print(f"\n  Server: http://{HOST}:{PORT}")
    print("  Press Ctrl+C to stop\n")
    print("=" * 50)
    
    threading.Thread(target=open_browser, daemon=True).start()
    uvicorn.run(app, host=HOST, port=PORT, log_level="info")


if __name__ == "__main__":
    main()
