from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List

from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user

router = APIRouter(prefix="/groups", tags=["expense-groups"])


@router.get("", response_model=List[schemas.ExpenseGroupResponse])
def get_groups(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all expense groups for the current user."""
    groups = db.query(models.ExpenseGroup).filter(
        models.ExpenseGroup.user_id == current_user.id
    ).order_by(models.ExpenseGroup.name).all()
    
    # Add expense count and total amount for each group
    results = []
    for group in groups:
        expense_stats = db.query(
            func.count(models.Expense.id).label('count'),
            func.coalesce(func.sum(models.Expense.amount), 0).label('total')
        ).filter(
            models.Expense.group_id == group.id
        ).first()
        
        results.append(schemas.ExpenseGroupResponse(
            id=group.id,
            name=group.name,
            description=group.description,
            color=group.color,
            expense_count=expense_stats.count,
            total_amount=expense_stats.total,
            created_at=group.created_at
        ))
    
    return results


@router.post("", response_model=schemas.ExpenseGroupResponse, status_code=201)
def create_group(
    group: schemas.ExpenseGroupCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create a new expense group."""
    db_group = models.ExpenseGroup(
        user_id=current_user.id,
        **group.model_dump()
    )
    db.add(db_group)
    db.commit()
    db.refresh(db_group)
    
    return schemas.ExpenseGroupResponse(
        id=db_group.id,
        name=db_group.name,
        description=db_group.description,
        color=db_group.color,
        expense_count=0,
        total_amount=0.0,
        created_at=db_group.created_at
    )


@router.put("/{group_id}", response_model=schemas.ExpenseGroupResponse)
def update_group(
    group_id: int,
    group: schemas.ExpenseGroupUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update an expense group."""
    db_group = db.query(models.ExpenseGroup).filter(
        models.ExpenseGroup.id == group_id,
        models.ExpenseGroup.user_id == current_user.id
    ).first()
    if not db_group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    update_data = group.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_group, field, value)
    
    db.commit()
    db.refresh(db_group)
    
    # Get stats
    expense_stats = db.query(
        func.count(models.Expense.id).label('count'),
        func.coalesce(func.sum(models.Expense.amount), 0).label('total')
    ).filter(
        models.Expense.group_id == db_group.id
    ).first()
    
    return schemas.ExpenseGroupResponse(
        id=db_group.id,
        name=db_group.name,
        description=db_group.description,
        color=db_group.color,
        expense_count=expense_stats.count,
        total_amount=expense_stats.total,
        created_at=db_group.created_at
    )


@router.delete("/{group_id}", status_code=204)
def delete_group(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Delete an expense group (expenses will be unlinked, not deleted)."""
    db_group = db.query(models.ExpenseGroup).filter(
        models.ExpenseGroup.id == group_id,
        models.ExpenseGroup.user_id == current_user.id
    ).first()
    if not db_group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    # Unlink expenses from group
    db.query(models.Expense).filter(
        models.Expense.group_id == group_id
    ).update({"group_id": None})
    
    db.delete(db_group)
    db.commit()
    return None


@router.post("/{group_id}/expenses/{expense_id}", status_code=200)
def add_expense_to_group(
    group_id: int,
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Add an expense to a group."""
    db_group = db.query(models.ExpenseGroup).filter(
        models.ExpenseGroup.id == group_id,
        models.ExpenseGroup.user_id == current_user.id
    ).first()
    if not db_group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    db_expense = db.query(models.Expense).filter(
        models.Expense.id == expense_id,
        models.Expense.user_id == current_user.id
    ).first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    db_expense.group_id = group_id
    db.commit()
    return {"message": "Expense added to group"}


@router.delete("/{group_id}/expenses/{expense_id}", status_code=200)
def remove_expense_from_group(
    group_id: int,
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Remove an expense from a group."""
    db_expense = db.query(models.Expense).filter(
        models.Expense.id == expense_id,
        models.Expense.user_id == current_user.id,
        models.Expense.group_id == group_id
    ).first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Expense not in this group")
    
    db_expense.group_id = None
    db.commit()
    return {"message": "Expense removed from group"}


@router.get("/{group_id}/expenses")
def get_group_expenses(
    group_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all expenses in a group."""
    db_group = db.query(models.ExpenseGroup).filter(
        models.ExpenseGroup.id == group_id,
        models.ExpenseGroup.user_id == current_user.id
    ).first()
    if not db_group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    expenses = db.query(models.Expense).filter(
        models.Expense.group_id == group_id
    ).order_by(models.Expense.created_at.desc()).all()
    
    return {
        "group": {
            "id": db_group.id,
            "name": db_group.name,
            "color": db_group.color
        },
        "expenses": [
            {
                "id": e.id,
                "category": e.category,
                "description": e.description,
                "amount": e.amount,
                "status": e.status,
                "billing_month": e.billing_month
            }
            for e in expenses
        ],
        "total": sum(e.amount for e in expenses)
    }
