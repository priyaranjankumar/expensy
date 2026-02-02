from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from ..database import get_db
from .. import schemas, models
from ..auth import get_current_user

router = APIRouter(prefix="/budgets", tags=["budgets"])


@router.get("", response_model=List[schemas.CategoryBudgetResponse])
def get_category_budgets(
    billing_month: Optional[str] = Query(None, pattern=r"^\d{4}-\d{2}$", description="Filter by billing month"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all category budgets for the current user with spent amounts."""
    query = db.query(models.CategoryBudget).filter(
        models.CategoryBudget.user_id == current_user.id
    )
    
    if billing_month:
        # Get budgets for specific month or global budgets (no billing_month)
        query = query.filter(
            (models.CategoryBudget.billing_month == billing_month) | 
            (models.CategoryBudget.billing_month == None)
        )
    
    budgets = query.order_by(models.CategoryBudget.category).all()
    
    # Calculate spent amounts for each budget
    results = []
    for budget in budgets:
        # Get spent amount for this category
        month_filter = billing_month if billing_month else budget.billing_month
        spent_query = db.query(func.sum(models.Expense.amount)).filter(
            models.Expense.user_id == current_user.id,
            models.Expense.category == budget.category
        )
        if month_filter:
            spent_query = spent_query.filter(models.Expense.billing_month == month_filter)
        
        spent = spent_query.scalar() or 0.0
        remaining = budget.budget_amount - spent
        
        results.append(schemas.CategoryBudgetResponse(
            id=budget.id,
            category=budget.category,
            budget_amount=budget.budget_amount,
            billing_month=budget.billing_month,
            spent=round(spent, 2),
            remaining=round(remaining, 2),
            created_at=budget.created_at,
            updated_at=budget.updated_at
        ))
    
    return results


@router.get("/{budget_id}", response_model=schemas.CategoryBudgetResponse)
def get_category_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get a single category budget by ID."""
    budget = db.query(models.CategoryBudget).filter(
        models.CategoryBudget.id == budget_id,
        models.CategoryBudget.user_id == current_user.id
    ).first()
    
    if not budget:
        raise HTTPException(status_code=404, detail="Category budget not found")
    
    # Calculate spent
    spent_query = db.query(func.sum(models.Expense.amount)).filter(
        models.Expense.user_id == current_user.id,
        models.Expense.category == budget.category
    )
    if budget.billing_month:
        spent_query = spent_query.filter(models.Expense.billing_month == budget.billing_month)
    
    spent = spent_query.scalar() or 0.0
    remaining = budget.budget_amount - spent
    
    return schemas.CategoryBudgetResponse(
        id=budget.id,
        category=budget.category,
        budget_amount=budget.budget_amount,
        billing_month=budget.billing_month,
        spent=round(spent, 2),
        remaining=round(remaining, 2),
        created_at=budget.created_at,
        updated_at=budget.updated_at
    )


@router.post("", response_model=schemas.CategoryBudgetResponse, status_code=201)
def create_category_budget(
    budget_data: schemas.CategoryBudgetCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create a new category budget."""
    # Check if budget for this category already exists
    existing = db.query(models.CategoryBudget).filter(
        models.CategoryBudget.user_id == current_user.id,
        models.CategoryBudget.category == budget_data.category,
        models.CategoryBudget.billing_month == budget_data.billing_month
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Budget for this category already exists")
    
    budget = models.CategoryBudget(
        user_id=current_user.id,
        category=budget_data.category,
        budget_amount=budget_data.budget_amount,
        billing_month=budget_data.billing_month
    )
    
    db.add(budget)
    db.commit()
    db.refresh(budget)
    
    return schemas.CategoryBudgetResponse(
        id=budget.id,
        category=budget.category,
        budget_amount=budget.budget_amount,
        billing_month=budget.billing_month,
        spent=0.0,
        remaining=budget.budget_amount,
        created_at=budget.created_at,
        updated_at=budget.updated_at
    )


@router.put("/{budget_id}", response_model=schemas.CategoryBudgetResponse)
def update_category_budget(
    budget_id: int,
    budget_update: schemas.CategoryBudgetUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update an existing category budget."""
    budget = db.query(models.CategoryBudget).filter(
        models.CategoryBudget.id == budget_id,
        models.CategoryBudget.user_id == current_user.id
    ).first()
    
    if not budget:
        raise HTTPException(status_code=404, detail="Category budget not found")
    
    update_data = budget_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(budget, key, value)
    
    db.commit()
    db.refresh(budget)
    
    # Calculate spent
    spent_query = db.query(func.sum(models.Expense.amount)).filter(
        models.Expense.user_id == current_user.id,
        models.Expense.category == budget.category
    )
    if budget.billing_month:
        spent_query = spent_query.filter(models.Expense.billing_month == budget.billing_month)
    
    spent = spent_query.scalar() or 0.0
    remaining = budget.budget_amount - spent
    
    return schemas.CategoryBudgetResponse(
        id=budget.id,
        category=budget.category,
        budget_amount=budget.budget_amount,
        billing_month=budget.billing_month,
        spent=round(spent, 2),
        remaining=round(remaining, 2),
        created_at=budget.created_at,
        updated_at=budget.updated_at
    )


@router.delete("/{budget_id}", status_code=204)
def delete_category_budget(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Delete a category budget."""
    budget = db.query(models.CategoryBudget).filter(
        models.CategoryBudget.id == budget_id,
        models.CategoryBudget.user_id == current_user.id
    ).first()
    
    if not budget:
        raise HTTPException(status_code=404, detail="Category budget not found")
    
    db.delete(budget)
    db.commit()
    return None
