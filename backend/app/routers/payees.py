from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user

router = APIRouter(prefix="/payees", tags=["payees"])


@router.get("", response_model=List[schemas.PayeeResponse])
def get_payees(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all payees for the current user."""
    payees = db.query(models.Payee).filter(
        models.Payee.user_id == current_user.id
    ).order_by(models.Payee.name).all()
    return payees


@router.post("", response_model=schemas.PayeeResponse, status_code=201)
def create_payee(
    payee: schemas.PayeeCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create a new payee."""
    # Check for duplicate name
    existing = db.query(models.Payee).filter(
        models.Payee.user_id == current_user.id,
        models.Payee.name == payee.name
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Payee with this name already exists")
    
    db_payee = models.Payee(
        user_id=current_user.id,
        **payee.model_dump()
    )
    db.add(db_payee)
    db.commit()
    db.refresh(db_payee)
    return db_payee


@router.put("/{payee_id}", response_model=schemas.PayeeResponse)
def update_payee(
    payee_id: int,
    payee: schemas.PayeeUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update a payee."""
    db_payee = db.query(models.Payee).filter(
        models.Payee.id == payee_id,
        models.Payee.user_id == current_user.id
    ).first()
    if not db_payee:
        raise HTTPException(status_code=404, detail="Payee not found")
    
    update_data = payee.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_payee, field, value)
    
    db.commit()
    db.refresh(db_payee)
    return db_payee


@router.delete("/{payee_id}", status_code=204)
def delete_payee(
    payee_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Delete a payee."""
    db_payee = db.query(models.Payee).filter(
        models.Payee.id == payee_id,
        models.Payee.user_id == current_user.id
    ).first()
    if not db_payee:
        raise HTTPException(status_code=404, detail="Payee not found")
    
    db.delete(db_payee)
    db.commit()
    return None
