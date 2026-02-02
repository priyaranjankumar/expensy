from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from .. import models, schemas
from ..auth import get_current_user

router = APIRouter(prefix="/currency", tags=["currency"])

# Common currencies with symbols
CURRENCIES = {
    "INR": {"name": "Indian Rupee", "symbol": "₹"},
    "USD": {"name": "US Dollar", "symbol": "$"},
    "EUR": {"name": "Euro", "symbol": "€"},
    "GBP": {"name": "British Pound", "symbol": "£"},
    "JPY": {"name": "Japanese Yen", "symbol": "¥"},
    "AUD": {"name": "Australian Dollar", "symbol": "A$"},
    "CAD": {"name": "Canadian Dollar", "symbol": "C$"},
    "SGD": {"name": "Singapore Dollar", "symbol": "S$"},
    "AED": {"name": "UAE Dirham", "symbol": "د.إ"},
    "CHF": {"name": "Swiss Franc", "symbol": "CHF"},
}


@router.get("/list")
def get_currencies():
    """Get list of supported currencies."""
    return [
        {"code": code, **info}
        for code, info in CURRENCIES.items()
    ]


@router.get("/rates", response_model=List[schemas.CurrencyRateResponse])
def get_currency_rates(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get user's saved currency rates."""
    rates = db.query(models.CurrencyRate).filter(
        models.CurrencyRate.user_id == current_user.id
    ).all()
    return rates


@router.post("/rates", response_model=schemas.CurrencyRateResponse, status_code=201)
def set_currency_rate(
    rate: schemas.CurrencyRateCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Set or update a currency exchange rate."""
    # Check if rate already exists
    existing = db.query(models.CurrencyRate).filter(
        models.CurrencyRate.user_id == current_user.id,
        models.CurrencyRate.from_currency == rate.from_currency,
        models.CurrencyRate.to_currency == rate.to_currency
    ).first()
    
    if existing:
        existing.rate = rate.rate
        db.commit()
        db.refresh(existing)
        return existing
    
    db_rate = models.CurrencyRate(
        user_id=current_user.id,
        **rate.model_dump()
    )
    db.add(db_rate)
    db.commit()
    db.refresh(db_rate)
    return db_rate


@router.get("/convert")
def convert_currency(
    amount: float,
    from_currency: str,
    to_currency: str,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Convert amount between currencies using saved rates."""
    if from_currency == to_currency:
        return {"original": amount, "converted": amount, "rate": 1.0}
    
    # Try direct rate
    rate = db.query(models.CurrencyRate).filter(
        models.CurrencyRate.user_id == current_user.id,
        models.CurrencyRate.from_currency == from_currency,
        models.CurrencyRate.to_currency == to_currency
    ).first()
    
    if rate:
        return {
            "original": amount,
            "converted": round(amount * rate.rate, 2),
            "rate": rate.rate,
            "from": from_currency,
            "to": to_currency
        }
    
    # Try inverse rate
    inverse_rate = db.query(models.CurrencyRate).filter(
        models.CurrencyRate.user_id == current_user.id,
        models.CurrencyRate.from_currency == to_currency,
        models.CurrencyRate.to_currency == from_currency
    ).first()
    
    if inverse_rate:
        calculated_rate = 1 / inverse_rate.rate
        return {
            "original": amount,
            "converted": round(amount * calculated_rate, 2),
            "rate": calculated_rate,
            "from": from_currency,
            "to": to_currency
        }
    
    raise HTTPException(
        status_code=404, 
        detail=f"No exchange rate found for {from_currency} to {to_currency}. Please set a rate first."
    )


@router.delete("/rates/{rate_id}", status_code=204)
def delete_currency_rate(
    rate_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Delete a currency rate."""
    rate = db.query(models.CurrencyRate).filter(
        models.CurrencyRate.id == rate_id,
        models.CurrencyRate.user_id == current_user.id
    ).first()
    if not rate:
        raise HTTPException(status_code=404, detail="Rate not found")
    
    db.delete(rate)
    db.commit()
    return None
