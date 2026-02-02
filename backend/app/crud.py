from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from datetime import datetime
from dateutil.relativedelta import relativedelta
from . import models, schemas


def get_current_billing_month() -> str:
    """Get current month in YYYY-MM format."""
    return datetime.now().strftime("%Y-%m")


def get_monthly_trends(db: Session, user_id: int, months: int = 12) -> List[dict]:
    """Get monthly spending trends for the past N months."""
    # Generate list of past N months
    current_date = datetime.now()
    month_list = []
    for i in range(months - 1, -1, -1):
        date = current_date - relativedelta(months=i)
        month_list.append(date.strftime("%Y-%m"))
    
    # Query totals for each month
    results = []
    for month in month_list:
        # Total for the month
        total = db.query(func.sum(models.Expense.amount)).filter(
            models.Expense.user_id == user_id,
            models.Expense.billing_month == month
        ).scalar() or 0.0
        
        # Paid total
        paid = db.query(func.sum(models.Expense.amount)).filter(
            models.Expense.user_id == user_id,
            models.Expense.billing_month == month,
            models.Expense.status.in_(["Paid", "Completely Paid"])
        ).scalar() or 0.0
        
        # Unpaid total
        unpaid = db.query(func.sum(models.Expense.amount)).filter(
            models.Expense.user_id == user_id,
            models.Expense.billing_month == month,
            models.Expense.status == "Unpaid"
        ).scalar() or 0.0
        
        # Count
        count = db.query(func.count(models.Expense.id)).filter(
            models.Expense.user_id == user_id,
            models.Expense.billing_month == month
        ).scalar() or 0
        
        results.append({
            "billing_month": month,
            "total_amount": round(total, 2),
            "total_paid": round(paid, 2),
            "total_unpaid": round(unpaid, 2),
            "expense_count": count
        })
    
    return results


def get_expenses(
    db: Session,
    user_id: int,
    status: Optional[str] = None,
    category: Optional[str] = None,
    billing_month: Optional[str] = None,
    skip: int = 0,
    limit: int = 100
) -> List[models.Expense]:
    """Get all expenses for a user with optional filtering."""
    query = db.query(models.Expense).filter(models.Expense.user_id == user_id)
    
    if status:
        query = query.filter(models.Expense.status == status)
    if category:
        query = query.filter(models.Expense.category == category)
    if billing_month:
        query = query.filter(models.Expense.billing_month == billing_month)
    
    return query.order_by(models.Expense.billing_month.desc(), models.Expense.created_at.desc()).offset(skip).limit(limit).all()


def get_expense_count(
    db: Session,
    user_id: int,
    status: Optional[str] = None,
    category: Optional[str] = None,
    billing_month: Optional[str] = None
) -> int:
    """Get total count of expenses for a user with optional filtering."""
    query = db.query(func.count(models.Expense.id)).filter(models.Expense.user_id == user_id)
    
    if status:
        query = query.filter(models.Expense.status == status)
    if category:
        query = query.filter(models.Expense.category == category)
    if billing_month:
        query = query.filter(models.Expense.billing_month == billing_month)
    
    return query.scalar()


def get_expense(db: Session, expense_id: int, user_id: int) -> Optional[models.Expense]:
    """Get a single expense by ID for a specific user."""
    return db.query(models.Expense).filter(
        models.Expense.id == expense_id,
        models.Expense.user_id == user_id
    ).first()


def create_expense(db: Session, expense: schemas.ExpenseCreate, user_id: int) -> models.Expense:
    """Create a new expense for a user."""
    db_expense = models.Expense(
        user_id=user_id,
        category=expense.category,
        description=expense.description,
        amount=expense.amount,
        status=expense.status.value,
        notes=expense.notes,
        billing_month=expense.billing_month or get_current_billing_month()
    )
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return db_expense


def update_expense(
    db: Session, 
    expense_id: int, 
    user_id: int,
    expense_update: schemas.ExpenseUpdate
) -> Optional[models.Expense]:
    """Update an existing expense for a user."""
    db_expense = get_expense(db, expense_id, user_id)
    if not db_expense:
        return None
    
    update_data = expense_update.model_dump(exclude_unset=True)
    
    # Convert status enum to string if present
    if 'status' in update_data and update_data['status'] is not None:
        update_data['status'] = update_data['status'].value
    
    for field, value in update_data.items():
        setattr(db_expense, field, value)
    
    db.commit()
    db.refresh(db_expense)
    return db_expense


def delete_expense(db: Session, expense_id: int, user_id: int) -> bool:
    """Delete an expense for a user."""
    db_expense = get_expense(db, expense_id, user_id)
    if not db_expense:
        return False
    
    db.delete(db_expense)
    db.commit()
    return True


def bulk_update_status(db: Session, user_id: int, expense_ids: List[int], status: str) -> int:
    """Bulk update status for multiple expenses. Returns count of updated expenses."""
    updated = db.query(models.Expense).filter(
        models.Expense.user_id == user_id,
        models.Expense.id.in_(expense_ids)
    ).update({"status": status}, synchronize_session=False)
    db.commit()
    return updated


def bulk_delete_expenses(db: Session, user_id: int, expense_ids: List[int]) -> int:
    """Bulk delete multiple expenses. Returns count of deleted expenses."""
    deleted = db.query(models.Expense).filter(
        models.Expense.user_id == user_id,
        models.Expense.id.in_(expense_ids)
    ).delete(synchronize_session=False)
    db.commit()
    return deleted


def get_metrics(db: Session, user_id: int, budget: float, billing_month: Optional[str] = None) -> dict:
    """Get expense metrics for dashboard."""
    base_filter = models.Expense.user_id == user_id
    
    # Total amount
    total_query = db.query(func.sum(models.Expense.amount)).filter(base_filter)
    if billing_month:
        total_query = total_query.filter(models.Expense.billing_month == billing_month)
    total_amount = total_query.scalar() or 0.0
    
    # Total paid (Paid + Completely Paid)
    paid_query = db.query(func.sum(models.Expense.amount)).filter(
        base_filter,
        models.Expense.status.in_(["Paid", "Completely Paid"])
    )
    if billing_month:
        paid_query = paid_query.filter(models.Expense.billing_month == billing_month)
    total_paid = paid_query.scalar() or 0.0
    
    # Total unpaid
    unpaid_query = db.query(func.sum(models.Expense.amount)).filter(
        base_filter,
        models.Expense.status == "Unpaid"
    )
    if billing_month:
        unpaid_query = unpaid_query.filter(models.Expense.billing_month == billing_month)
    total_unpaid = unpaid_query.scalar() or 0.0
    
    # Category-wise totals
    category_query = db.query(
        models.Expense.category,
        func.sum(models.Expense.amount).label('total'),
        func.count(models.Expense.id).label('count')
    ).filter(base_filter)
    if billing_month:
        category_query = category_query.filter(models.Expense.billing_month == billing_month)
    category_data = category_query.group_by(models.Expense.category).all()
    
    category_totals = [
        {"category": cat, "total": total, "count": count}
        for cat, total, count in category_data
    ]
    
    # Total expense count
    count_query = db.query(func.count(models.Expense.id)).filter(base_filter)
    if billing_month:
        count_query = count_query.filter(models.Expense.billing_month == billing_month)
    expense_count = count_query.scalar() or 0
    
    # Remaining = budget - total_amount
    remaining = budget - total_amount
    
    return {
        "total_amount": round(total_amount, 2),
        "total_paid": round(total_paid, 2),
        "total_unpaid": round(total_unpaid, 2),
        "budget": round(budget, 2),
        "remaining": round(remaining, 2),
        "category_totals": category_totals,
        "expense_count": expense_count,
        "current_month": billing_month or get_current_billing_month()
    }


def get_categories(db: Session, user_id: int) -> List[str]:
    """Get all unique categories for a user."""
    categories = db.query(models.Expense.category).filter(
        models.Expense.user_id == user_id
    ).distinct().all()
    return [cat[0] for cat in categories]


def get_billing_months(db: Session, user_id: int) -> List[str]:
    """Get all unique billing months for a user."""
    months = db.query(models.Expense.billing_month).filter(
        models.Expense.user_id == user_id
    ).distinct().order_by(models.Expense.billing_month.desc()).all()
    return [m[0] for m in months]
