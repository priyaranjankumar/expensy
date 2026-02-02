"""Export endpoints for CSV and other data formats."""

import csv
import io
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from ..database import get_db
from .. import crud, models
from ..auth import get_current_user

router = APIRouter(prefix="/export", tags=["export"])


@router.get("/csv")
def export_expenses_csv(
    billing_month: Optional[str] = Query(None, description="Filter by billing month (YYYY-MM)"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Export expenses as CSV file.
    
    Returns a downloadable CSV file with all expenses for the specified month
    or all expenses if no month is specified.
    """
    # Get expenses
    expenses = crud.get_expenses(
        db, 
        user_id=current_user.id, 
        billing_month=billing_month,
        limit=10000  # Large limit for export
    )
    
    # Create CSV in memory
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write header
    writer.writerow([
        "ID", "Category", "Description", "Amount", "Status", 
        "Notes", "Billing Month", "Created At", "Updated At"
    ])
    
    # Write data rows
    for expense in expenses:
        writer.writerow([
            expense.id,
            expense.category,
            expense.description,
            expense.amount,
            expense.status,
            expense.notes or "",
            expense.billing_month,
            expense.created_at.strftime("%Y-%m-%d %H:%M:%S") if expense.created_at else "",
            expense.updated_at.strftime("%Y-%m-%d %H:%M:%S") if expense.updated_at else ""
        ])
    
    # Prepare response
    output.seek(0)
    
    # Generate filename
    if billing_month:
        filename = f"expenses_{billing_month}.csv"
    else:
        filename = f"expenses_all_{datetime.now().strftime('%Y%m%d')}.csv"
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/json")
def export_expenses_json(
    billing_month: Optional[str] = Query(None, description="Filter by billing month (YYYY-MM)"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """
    Export expenses as JSON for backup purposes.
    """
    expenses = crud.get_expenses(
        db, 
        user_id=current_user.id, 
        billing_month=billing_month,
        limit=10000
    )
    
    return {
        "exported_at": datetime.now().isoformat(),
        "user": current_user.username,
        "billing_month": billing_month or "all",
        "count": len(expenses),
        "expenses": [
            {
                "id": e.id,
                "category": e.category,
                "description": e.description,
                "amount": e.amount,
                "status": e.status,
                "notes": e.notes,
                "billing_month": e.billing_month,
                "created_at": e.created_at.isoformat() if e.created_at else None,
                "updated_at": e.updated_at.isoformat() if e.updated_at else None
            }
            for e in expenses
        ]
    }
