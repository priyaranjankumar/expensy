from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, date

from ..database import get_db
from .. import crud, schemas, models
from ..auth import get_current_user

router = APIRouter(prefix="/recurring", tags=["recurring"])


@router.get("", response_model=List[schemas.RecurringExpenseResponse])
def get_recurring_expenses(
    active_only: bool = Query(False, description="Return only active recurring expenses"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all recurring expenses for the current user."""
    query = db.query(models.RecurringExpense).filter(
        models.RecurringExpense.user_id == current_user.id
    )
    if active_only:
        query = query.filter(models.RecurringExpense.is_active == True)
    
    recurring = query.order_by(models.RecurringExpense.created_at.desc()).all()
    
    # Convert date fields to strings
    results = []
    for r in recurring:
        result = schemas.RecurringExpenseResponse(
            id=r.id,
            category=r.category,
            description=r.description,
            amount=r.amount,
            frequency=r.frequency,
            day_of_month=r.day_of_month,
            is_active=r.is_active,
            notes=r.notes,
            start_date=r.start_date.isoformat() if r.start_date else None,
            end_date=r.end_date.isoformat() if r.end_date else None,
            last_generated=r.last_generated,
            created_at=r.created_at,
            updated_at=r.updated_at
        )
        results.append(result)
    
    return results


@router.get("/{recurring_id}", response_model=schemas.RecurringExpenseResponse)
def get_recurring_expense(
    recurring_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get a single recurring expense by ID."""
    recurring = db.query(models.RecurringExpense).filter(
        models.RecurringExpense.id == recurring_id,
        models.RecurringExpense.user_id == current_user.id
    ).first()
    
    if not recurring:
        raise HTTPException(status_code=404, detail="Recurring expense not found")
    
    return schemas.RecurringExpenseResponse(
        id=recurring.id,
        category=recurring.category,
        description=recurring.description,
        amount=recurring.amount,
        frequency=recurring.frequency,
        day_of_month=recurring.day_of_month,
        is_active=recurring.is_active,
        notes=recurring.notes,
        start_date=recurring.start_date.isoformat() if recurring.start_date else None,
        end_date=recurring.end_date.isoformat() if recurring.end_date else None,
        last_generated=recurring.last_generated,
        created_at=recurring.created_at,
        updated_at=recurring.updated_at
    )


@router.post("", response_model=schemas.RecurringExpenseResponse, status_code=201)
def create_recurring_expense(
    recurring_data: schemas.RecurringExpenseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create a new recurring expense."""
    recurring = models.RecurringExpense(
        user_id=current_user.id,
        category=recurring_data.category,
        description=recurring_data.description,
        amount=recurring_data.amount,
        frequency=recurring_data.frequency.value,
        day_of_month=recurring_data.day_of_month,
        is_active=recurring_data.is_active,
        notes=recurring_data.notes,
        start_date=date.fromisoformat(recurring_data.start_date),
        end_date=date.fromisoformat(recurring_data.end_date) if recurring_data.end_date else None
    )
    
    db.add(recurring)
    db.commit()
    db.refresh(recurring)
    
    return schemas.RecurringExpenseResponse(
        id=recurring.id,
        category=recurring.category,
        description=recurring.description,
        amount=recurring.amount,
        frequency=recurring.frequency,
        day_of_month=recurring.day_of_month,
        is_active=recurring.is_active,
        notes=recurring.notes,
        start_date=recurring.start_date.isoformat(),
        end_date=recurring.end_date.isoformat() if recurring.end_date else None,
        last_generated=recurring.last_generated,
        created_at=recurring.created_at,
        updated_at=recurring.updated_at
    )


@router.put("/{recurring_id}", response_model=schemas.RecurringExpenseResponse)
def update_recurring_expense(
    recurring_id: int,
    recurring_update: schemas.RecurringExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update an existing recurring expense."""
    recurring = db.query(models.RecurringExpense).filter(
        models.RecurringExpense.id == recurring_id,
        models.RecurringExpense.user_id == current_user.id
    ).first()
    
    if not recurring:
        raise HTTPException(status_code=404, detail="Recurring expense not found")
    
    update_data = recurring_update.model_dump(exclude_unset=True)
    
    # Handle frequency enum
    if "frequency" in update_data and update_data["frequency"]:
        update_data["frequency"] = update_data["frequency"].value
    
    # Handle end_date conversion
    if "end_date" in update_data and update_data["end_date"]:
        update_data["end_date"] = date.fromisoformat(update_data["end_date"])
    
    for key, value in update_data.items():
        setattr(recurring, key, value)
    
    db.commit()
    db.refresh(recurring)
    
    return schemas.RecurringExpenseResponse(
        id=recurring.id,
        category=recurring.category,
        description=recurring.description,
        amount=recurring.amount,
        frequency=recurring.frequency,
        day_of_month=recurring.day_of_month,
        is_active=recurring.is_active,
        notes=recurring.notes,
        start_date=recurring.start_date.isoformat(),
        end_date=recurring.end_date.isoformat() if recurring.end_date else None,
        last_generated=recurring.last_generated,
        created_at=recurring.created_at,
        updated_at=recurring.updated_at
    )


@router.delete("/{recurring_id}", status_code=204)
def delete_recurring_expense(
    recurring_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Delete a recurring expense."""
    recurring = db.query(models.RecurringExpense).filter(
        models.RecurringExpense.id == recurring_id,
        models.RecurringExpense.user_id == current_user.id
    ).first()
    
    if not recurring:
        raise HTTPException(status_code=404, detail="Recurring expense not found")
    
    db.delete(recurring)
    db.commit()
    return None


@router.post("/{recurring_id}/generate", response_model=schemas.ExpenseResponse)
def generate_expense_from_recurring(
    recurring_id: int,
    billing_month: str = Query(..., pattern=r"^\d{4}-\d{2}$", description="Billing month (YYYY-MM)"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Manually generate an expense from a recurring expense template."""
    recurring = db.query(models.RecurringExpense).filter(
        models.RecurringExpense.id == recurring_id,
        models.RecurringExpense.user_id == current_user.id
    ).first()
    
    if not recurring:
        raise HTTPException(status_code=404, detail="Recurring expense not found")
    
    # Check if expense already exists for this month
    existing = db.query(models.Expense).filter(
        models.Expense.recurring_expense_id == recurring_id,
        models.Expense.billing_month == billing_month
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail=f"Expense already generated for {billing_month}")
    
    # Create the expense
    expense = models.Expense(
        user_id=current_user.id,
        category=recurring.category,
        description=recurring.description,
        amount=recurring.amount,
        status="Unpaid",
        notes=recurring.notes,
        billing_month=billing_month,
        recurring_expense_id=recurring.id
    )
    
    db.add(expense)
    
    # Update last_generated
    recurring.last_generated = billing_month
    
    db.commit()
    db.refresh(expense)
    
    return expense
