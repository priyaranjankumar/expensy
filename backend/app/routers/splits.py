from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user

router = APIRouter(prefix="/splits", tags=["split-expenses"])


@router.post("/{expense_id}", response_model=List[schemas.SplitExpenseResponse])
def split_expense(
    expense_id: int,
    split_request: schemas.SplitRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Split an expense into multiple parts."""
    # Get the expense
    db_expense = db.query(models.Expense).filter(
        models.Expense.id == expense_id,
        models.Expense.user_id == current_user.id
    ).first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    # Check if already split
    existing_splits = db.query(models.SplitExpense).filter(
        models.SplitExpense.parent_expense_id == expense_id
    ).count()
    if existing_splits > 0:
        raise HTTPException(status_code=400, detail="Expense is already split. Delete existing splits first.")
    
    # Validate that splits sum up to original amount
    total_split_amount = sum(s.amount for s in split_request.splits)
    if abs(total_split_amount - db_expense.amount) > 0.01:
        raise HTTPException(
            status_code=400, 
            detail=f"Split amounts ({total_split_amount}) must equal original expense amount ({db_expense.amount})"
        )
    
    # Create splits
    created_splits = []
    for split in split_request.splits:
        db_split = models.SplitExpense(
            parent_expense_id=expense_id,
            **split.model_dump()
        )
        db.add(db_split)
        created_splits.append(db_split)
    
    db.commit()
    for s in created_splits:
        db.refresh(s)
    
    return created_splits


@router.get("/{expense_id}", response_model=List[schemas.SplitExpenseResponse])
def get_expense_splits(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all splits for an expense."""
    # Verify expense belongs to user
    db_expense = db.query(models.Expense).filter(
        models.Expense.id == expense_id,
        models.Expense.user_id == current_user.id
    ).first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    splits = db.query(models.SplitExpense).filter(
        models.SplitExpense.parent_expense_id == expense_id
    ).all()
    return splits


@router.delete("/{expense_id}", status_code=204)
def delete_expense_splits(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Delete all splits for an expense."""
    # Verify expense belongs to user
    db_expense = db.query(models.Expense).filter(
        models.Expense.id == expense_id,
        models.Expense.user_id == current_user.id
    ).first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    db.query(models.SplitExpense).filter(
        models.SplitExpense.parent_expense_id == expense_id
    ).delete()
    db.commit()
    return None


@router.put("/{expense_id}", response_model=List[schemas.SplitExpenseResponse])
def update_expense_splits(
    expense_id: int,
    split_request: schemas.SplitRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update splits for an expense (replaces existing splits)."""
    # Verify expense belongs to user
    db_expense = db.query(models.Expense).filter(
        models.Expense.id == expense_id,
        models.Expense.user_id == current_user.id
    ).first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    # Validate that splits sum up to original amount
    total_split_amount = sum(s.amount for s in split_request.splits)
    if abs(total_split_amount - db_expense.amount) > 0.01:
        raise HTTPException(
            status_code=400, 
            detail=f"Split amounts ({total_split_amount}) must equal original expense amount ({db_expense.amount})"
        )
    
    # Delete existing splits
    db.query(models.SplitExpense).filter(
        models.SplitExpense.parent_expense_id == expense_id
    ).delete()
    
    # Create new splits
    created_splits = []
    for split in split_request.splits:
        db_split = models.SplitExpense(
            parent_expense_id=expense_id,
            **split.model_dump()
        )
        db.add(db_split)
        created_splits.append(db_split)
    
    db.commit()
    for s in created_splits:
        db.refresh(s)
    
    return created_splits
