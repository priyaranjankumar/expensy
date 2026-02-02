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


@router.get("/trends", response_model=schemas.TrendsResponse)
def get_trends(
    months: int = Query(6, ge=1, le=24, description="Number of months to include in trends"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Get spending trends for the past N months.
    
    Returns:
    - **months**: List of monthly totals for the past N months
    - **average_monthly**: Average monthly spending
    """
    trend_data = crud.get_monthly_trends(db, user_id=current_user.id, months=months)
    
    # Calculate average (excluding months with zero spending)
    non_zero_months = [m for m in trend_data if m["total_amount"] > 0]
    average = sum(m["total_amount"] for m in non_zero_months) / len(non_zero_months) if non_zero_months else 0.0
    
    return schemas.TrendsResponse(
        months=[schemas.MonthlyTotal(**m) for m in trend_data],
        average_monthly=round(average, 2)
    )
