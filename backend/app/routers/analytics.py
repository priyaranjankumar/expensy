from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from typing import Optional, List
from datetime import date, timedelta
from dateutil.relativedelta import relativedelta
from statistics import mean, stdev

from ..database import get_db
from .. import models
from ..auth import get_current_user

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/month-comparison")
def get_month_comparison(
    months: int = Query(6, ge=2, le=24, description="Number of months to compare"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get month-over-month spending comparison with growth rates."""
    today = date.today()
    results = []
    
    for i in range(months - 1, -1, -1):
        month_date = today - relativedelta(months=i)
        billing_month = month_date.strftime("%Y-%m")
        
        # Get total spending for this month
        total = db.query(func.sum(models.Expense.amount)).filter(
            models.Expense.user_id == current_user.id,
            models.Expense.billing_month == billing_month
        ).scalar() or 0.0
        
        # Get category breakdown
        category_breakdown = db.query(
            models.Expense.category,
            func.sum(models.Expense.amount).label('amount')
        ).filter(
            models.Expense.user_id == current_user.id,
            models.Expense.billing_month == billing_month
        ).group_by(models.Expense.category).all()
        
        # Get expense count
        count = db.query(models.Expense).filter(
            models.Expense.user_id == current_user.id,
            models.Expense.billing_month == billing_month
        ).count()
        
        results.append({
            "billing_month": billing_month,
            "total": round(total, 2),
            "expense_count": count,
            "category_breakdown": [
                {"category": cat, "amount": round(amt, 2)} 
                for cat, amt in category_breakdown
            ]
        })
    
    # Calculate month-over-month changes
    for i in range(1, len(results)):
        prev_total = results[i-1]["total"]
        curr_total = results[i]["total"]
        if prev_total > 0:
            change = ((curr_total - prev_total) / prev_total) * 100
            results[i]["mom_change_percent"] = round(change, 1)
        else:
            results[i]["mom_change_percent"] = None
    
    return {
        "months": results,
        "average_monthly": round(mean([r["total"] for r in results]), 2) if results else 0,
        "highest_month": max(results, key=lambda x: x["total"]) if results else None,
        "lowest_month": min(results, key=lambda x: x["total"]) if results else None
    }


@router.get("/forecast")
def get_spending_forecast(
    forecast_months: int = Query(3, ge=1, le=6, description="Months to forecast"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Predict future spending based on historical patterns."""
    today = date.today()
    
    # Get last 6 months of data for forecasting
    historical_data = []
    for i in range(6, 0, -1):
        month_date = today - relativedelta(months=i)
        billing_month = month_date.strftime("%Y-%m")
        
        total = db.query(func.sum(models.Expense.amount)).filter(
            models.Expense.user_id == current_user.id,
            models.Expense.billing_month == billing_month
        ).scalar() or 0.0
        
        historical_data.append({
            "billing_month": billing_month,
            "total": round(total, 2)
        })
    
    # Calculate spending velocity (daily burn rate) - ALWAYS CALCULATE THIS
    current_month = today.strftime("%Y-%m")
    current_month_spending = db.query(func.sum(models.Expense.amount)).filter(
        models.Expense.user_id == current_user.id,
        models.Expense.billing_month == current_month
    ).scalar() or 0.0
    
    days_elapsed = today.day
    daily_rate = current_month_spending / days_elapsed if days_elapsed > 0 else 0
    days_in_month = (today.replace(day=1) + relativedelta(months=1) - timedelta(days=1)).day
    projected_month_total = daily_rate * days_in_month
    
    velocity_data = {
        "daily_rate": round(daily_rate, 2),
        "days_elapsed": days_elapsed,
        "days_remaining": days_in_month - days_elapsed,
        "current_spending": round(current_month_spending, 2),
        "projected_total": round(projected_month_total, 2)
    }

    # Simple linear trend forecast
    totals = [d["total"] for d in historical_data if d["total"] > 0]
    
    if len(totals) < 2:
        return {
            "message": "Insufficient data for forecasting",
            "historical": historical_data,
            "forecast": [],
            "average_monthly": 0,
            "trend_direction": "stable",
            "monthly_trend_amount": 0,
            "current_month_velocity": velocity_data
        }
    
    avg = mean(totals)
    
    # Calculate trend (simple slope)
    if len(totals) >= 3:
        recent_avg = mean(totals[-3:])
        older_avg = mean(totals[:3]) if len(totals) >= 3 else totals[0]
        trend = (recent_avg - older_avg) / 3
    else:
        trend = 0
    
    # Generate forecasts
    forecasts = []
    for i in range(1, forecast_months + 1):
        month_date = today + relativedelta(months=i)
        billing_month = month_date.strftime("%Y-%m")
        predicted = max(0, avg + (trend * i))  # Don't predict negative
        
        forecasts.append({
            "billing_month": billing_month,
            "predicted_total": round(predicted, 2),
            "confidence": "medium" if len(totals) >= 4 else "low"
        })
    
    return {
        "historical": historical_data,
        "forecast": forecasts,
        "average_monthly": round(avg, 2),
        "trend_direction": "increasing" if trend > 50 else "decreasing" if trend < -50 else "stable",
        "monthly_trend_amount": round(trend, 2),
        "current_month_velocity": velocity_data
    }


@router.get("/anomalies")
def detect_anomalies(
    sensitivity: float = Query(1.5, ge=1.0, le=3.0, description="Standard deviation threshold"),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Detect unusual spending patterns and outliers."""
    today = date.today()
    current_month = today.strftime("%Y-%m")
    
    # Get historical average per category (last 6 months)
    anomalies = []
    
    # Get all categories with spending history
    categories = db.query(models.Expense.category).filter(
        models.Expense.user_id == current_user.id
    ).distinct().all()
    
    for (category,) in categories:
        # Get monthly totals for this category
        monthly_totals = []
        for i in range(6, 0, -1):
            month_date = today - relativedelta(months=i)
            billing_month = month_date.strftime("%Y-%m")
            
            total = db.query(func.sum(models.Expense.amount)).filter(
                models.Expense.user_id == current_user.id,
                models.Expense.billing_month == billing_month,
                models.Expense.category == category
            ).scalar() or 0.0
            
            if total > 0:
                monthly_totals.append(total)
        
        if len(monthly_totals) < 3:
            continue
        
        # Get current month total
        current_total = db.query(func.sum(models.Expense.amount)).filter(
            models.Expense.user_id == current_user.id,
            models.Expense.billing_month == current_month,
            models.Expense.category == category
        ).scalar() or 0.0
        
        avg = mean(monthly_totals)
        std = stdev(monthly_totals) if len(monthly_totals) > 1 else 0
        
        # Check for anomaly
        if std > 0:
            z_score = (current_total - avg) / std
            if abs(z_score) > sensitivity:
                anomalies.append({
                    "category": category,
                    "current_month_spending": round(current_total, 2),
                    "historical_average": round(avg, 2),
                    "deviation_percent": round(((current_total - avg) / avg) * 100, 1) if avg > 0 else 0,
                    "type": "high" if z_score > 0 else "low",
                    "severity": "critical" if abs(z_score) > 2.5 else "warning" if abs(z_score) > 2 else "notice"
                })
    
    # Check for unusual individual expenses (top outliers)
    expense_outliers = []
    current_month_expenses = db.query(models.Expense).filter(
        models.Expense.user_id == current_user.id,
        models.Expense.billing_month == current_month
    ).all()
    
    if current_month_expenses:
        amounts = [e.amount for e in current_month_expenses]
        if len(amounts) > 5:
            avg_expense = mean(amounts)
            std_expense = stdev(amounts)
            if std_expense > 0:
                for expense in current_month_expenses:
                    z = (expense.amount - avg_expense) / std_expense
                    if z > sensitivity:
                        expense_outliers.append({
                            "expense_id": expense.id,
                            "category": expense.category,
                            "description": expense.description,
                            "amount": expense.amount,
                            "deviation_from_avg": round(((expense.amount - avg_expense) / avg_expense) * 100, 1)
                        })
    
    # Sort outliers by deviation
    expense_outliers.sort(key=lambda x: x["deviation_from_avg"], reverse=True)
    
    return {
        "billing_month": current_month,
        "category_anomalies": anomalies,
        "expense_outliers": expense_outliers[:5],  # Top 5 outliers
        "total_anomalies": len(anomalies),
        "summary": {
            "has_high_spending_categories": any(a["type"] == "high" for a in anomalies),
            "has_unusual_expenses": len(expense_outliers) > 0
        }
    }


@router.get("/category-trends")
def get_category_trends(
    category: str = Query(..., description="Category to analyze"),
    months: int = Query(12, ge=3, le=24),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get detailed spending trends for a specific category."""
    today = date.today()
    results = []
    
    for i in range(months - 1, -1, -1):
        month_date = today - relativedelta(months=i)
        billing_month = month_date.strftime("%Y-%m")
        
        total = db.query(func.sum(models.Expense.amount)).filter(
            models.Expense.user_id == current_user.id,
            models.Expense.billing_month == billing_month,
            models.Expense.category == category
        ).scalar() or 0.0
        
        count = db.query(models.Expense).filter(
            models.Expense.user_id == current_user.id,
            models.Expense.billing_month == billing_month,
            models.Expense.category == category
        ).count()
        
        results.append({
            "billing_month": billing_month,
            "total": round(total, 2),
            "expense_count": count,
            "average_expense": round(total / count, 2) if count > 0 else 0
        })
    
    totals = [r["total"] for r in results if r["total"] > 0]
    
    return {
        "category": category,
        "months": results,
        "statistics": {
            "average_monthly": round(mean(totals), 2) if totals else 0,
            "highest_month": max(results, key=lambda x: x["total"]) if results else None,
            "lowest_month": min(results, key=lambda x: x["total"]) if results else None,
            "total_all_time": round(sum(totals), 2)
        }
    }
