from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user

router = APIRouter(prefix="/subcategories", tags=["subcategories"])


@router.get("", response_model=List[schemas.SubCategoryResponse])
def get_subcategories(
    parent_category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all sub-categories, optionally filtered by parent category."""
    query = db.query(models.SubCategory).filter(
        models.SubCategory.user_id == current_user.id
    )
    if parent_category:
        query = query.filter(models.SubCategory.parent_category == parent_category)
    
    return query.order_by(models.SubCategory.parent_category, models.SubCategory.name).all()


@router.post("", response_model=schemas.SubCategoryResponse, status_code=201)
def create_subcategory(
    subcategory: schemas.SubCategoryCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create a new sub-category."""
    # Check for duplicate
    existing = db.query(models.SubCategory).filter(
        models.SubCategory.user_id == current_user.id,
        models.SubCategory.parent_category == subcategory.parent_category,
        models.SubCategory.name == subcategory.name
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Sub-category already exists for this category")
    
    db_subcategory = models.SubCategory(
        user_id=current_user.id,
        **subcategory.model_dump()
    )
    db.add(db_subcategory)
    db.commit()
    db.refresh(db_subcategory)
    return db_subcategory


@router.delete("/{subcategory_id}", status_code=204)
def delete_subcategory(
    subcategory_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Delete a sub-category."""
    db_subcategory = db.query(models.SubCategory).filter(
        models.SubCategory.id == subcategory_id,
        models.SubCategory.user_id == current_user.id
    ).first()
    if not db_subcategory:
        raise HTTPException(status_code=404, detail="Sub-category not found")
    
    db.delete(db_subcategory)
    db.commit()
    return None


@router.get("/hierarchy")
def get_category_hierarchy(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get categories with their sub-categories as a hierarchy."""
    # Get all categories from expenses
    categories = db.query(models.Expense.category).filter(
        models.Expense.user_id == current_user.id
    ).distinct().all()
    
    # Get all sub-categories
    subcategories = db.query(models.SubCategory).filter(
        models.SubCategory.user_id == current_user.id
    ).all()
    
    # Build hierarchy
    hierarchy = {}
    for (category,) in categories:
        hierarchy[category] = []
    
    for subcat in subcategories:
        if subcat.parent_category not in hierarchy:
            hierarchy[subcat.parent_category] = []
        hierarchy[subcat.parent_category].append({
            "id": subcat.id,
            "name": subcat.name,
            "description": subcat.description
        })
    
    return [
        {"category": cat, "subcategories": subs}
        for cat, subs in sorted(hierarchy.items())
    ]
