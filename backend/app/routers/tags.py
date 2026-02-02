from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from .. import schemas, models
from ..auth import get_current_user

router = APIRouter(prefix="/tags", tags=["tags"])


@router.get("", response_model=List[schemas.TagResponse])
def get_tags(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all tags for the current user."""
    tags = db.query(models.Tag).filter(
        models.Tag.user_id == current_user.id
    ).order_by(models.Tag.name).all()
    return tags


@router.get("/{tag_id}", response_model=schemas.TagResponse)
def get_tag(
    tag_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get a single tag by ID."""
    tag = db.query(models.Tag).filter(
        models.Tag.id == tag_id,
        models.Tag.user_id == current_user.id
    ).first()
    
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    return tag


@router.post("", response_model=schemas.TagResponse, status_code=201)
def create_tag(
    tag_data: schemas.TagCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create a new tag."""
    # Check if tag with same name already exists
    existing = db.query(models.Tag).filter(
        models.Tag.user_id == current_user.id,
        models.Tag.name == tag_data.name
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Tag with this name already exists")
    
    tag = models.Tag(
        user_id=current_user.id,
        name=tag_data.name,
        color=tag_data.color
    )
    
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag


@router.put("/{tag_id}", response_model=schemas.TagResponse)
def update_tag(
    tag_id: int,
    tag_update: schemas.TagUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update an existing tag."""
    tag = db.query(models.Tag).filter(
        models.Tag.id == tag_id,
        models.Tag.user_id == current_user.id
    ).first()
    
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    # Check for name conflict if name is being updated
    if tag_update.name:
        existing = db.query(models.Tag).filter(
            models.Tag.user_id == current_user.id,
            models.Tag.name == tag_update.name,
            models.Tag.id != tag_id
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Tag with this name already exists")
    
    update_data = tag_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(tag, key, value)
    
    db.commit()
    db.refresh(tag)
    return tag


@router.delete("/{tag_id}", status_code=204)
def delete_tag(
    tag_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Delete a tag."""
    tag = db.query(models.Tag).filter(
        models.Tag.id == tag_id,
        models.Tag.user_id == current_user.id
    ).first()
    
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    db.delete(tag)
    db.commit()
    return None


@router.post("/{tag_id}/expenses/{expense_id}", status_code=201)
def add_tag_to_expense(
    tag_id: int,
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Add a tag to an expense."""
    tag = db.query(models.Tag).filter(
        models.Tag.id == tag_id,
        models.Tag.user_id == current_user.id
    ).first()
    
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    expense = db.query(models.Expense).filter(
        models.Expense.id == expense_id,
        models.Expense.user_id == current_user.id
    ).first()
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    if tag not in expense.tags:
        expense.tags.append(tag)
        db.commit()
    
    return {"message": f"Tag '{tag.name}' added to expense"}


@router.delete("/{tag_id}/expenses/{expense_id}", status_code=204)
def remove_tag_from_expense(
    tag_id: int,
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Remove a tag from an expense."""
    tag = db.query(models.Tag).filter(
        models.Tag.id == tag_id,
        models.Tag.user_id == current_user.id
    ).first()
    
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")
    
    expense = db.query(models.Expense).filter(
        models.Expense.id == expense_id,
        models.Expense.user_id == current_user.id
    ).first()
    
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    if tag in expense.tags:
        expense.tags.remove(tag)
        db.commit()
    
    return None
