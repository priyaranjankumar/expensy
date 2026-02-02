from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel, Field

from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user

router = APIRouter(prefix="/templates", tags=["expense-templates"])


class ExpenseTemplateBase(BaseModel):
    """Base schema for expense templates."""
    name: str = Field(..., min_length=1, max_length=100)
    category: str = Field(..., min_length=1, max_length=100)
    description: str = Field(..., min_length=1, max_length=255)
    default_amount: Optional[float] = Field(None, ge=0)
    notes: Optional[str] = None


class ExpenseTemplateCreate(ExpenseTemplateBase):
    """Schema for creating template."""
    pass


class ExpenseTemplateResponse(ExpenseTemplateBase):
    """Schema for template response."""
    id: int
    use_count: int
    
    class Config:
        from_attributes = True


# In-memory templates storage (per user) - in production, use a database table
# For now, we'll store in the RecurringExpense table with a special flag
# Templates are just recurring expenses that are paused and have no schedule

@router.get("", response_model=List[dict])
def get_templates(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all expense templates for the current user."""
    # Templates are stored as paused recurring expenses with frequency = 'template'
    templates = db.query(models.RecurringExpense).filter(
        models.RecurringExpense.user_id == current_user.id,
        models.RecurringExpense.frequency == "template"
    ).order_by(models.RecurringExpense.description).all()
    
    return [
        {
            "id": t.id,
            "name": t.notes or t.description,
            "category": t.category,
            "description": t.description,
            "default_amount": t.amount if t.amount > 0 else None,
            "notes": t.notes,
            "use_count": 0  # Could track this in a separate field
        }
        for t in templates
    ]


@router.post("", status_code=201)
def create_template(
    template: ExpenseTemplateCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create a new expense template."""
    from datetime import date
    
    db_template = models.RecurringExpense(
        user_id=current_user.id,
        category=template.category,
        description=template.description,
        amount=template.default_amount or 0,
        frequency="template",  # Special marker
        is_active=False,
        start_date=date.today(),
        notes=template.name  # Store template name in notes
    )
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    
    return {
        "id": db_template.id,
        "name": template.name,
        "category": template.category,
        "description": template.description,
        "default_amount": template.default_amount,
        "notes": template.notes,
        "use_count": 0
    }


@router.delete("/{template_id}", status_code=204)
def delete_template(
    template_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Delete a template."""
    template = db.query(models.RecurringExpense).filter(
        models.RecurringExpense.id == template_id,
        models.RecurringExpense.user_id == current_user.id,
        models.RecurringExpense.frequency == "template"
    ).first()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    db.delete(template)
    db.commit()
    return None


@router.post("/{template_id}/use")
def use_template(
    template_id: int,
    amount: Optional[float] = None,
    billing_month: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create an expense from a template."""
    from datetime import date
    
    template = db.query(models.RecurringExpense).filter(
        models.RecurringExpense.id == template_id,
        models.RecurringExpense.user_id == current_user.id,
        models.RecurringExpense.frequency == "template"
    ).first()
    
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    
    # Use current month if not provided
    if not billing_month:
        today = date.today()
        billing_month = f"{today.year}-{today.month:02d}"
    
    # Create the expense
    expense = models.Expense(
        user_id=current_user.id,
        category=template.category,
        description=template.description,
        amount=amount if amount is not None else template.amount,
        billing_month=billing_month,
        status="Unpaid"
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    
    return {
        "message": "Expense created from template",
        "expense_id": expense.id,
        "category": expense.category,
        "description": expense.description,
        "amount": expense.amount,
        "billing_month": expense.billing_month
    }
