from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from datetime import date

from ..database import get_db
from .. import schemas, models
from ..auth import get_current_user

router = APIRouter(prefix="/income", tags=["income"])


@router.get("", response_model=List[schemas.IncomeResponse])
def get_incomes(
    billing_month: Optional[str] = Query(None, pattern=r"^\d{4}-\d{2}$", description="Filter by billing month"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all income entries for the current user."""
    query = db.query(models.Income).filter(
        models.Income.user_id == current_user.id
    )
    
    if billing_month:
        query = query.filter(models.Income.billing_month == billing_month)
    
    incomes = query.order_by(models.Income.billing_month.desc(), models.Income.created_at.desc()).all()
    
    # Convert date fields to strings
    results = []
    for income in incomes:
        result = schemas.IncomeResponse(
            id=income.id,
            source=income.source,
            description=income.description,
            amount=income.amount,
            billing_month=income.billing_month,
            received_date=income.received_date.isoformat() if income.received_date else None,
            is_recurring=income.is_recurring,
            notes=income.notes,
            created_at=income.created_at,
            updated_at=income.updated_at
        )
        results.append(result)
    
    return results


@router.get("/summary", response_model=schemas.IncomeSummary)
def get_income_summary(
    billing_month: Optional[str] = Query(None, pattern=r"^\d{4}-\d{2}$", description="Filter by billing month"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get income summary for the current user."""
    query = db.query(models.Income).filter(models.Income.user_id == current_user.id)
    
    if billing_month:
        query = query.filter(models.Income.billing_month == billing_month)
    
    # Total income
    total = query.with_entities(func.sum(models.Income.amount)).scalar() or 0.0
    count = query.count()
    
    # Group by source
    by_source_query = query.with_entities(
        models.Income.source,
        func.sum(models.Income.amount).label('total'),
        func.count(models.Income.id).label('count')
    ).group_by(models.Income.source).all()
    
    by_source = [
        {"source": source, "total": round(total, 2), "count": count}
        for source, total, count in by_source_query
    ]
    
    return schemas.IncomeSummary(
        total_income=round(total, 2),
        income_count=count,
        by_source=by_source
    )


@router.get("/{income_id}", response_model=schemas.IncomeResponse)
def get_income(
    income_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get a single income entry by ID."""
    income = db.query(models.Income).filter(
        models.Income.id == income_id,
        models.Income.user_id == current_user.id
    ).first()
    
    if not income:
        raise HTTPException(status_code=404, detail="Income not found")
    
    return schemas.IncomeResponse(
        id=income.id,
        source=income.source,
        description=income.description,
        amount=income.amount,
        billing_month=income.billing_month,
        received_date=income.received_date.isoformat() if income.received_date else None,
        is_recurring=income.is_recurring,
        notes=income.notes,
        created_at=income.created_at,
        updated_at=income.updated_at
    )


@router.post("", response_model=schemas.IncomeResponse, status_code=201)
def create_income(
    income_data: schemas.IncomeCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create a new income entry."""
    income = models.Income(
        user_id=current_user.id,
        source=income_data.source,
        description=income_data.description,
        amount=income_data.amount,
        billing_month=income_data.billing_month,
        received_date=date.fromisoformat(income_data.received_date) if income_data.received_date else None,
        is_recurring=income_data.is_recurring,
        notes=income_data.notes
    )
    
    db.add(income)
    db.commit()
    db.refresh(income)
    
    return schemas.IncomeResponse(
        id=income.id,
        source=income.source,
        description=income.description,
        amount=income.amount,
        billing_month=income.billing_month,
        received_date=income.received_date.isoformat() if income.received_date else None,
        is_recurring=income.is_recurring,
        notes=income.notes,
        created_at=income.created_at,
        updated_at=income.updated_at
    )


@router.put("/{income_id}", response_model=schemas.IncomeResponse)
def update_income(
    income_id: int,
    income_update: schemas.IncomeUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update an existing income entry."""
    income = db.query(models.Income).filter(
        models.Income.id == income_id,
        models.Income.user_id == current_user.id
    ).first()
    
    if not income:
        raise HTTPException(status_code=404, detail="Income not found")
    
    update_data = income_update.model_dump(exclude_unset=True)
    
    # Handle received_date conversion
    if "received_date" in update_data and update_data["received_date"]:
        update_data["received_date"] = date.fromisoformat(update_data["received_date"])
    
    for key, value in update_data.items():
        setattr(income, key, value)
    
    db.commit()
    db.refresh(income)
    
    return schemas.IncomeResponse(
        id=income.id,
        source=income.source,
        description=income.description,
        amount=income.amount,
        billing_month=income.billing_month,
        received_date=income.received_date.isoformat() if income.received_date else None,
        is_recurring=income.is_recurring,
        notes=income.notes,
        created_at=income.created_at,
        updated_at=income.updated_at
    )


@router.delete("/{income_id}", status_code=204)
def delete_income(
    income_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Delete an income entry."""
    income = db.query(models.Income).filter(
        models.Income.id == income_id,
        models.Income.user_id == current_user.id
    ).first()
    
    if not income:
        raise HTTPException(status_code=404, detail="Income not found")
    
    db.delete(income)
    db.commit()
    return None
