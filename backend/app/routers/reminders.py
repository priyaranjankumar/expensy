from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date, timedelta

from ..database import get_db
from .. import schemas, models
from ..auth import get_current_user

router = APIRouter(prefix="/reminders", tags=["reminders"])


@router.get("", response_model=schemas.RemindersResponse)
def get_reminders(
    days_ahead: int = Query(7, ge=1, le=30, description="Number of days to look ahead"),
    billing_month: Optional[str] = Query(None, pattern=r"^\d{4}-\d{2}$", description="Filter by billing month"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get expense reminders - upcoming due dates and overdue expenses."""
    today = date.today()
    future_date = today + timedelta(days=days_ahead)
    
    # Base query for unpaid expenses with due dates
    query = db.query(models.Expense).filter(
        models.Expense.user_id == current_user.id,
        models.Expense.due_date.isnot(None),
        models.Expense.status.in_(["Unpaid", "Paid"])  # Not "Completely Paid"
    )
    
    if billing_month:
        query = query.filter(models.Expense.billing_month == billing_month)
    
    expenses_with_due_dates = query.all()
    
    upcoming = []
    overdue = []
    total_overdue_amount = 0.0
    
    for expense in expenses_with_due_dates:
        due_date = expense.due_date
        days_until_due = (due_date - today).days
        is_overdue = days_until_due < 0
        
        reminder = schemas.ExpenseReminder(
            expense_id=expense.id,
            category=expense.category,
            description=expense.description,
            amount=expense.amount,
            due_date=due_date.isoformat(),
            days_until_due=days_until_due,
            is_overdue=is_overdue,
            status=expense.status
        )
        
        if is_overdue:
            overdue.append(reminder)
            total_overdue_amount += expense.amount
        elif days_until_due <= days_ahead:
            upcoming.append(reminder)
    
    # Sort by due date
    upcoming.sort(key=lambda x: x.days_until_due)
    overdue.sort(key=lambda x: x.days_until_due)  # Most overdue first (most negative)
    
    return schemas.RemindersResponse(
        upcoming=upcoming,
        overdue=overdue,
        total_overdue_amount=round(total_overdue_amount, 2)
    )


@router.get("/count")
def get_reminder_count(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get quick count of overdue and upcoming reminders."""
    today = date.today()
    week_ahead = today + timedelta(days=7)
    
    # Overdue count
    overdue_count = db.query(models.Expense).filter(
        models.Expense.user_id == current_user.id,
        models.Expense.due_date.isnot(None),
        models.Expense.due_date < today,
        models.Expense.status.in_(["Unpaid", "Paid"])
    ).count()
    
    # Upcoming week count
    upcoming_count = db.query(models.Expense).filter(
        models.Expense.user_id == current_user.id,
        models.Expense.due_date.isnot(None),
        models.Expense.due_date >= today,
        models.Expense.due_date <= week_ahead,
        models.Expense.status.in_(["Unpaid", "Paid"])
    ).count()
    
    return {
        "overdue_count": overdue_count,
        "upcoming_count": upcoming_count,
        "total_pending": overdue_count + upcoming_count
    }
