from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from pydantic import BaseModel, Field
import secrets

from ..database import get_db
from .. import models
from ..auth import get_current_user

router = APIRouter(prefix="/family", tags=["family"])


# Pydantic schemas
class FamilyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)


class FamilyResponse(BaseModel):
    id: int
    name: str
    owner_id: int
    invite_code: str
    member_count: int = 0
    
    class Config:
        from_attributes = True


class FamilyMemberResponse(BaseModel):
    id: int
    user_id: int
    user_name: str
    role: str
    can_view: bool
    can_edit: bool
    
    class Config:
        from_attributes = True


class SharedBudgetCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    category: Optional[str] = None
    budget_amount: float = Field(..., gt=0)
    billing_month: str = Field(..., pattern=r"^\d{4}-\d{2}$")


class SharedBudgetResponse(BaseModel):
    id: int
    name: str
    category: Optional[str]
    budget_amount: float
    spent_amount: float
    billing_month: str
    progress_percent: float = 0.0
    created_by_name: str
    
    class Config:
        from_attributes = True


# Family endpoints
@router.get("", response_model=List[FamilyResponse])
def get_my_families(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all families the user is a member of."""
    memberships = db.query(models.FamilyMember).filter(
        models.FamilyMember.user_id == current_user.id
    ).all()
    
    result = []
    for m in memberships:
        family = m.family
        member_count = db.query(models.FamilyMember).filter(
            models.FamilyMember.family_id == family.id
        ).count()
        result.append(FamilyResponse(
            id=family.id,
            name=family.name,
            owner_id=family.owner_id,
            invite_code=family.invite_code if family.owner_id == current_user.id else "****",
            member_count=member_count
        ))
    
    return result


@router.post("", response_model=FamilyResponse, status_code=201)
def create_family(
    family: FamilyCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create a new family/household group."""
    invite_code = secrets.token_urlsafe(8)
    
    db_family = models.Family(
        name=family.name,
        owner_id=current_user.id,
        invite_code=invite_code
    )
    db.add(db_family)
    db.flush()
    
    # Add owner as first member
    member = models.FamilyMember(
        family_id=db_family.id,
        user_id=current_user.id,
        role="owner",
        can_view=True,
        can_edit=True
    )
    db.add(member)
    db.commit()
    db.refresh(db_family)
    
    return FamilyResponse(
        id=db_family.id,
        name=db_family.name,
        owner_id=db_family.owner_id,
        invite_code=db_family.invite_code,
        member_count=1
    )


@router.post("/join")
def join_family(
    invite_code: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Join a family using invite code."""
    family = db.query(models.Family).filter(
        models.Family.invite_code == invite_code
    ).first()
    
    if not family:
        raise HTTPException(status_code=404, detail="Invalid invite code")
    
    # Check if already a member
    existing = db.query(models.FamilyMember).filter(
        models.FamilyMember.family_id == family.id,
        models.FamilyMember.user_id == current_user.id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Already a member of this family")
    
    member = models.FamilyMember(
        family_id=family.id,
        user_id=current_user.id,
        role="member",
        can_view=True,
        can_edit=False
    )
    db.add(member)
    db.commit()
    
    return {"message": f"Successfully joined {family.name}"}


@router.get("/{family_id}/members", response_model=List[FamilyMemberResponse])
def get_family_members(
    family_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all members of a family."""
    # Check membership
    membership = db.query(models.FamilyMember).filter(
        models.FamilyMember.family_id == family_id,
        models.FamilyMember.user_id == current_user.id
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member of this family")
    
    members = db.query(models.FamilyMember).filter(
        models.FamilyMember.family_id == family_id
    ).all()
    
    return [
        FamilyMemberResponse(
            id=m.id,
            user_id=m.user_id,
            user_name=m.user.name,
            role=m.role,
            can_view=m.can_view,
            can_edit=m.can_edit
        )
        for m in members
    ]


@router.put("/{family_id}/members/{member_id}/permissions")
def update_member_permissions(
    family_id: int,
    member_id: int,
    can_view: bool = True,
    can_edit: bool = False,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update a member's permissions (owner/admin only)."""
    # Check if current user is owner/admin
    my_membership = db.query(models.FamilyMember).filter(
        models.FamilyMember.family_id == family_id,
        models.FamilyMember.user_id == current_user.id
    ).first()
    
    if not my_membership or my_membership.role not in ["owner", "admin"]:
        raise HTTPException(status_code=403, detail="Only owner/admin can update permissions")
    
    member = db.query(models.FamilyMember).filter(
        models.FamilyMember.id == member_id,
        models.FamilyMember.family_id == family_id
    ).first()
    
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    
    member.can_view = can_view
    member.can_edit = can_edit
    db.commit()
    
    return {"message": "Permissions updated"}


# Shared Budget endpoints
@router.get("/{family_id}/budgets", response_model=List[SharedBudgetResponse])
def get_shared_budgets(
    family_id: int,
    billing_month: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get shared budgets for a family."""
    # Check membership
    membership = db.query(models.FamilyMember).filter(
        models.FamilyMember.family_id == family_id,
        models.FamilyMember.user_id == current_user.id,
        models.FamilyMember.can_view == True
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Access denied")
    
    query = db.query(models.SharedBudget).filter(
        models.SharedBudget.family_id == family_id
    )
    
    if billing_month:
        query = query.filter(models.SharedBudget.billing_month == billing_month)
    
    budgets = query.all()
    
    return [
        SharedBudgetResponse(
            id=b.id,
            name=b.name,
            category=b.category,
            budget_amount=b.budget_amount,
            spent_amount=b.spent_amount,
            billing_month=b.billing_month,
            progress_percent=round(b.spent_amount / b.budget_amount * 100, 1) if b.budget_amount > 0 else 0,
            created_by_name=b.creator.name
        )
        for b in budgets
    ]


@router.post("/{family_id}/budgets", response_model=SharedBudgetResponse, status_code=201)
def create_shared_budget(
    family_id: int,
    budget: SharedBudgetCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create a shared budget for the family."""
    # Check membership with edit permission
    membership = db.query(models.FamilyMember).filter(
        models.FamilyMember.family_id == family_id,
        models.FamilyMember.user_id == current_user.id,
        models.FamilyMember.can_edit == True
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="No edit permission")
    
    db_budget = models.SharedBudget(
        family_id=family_id,
        name=budget.name,
        category=budget.category,
        budget_amount=budget.budget_amount,
        billing_month=budget.billing_month,
        created_by=current_user.id
    )
    db.add(db_budget)
    db.commit()
    db.refresh(db_budget)
    
    return SharedBudgetResponse(
        id=db_budget.id,
        name=db_budget.name,
        category=db_budget.category,
        budget_amount=db_budget.budget_amount,
        spent_amount=0,
        billing_month=db_budget.billing_month,
        progress_percent=0,
        created_by_name=current_user.name
    )


@router.post("/{family_id}/budgets/{budget_id}/spend")
def add_spending(
    family_id: int,
    budget_id: int,
    amount: float,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Add spending to a shared budget."""
    # Check membership
    membership = db.query(models.FamilyMember).filter(
        models.FamilyMember.family_id == family_id,
        models.FamilyMember.user_id == current_user.id
    ).first()
    
    if not membership:
        raise HTTPException(status_code=403, detail="Not a member")
    
    budget = db.query(models.SharedBudget).filter(
        models.SharedBudget.id == budget_id,
        models.SharedBudget.family_id == family_id
    ).first()
    
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    
    budget.spent_amount += amount
    db.commit()
    
    return {
        "message": f"Added ₹{amount} to {budget.name}",
        "spent_amount": budget.spent_amount,
        "budget_amount": budget.budget_amount,
        "remaining": budget.budget_amount - budget.spent_amount
    }


@router.delete("/{family_id}/leave")
def leave_family(
    family_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Leave a family (owner cannot leave)."""
    family = db.query(models.Family).filter(models.Family.id == family_id).first()
    
    if not family:
        raise HTTPException(status_code=404, detail="Family not found")
    
    if family.owner_id == current_user.id:
        raise HTTPException(status_code=400, detail="Owner cannot leave. Transfer ownership or delete the family.")
    
    membership = db.query(models.FamilyMember).filter(
        models.FamilyMember.family_id == family_id,
        models.FamilyMember.user_id == current_user.id
    ).first()
    
    if not membership:
        raise HTTPException(status_code=404, detail="Not a member")
    
    db.delete(membership)
    db.commit()
    
    return {"message": f"Left {family.name}"}
