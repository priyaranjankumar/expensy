from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user

router = APIRouter(prefix="/payment-methods", tags=["payment-methods"])


@router.get("", response_model=List[schemas.PaymentMethodResponse])
def get_payment_methods(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all payment methods for the current user."""
    methods = db.query(models.PaymentMethod).filter(
        models.PaymentMethod.user_id == current_user.id,
        models.PaymentMethod.is_active == True
    ).order_by(models.PaymentMethod.is_default.desc(), models.PaymentMethod.name).all()
    return methods


@router.post("", response_model=schemas.PaymentMethodResponse, status_code=201)
def create_payment_method(
    method: schemas.PaymentMethodCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create a new payment method."""
    # If setting as default, unset others
    if method.is_default:
        db.query(models.PaymentMethod).filter(
            models.PaymentMethod.user_id == current_user.id
        ).update({"is_default": False})
    
    db_method = models.PaymentMethod(
        user_id=current_user.id,
        **method.model_dump()
    )
    db.add(db_method)
    db.commit()
    db.refresh(db_method)
    return db_method


@router.put("/{method_id}/default")
def set_default_payment_method(
    method_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Set a payment method as default."""
    db_method = db.query(models.PaymentMethod).filter(
        models.PaymentMethod.id == method_id,
        models.PaymentMethod.user_id == current_user.id
    ).first()
    if not db_method:
        raise HTTPException(status_code=404, detail="Payment method not found")
    
    # Unset all defaults
    db.query(models.PaymentMethod).filter(
        models.PaymentMethod.user_id == current_user.id
    ).update({"is_default": False})
    
    # Set new default
    db_method.is_default = True
    db.commit()
    
    return {"message": f"{db_method.name} set as default payment method"}


@router.delete("/{method_id}", status_code=204)
def delete_payment_method(
    method_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Delete a payment method (soft delete)."""
    db_method = db.query(models.PaymentMethod).filter(
        models.PaymentMethod.id == method_id,
        models.PaymentMethod.user_id == current_user.id
    ).first()
    if not db_method:
        raise HTTPException(status_code=404, detail="Payment method not found")
    
    db_method.is_active = False
    db.commit()
    return None
