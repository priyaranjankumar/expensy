from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional

from ..database import get_db
from .. import crud, schemas, models
from ..auth import get_current_user

router = APIRouter(prefix="/metrics", tags=["metrics"])


@router.get("", response_model=schemas.MetricsResponse)
def get_metrics(
    billing_month: Optional[str] = Query(None, description="Filter metrics by billing month (YYYY-MM)"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get expense metrics for dashboard.
    
    Returns:
    - **total_amount**: Sum of all expenses
    - **total_paid**: Sum of Paid and Completely Paid expenses
    - **total_unpaid**: Sum of Unpaid expenses
    - **budget**: User's monthly budget
    - **remaining**: Budget minus total expenses
    - **category_totals**: List of totals grouped by category
    """
    return crud.get_metrics(
        db, 
        user_id=current_user.id, 
        budget=current_user.monthly_budget,
        billing_month=billing_month
    )
