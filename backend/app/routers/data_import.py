from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import Optional
import csv
import json
import io
from datetime import datetime

from ..database import get_db
from .. import models
from ..auth import get_current_user

router = APIRouter(prefix="/import", tags=["import"])


@router.post("/csv")
async def import_csv(
    file: UploadFile = File(...),
    billing_month: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Import expenses from CSV file.
    
    Expected CSV columns: category, description, amount, status (optional), billing_month (optional)
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    contents = await file.read()
    decoded = contents.decode('utf-8')
    reader = csv.DictReader(io.StringIO(decoded))
    
    imported = 0
    errors = []
    
    for row_num, row in enumerate(reader, start=2):
        try:
            # Normalize column names (case-insensitive)
            row = {k.lower().strip(): v.strip() for k, v in row.items() if k}
            
            category = row.get('category', '')
            description = row.get('description', '')
            amount_str = row.get('amount', '0').replace(',', '').replace('₹', '').replace('$', '')
            
            if not category or not description:
                errors.append(f"Row {row_num}: Missing category or description")
                continue
            
            try:
                amount = float(amount_str)
            except ValueError:
                errors.append(f"Row {row_num}: Invalid amount '{amount_str}'")
                continue
            
            month = row.get('billing_month', billing_month)
            if not month:
                month = datetime.now().strftime('%Y-%m')
            
            status = row.get('status', 'Unpaid')
            if status not in ['Paid', 'Unpaid', 'Pending']:
                status = 'Unpaid'
            
            expense = models.Expense(
                user_id=current_user.id,
                category=category,
                description=description,
                amount=amount,
                billing_month=month,
                status=status
            )
            db.add(expense)
            imported += 1
            
        except Exception as e:
            errors.append(f"Row {row_num}: {str(e)}")
    
    db.commit()
    
    return {
        "message": f"Successfully imported {imported} expenses",
        "imported_count": imported,
        "error_count": len(errors),
        "errors": errors[:10] if errors else []  # Return first 10 errors
    }


@router.post("/json")
async def import_json(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Import expenses from JSON file.
    
    Expected format: [{"category": "...", "description": "...", "amount": 100, ...}, ...]
    """
    if not file.filename.endswith('.json'):
        raise HTTPException(status_code=400, detail="File must be a JSON file")
    
    contents = await file.read()
    
    try:
        data = json.loads(contents.decode('utf-8'))
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON format")
    
    if not isinstance(data, list):
        raise HTTPException(status_code=400, detail="JSON must be an array of expenses")
    
    imported = 0
    errors = []
    
    for idx, item in enumerate(data):
        try:
            if not isinstance(item, dict):
                errors.append(f"Item {idx}: Not a valid object")
                continue
            
            category = item.get('category', '')
            description = item.get('description', '')
            amount = item.get('amount', 0)
            
            if not category or not description:
                errors.append(f"Item {idx}: Missing category or description")
                continue
            
            try:
                amount = float(amount)
            except (ValueError, TypeError):
                errors.append(f"Item {idx}: Invalid amount")
                continue
            
            billing_month = item.get('billing_month', datetime.now().strftime('%Y-%m'))
            status = item.get('status', 'Unpaid')
            
            expense = models.Expense(
                user_id=current_user.id,
                category=category,
                description=description,
                amount=amount,
                billing_month=billing_month,
                status=status if status in ['Paid', 'Unpaid', 'Pending'] else 'Unpaid',
                notes=item.get('notes')
            )
            db.add(expense)
            imported += 1
            
        except Exception as e:
            errors.append(f"Item {idx}: {str(e)}")
    
    db.commit()
    
    return {
        "message": f"Successfully imported {imported} expenses",
        "imported_count": imported,
        "error_count": len(errors),
        "errors": errors[:10] if errors else []
    }


@router.get("/template/csv")
def get_csv_template():
    """Get CSV template for import."""
    return {
        "template": "category,description,amount,billing_month,status\n"
                   "Groceries,Weekly shopping,2500,2025-01,Paid\n"
                   "Utilities,Electric bill,1200,2025-01,Unpaid",
        "columns": {
            "category": "Expense category (required)",
            "description": "Brief description (required)",
            "amount": "Amount in numbers (required)",
            "billing_month": "YYYY-MM format (optional, defaults to current month)",
            "status": "Paid/Unpaid/Pending (optional, defaults to Unpaid)"
        }
    }
