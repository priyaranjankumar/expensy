from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from datetime import date

from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user

router = APIRouter(prefix="/savings", tags=["savings-goals"])


@router.get("", response_model=List[schemas.SavingsGoalResponse])
def get_savings_goals(
    include_completed: bool = False,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all savings goals for the current user."""
    query = db.query(models.SavingsGoal).filter(
        models.SavingsGoal.user_id == current_user.id
    )
    if not include_completed:
        query = query.filter(models.SavingsGoal.is_completed == False)
    
    goals = query.order_by(models.SavingsGoal.target_date.asc().nulls_last()).all()
    
    # Add progress percentage
    result = []
    for goal in goals:
        progress = (goal.current_amount / goal.target_amount * 100) if goal.target_amount > 0 else 0
        result.append(schemas.SavingsGoalResponse(
            id=goal.id,
            name=goal.name,
            target_amount=goal.target_amount,
            current_amount=goal.current_amount,
            target_date=goal.target_date.isoformat() if goal.target_date else None,
            color=goal.color,
            icon=goal.icon,
            is_completed=goal.is_completed,
            progress_percent=round(progress, 1),
            notes=goal.notes,
            created_at=goal.created_at,
            updated_at=goal.updated_at
        ))
    
    return result


@router.get("/summary")
def get_savings_summary(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get summary of all savings goals."""
    goals = db.query(models.SavingsGoal).filter(
        models.SavingsGoal.user_id == current_user.id,
        models.SavingsGoal.is_completed == False
    ).all()
    
    total_target = sum(g.target_amount for g in goals)
    total_saved = sum(g.current_amount for g in goals)
    remaining = total_target - total_saved
    
    return {
        "active_goals": len(goals),
        "total_target": total_target,
        "total_saved": total_saved,
        "remaining": remaining,
        "overall_progress": round((total_saved / total_target * 100) if total_target > 0 else 0, 1)
    }


@router.post("", response_model=schemas.SavingsGoalResponse, status_code=201)
def create_savings_goal(
    goal: schemas.SavingsGoalCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create a new savings goal."""
    goal_data = goal.model_dump()
    if goal_data.get('target_date'):
        goal_data['target_date'] = date.fromisoformat(goal_data['target_date'])
    
    db_goal = models.SavingsGoal(
        user_id=current_user.id,
        **goal_data
    )
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    
    progress = (db_goal.current_amount / db_goal.target_amount * 100) if db_goal.target_amount > 0 else 0
    return schemas.SavingsGoalResponse(
        id=db_goal.id,
        name=db_goal.name,
        target_amount=db_goal.target_amount,
        current_amount=db_goal.current_amount,
        target_date=db_goal.target_date.isoformat() if db_goal.target_date else None,
        color=db_goal.color,
        icon=db_goal.icon,
        is_completed=db_goal.is_completed,
        progress_percent=round(progress, 1),
        notes=db_goal.notes,
        created_at=db_goal.created_at,
        updated_at=db_goal.updated_at
    )


@router.put("/{goal_id}", response_model=schemas.SavingsGoalResponse)
def update_savings_goal(
    goal_id: int,
    goal: schemas.SavingsGoalUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update a savings goal."""
    db_goal = db.query(models.SavingsGoal).filter(
        models.SavingsGoal.id == goal_id,
        models.SavingsGoal.user_id == current_user.id
    ).first()
    if not db_goal:
        raise HTTPException(status_code=404, detail="Savings goal not found")
    
    update_data = goal.model_dump(exclude_unset=True)
    if 'target_date' in update_data and update_data['target_date']:
        update_data['target_date'] = date.fromisoformat(update_data['target_date'])
    
    for field, value in update_data.items():
        setattr(db_goal, field, value)
    
    # Auto-complete if target reached
    if db_goal.current_amount >= db_goal.target_amount:
        db_goal.is_completed = True
    
    db.commit()
    db.refresh(db_goal)
    
    progress = (db_goal.current_amount / db_goal.target_amount * 100) if db_goal.target_amount > 0 else 0
    return schemas.SavingsGoalResponse(
        id=db_goal.id,
        name=db_goal.name,
        target_amount=db_goal.target_amount,
        current_amount=db_goal.current_amount,
        target_date=db_goal.target_date.isoformat() if db_goal.target_date else None,
        color=db_goal.color,
        icon=db_goal.icon,
        is_completed=db_goal.is_completed,
        progress_percent=round(progress, 1),
        notes=db_goal.notes,
        created_at=db_goal.created_at,
        updated_at=db_goal.updated_at
    )


@router.post("/{goal_id}/contribute")
def contribute_to_goal(
    goal_id: int,
    amount: float,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Add a contribution to a savings goal."""
    db_goal = db.query(models.SavingsGoal).filter(
        models.SavingsGoal.id == goal_id,
        models.SavingsGoal.user_id == current_user.id
    ).first()
    if not db_goal:
        raise HTTPException(status_code=404, detail="Savings goal not found")
    
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be positive")
    
    db_goal.current_amount += amount
    
    # Auto-complete if target reached
    if db_goal.current_amount >= db_goal.target_amount:
        db_goal.is_completed = True
    
    db.commit()
    
    progress = (db_goal.current_amount / db_goal.target_amount * 100) if db_goal.target_amount > 0 else 0
    
    return {
        "message": f"Added ₹{amount} to {db_goal.name}",
        "current_amount": db_goal.current_amount,
        "target_amount": db_goal.target_amount,
        "progress_percent": round(progress, 1),
        "is_completed": db_goal.is_completed
    }


@router.delete("/{goal_id}", status_code=204)
def delete_savings_goal(
    goal_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Delete a savings goal."""
    db_goal = db.query(models.SavingsGoal).filter(
        models.SavingsGoal.id == goal_id,
        models.SavingsGoal.user_id == current_user.id
    ).first()
    if not db_goal:
        raise HTTPException(status_code=404, detail="Savings goal not found")
    
    db.delete(db_goal)
    db.commit()
    return None
