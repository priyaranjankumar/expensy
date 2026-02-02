from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List

from ..database import get_db
from .. import crud, schemas, models
from ..auth import get_current_user

router = APIRouter(prefix="/expenses", tags=["expenses"])


@router.get("", response_model=schemas.ExpenseListResponse)
def get_expenses(
    status: Optional[str] = Query(None, description="Filter by status"),
    category: Optional[str] = Query(None, description="Filter by category"),
    billing_month: Optional[str] = Query(None, description="Filter by billing month (YYYY-MM)"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=500, description="Number of records to return"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all expenses with optional filtering."""
    expenses = crud.get_expenses(db, user_id=current_user.id, status=status, category=category, billing_month=billing_month, skip=skip, limit=limit)
    total = crud.get_expense_count(db, user_id=current_user.id, status=status, category=category, billing_month=billing_month)
    return {"expenses": expenses, "total": total}


@router.get("/categories", response_model=List[str])
def get_categories(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all unique expense categories."""
    return crud.get_categories(db, user_id=current_user.id)


@router.get("/months", response_model=List[str])
def get_billing_months(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all unique billing months."""
    return crud.get_billing_months(db, user_id=current_user.id)


@router.get("/{expense_id}", response_model=schemas.ExpenseResponse)
def get_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get a single expense by ID."""
    expense = crud.get_expense(db, expense_id, user_id=current_user.id)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense


@router.post("", response_model=schemas.ExpenseResponse, status_code=201)
def create_expense(
    expense: schemas.ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create a new expense."""
    return crud.create_expense(db, expense, user_id=current_user.id)


@router.put("/{expense_id}", response_model=schemas.ExpenseResponse)
def update_expense(
    expense_id: int,
    expense_update: schemas.ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update an existing expense."""
    expense = crud.update_expense(db, expense_id, user_id=current_user.id, expense_update=expense_update)
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    return expense


@router.delete("/{expense_id}", status_code=204)
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Delete an expense."""
    success = crud.delete_expense(db, expense_id, user_id=current_user.id)
    if not success:
        raise HTTPException(status_code=404, detail="Expense not found")
    return None


@router.put("/bulk/status")
def bulk_update_status(
    bulk_update: schemas.BulkStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Bulk update status for multiple expenses."""
    updated_count = crud.bulk_update_status(
        db, 
        user_id=current_user.id, 
        expense_ids=bulk_update.expense_ids,
        status=bulk_update.status.value
    )
    return {"updated_count": updated_count, "message": f"Successfully updated {updated_count} expenses"}


@router.delete("/bulk")
def bulk_delete_expenses(
    bulk_delete: schemas.BulkDelete,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Bulk delete multiple expenses."""
    deleted_count = crud.bulk_delete_expenses(
        db, 
        user_id=current_user.id, 
        expense_ids=bulk_delete.expense_ids
    )
    return {"deleted_count": deleted_count, "message": f"Successfully deleted {deleted_count} expenses"}

