from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user

router = APIRouter(prefix="/accounts", tags=["accounts"])


@router.get("", response_model=List[schemas.AccountResponse])
def get_accounts(
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all accounts for the current user."""
    query = db.query(models.Account).filter(
        models.Account.user_id == current_user.id
    )
    if not include_inactive:
        query = query.filter(models.Account.is_active == True)
    
    return query.order_by(models.Account.name).all()


@router.get("/summary")
def get_accounts_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get summary of all accounts including total balance."""
    accounts = db.query(models.Account).filter(
        models.Account.user_id == current_user.id,
        models.Account.is_active == True
    ).all()
    
    by_type = {}
    total_balance = 0
    
    for acc in accounts:
        total_balance += acc.balance
        if acc.account_type not in by_type:
            by_type[acc.account_type] = {"count": 0, "balance": 0}
        by_type[acc.account_type]["count"] += 1
        by_type[acc.account_type]["balance"] += acc.balance
    
    return {
        "total_accounts": len(accounts),
        "total_balance": total_balance,
        "by_type": by_type,
        "accounts": [
            {"id": a.id, "name": a.name, "type": a.account_type, "balance": a.balance, "icon": a.icon, "color": a.color}
            for a in accounts
        ]
    }


@router.post("", response_model=schemas.AccountResponse, status_code=201)
def create_account(
    account: schemas.AccountCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create a new account."""
    db_account = models.Account(
        user_id=current_user.id,
        **account.model_dump()
    )
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account


@router.put("/{account_id}", response_model=schemas.AccountResponse)
def update_account(
    account_id: int,
    account: schemas.AccountUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update an account."""
    db_account = db.query(models.Account).filter(
        models.Account.id == account_id,
        models.Account.user_id == current_user.id
    ).first()
    if not db_account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    update_data = account.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_account, field, value)
    
    db.commit()
    db.refresh(db_account)
    return db_account


@router.delete("/{account_id}", status_code=204)
def delete_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Delete an account (soft delete by setting is_active=False)."""
    db_account = db.query(models.Account).filter(
        models.Account.id == account_id,
        models.Account.user_id == current_user.id
    ).first()
    if not db_account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    # Soft delete
    db_account.is_active = False
    db.commit()
    return None


@router.post("/{account_id}/transfer")
def transfer_between_accounts(
    account_id: int,
    to_account_id: int,
    amount: float,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Transfer money between accounts."""
    from_account = db.query(models.Account).filter(
        models.Account.id == account_id,
        models.Account.user_id == current_user.id
    ).first()
    to_account = db.query(models.Account).filter(
        models.Account.id == to_account_id,
        models.Account.user_id == current_user.id
    ).first()
    
    if not from_account or not to_account:
        raise HTTPException(status_code=404, detail="Account not found")
    
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    
    from_account.balance -= amount
    to_account.balance += amount
    db.commit()
    
    return {
        "message": f"Transferred ₹{amount} from {from_account.name} to {to_account.name}",
        "from_balance": from_account.balance,
        "to_balance": to_account.balance
    }
