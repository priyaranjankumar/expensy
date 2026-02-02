from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from ..database import get_db
from .. import models
from ..auth import get_current_user

router = APIRouter(prefix="/batch", tags=["batch-operations"])


class BatchIds(BaseModel):
    """Schema for batch operations with expense IDs."""
    ids: List[int]


class BatchStatusUpdate(BaseModel):
    """Schema for batch status update."""
    ids: List[int]
    status: str


class BatchCategoryUpdate(BaseModel):
    """Schema for batch category update."""
    ids: List[int]
    category: str


class BatchGroupUpdate(BaseModel):
    """Schema for batch group assignment."""
    ids: List[int]
    group_id: int


@router.post("/mark-paid")
def batch_mark_paid(
    data: BatchIds,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Mark multiple expenses as paid."""
    updated = db.query(models.Expense).filter(
        models.Expense.id.in_(data.ids),
        models.Expense.user_id == current_user.id
    ).update({"status": "Paid"}, synchronize_session=False)
    db.commit()
    
    return {"message": f"{updated} expenses marked as paid", "updated_count": updated}


@router.post("/mark-unpaid")
def batch_mark_unpaid(
    data: BatchIds,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Mark multiple expenses as unpaid."""
    updated = db.query(models.Expense).filter(
        models.Expense.id.in_(data.ids),
        models.Expense.user_id == current_user.id
    ).update({"status": "Unpaid"}, synchronize_session=False)
    db.commit()
    
    return {"message": f"{updated} expenses marked as unpaid", "updated_count": updated}


@router.post("/delete")
def batch_delete(
    data: BatchIds,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Delete multiple expenses."""
    deleted = db.query(models.Expense).filter(
        models.Expense.id.in_(data.ids),
        models.Expense.user_id == current_user.id
    ).delete(synchronize_session=False)
    db.commit()
    
    return {"message": f"{deleted} expenses deleted", "deleted_count": deleted}


@router.post("/update-status")
def batch_update_status(
    data: BatchStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update status for multiple expenses."""
    if data.status not in ["Paid", "Unpaid", "Completely Paid"]:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    updated = db.query(models.Expense).filter(
        models.Expense.id.in_(data.ids),
        models.Expense.user_id == current_user.id
    ).update({"status": data.status}, synchronize_session=False)
    db.commit()
    
    return {"message": f"{updated} expenses updated", "updated_count": updated}


@router.post("/update-category")
def batch_update_category(
    data: BatchCategoryUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update category for multiple expenses."""
    updated = db.query(models.Expense).filter(
        models.Expense.id.in_(data.ids),
        models.Expense.user_id == current_user.id
    ).update({"category": data.category}, synchronize_session=False)
    db.commit()
    
    return {"message": f"{updated} expenses moved to {data.category}", "updated_count": updated}


@router.post("/assign-group")
def batch_assign_group(
    data: BatchGroupUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Assign multiple expenses to a group."""
    # Verify group belongs to user
    group = db.query(models.ExpenseGroup).filter(
        models.ExpenseGroup.id == data.group_id,
        models.ExpenseGroup.user_id == current_user.id
    ).first()
    
    if not group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    updated = db.query(models.Expense).filter(
        models.Expense.id.in_(data.ids),
        models.Expense.user_id == current_user.id
    ).update({"group_id": data.group_id}, synchronize_session=False)
    db.commit()
    
    return {"message": f"{updated} expenses added to group '{group.name}'", "updated_count": updated}


@router.post("/remove-from-group")
def batch_remove_from_group(
    data: BatchIds,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Remove multiple expenses from their groups."""
    updated = db.query(models.Expense).filter(
        models.Expense.id.in_(data.ids),
        models.Expense.user_id == current_user.id
    ).update({"group_id": None}, synchronize_session=False)
    db.commit()
    
    return {"message": f"{updated} expenses removed from groups", "updated_count": updated}


@router.post("/duplicate")
def batch_duplicate(
    data: BatchIds,
    billing_month: str = Query(..., pattern=r"^\d{4}-\d{2}$"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Duplicate expenses to a different billing month."""
    expenses = db.query(models.Expense).filter(
        models.Expense.id.in_(data.ids),
        models.Expense.user_id == current_user.id
    ).all()
    
    created = []
    for exp in expenses:
        new_expense = models.Expense(
            user_id=current_user.id,
            category=exp.category,
            description=exp.description,
            amount=exp.amount,
            billing_month=billing_month,
            status="Unpaid",
            notes=exp.notes,
            sub_category=exp.sub_category,
            payee_id=exp.payee_id
        )
        db.add(new_expense)
        created.append(new_expense)
    
    db.commit()
    
    return {
        "message": f"{len(created)} expenses duplicated to {billing_month}",
        "created_count": len(created)
    }
