"""Seed the database with sample user and expense data."""

from sqlalchemy.orm import Session
from .database import SessionLocal
from . import models
from .auth import get_password_hash


def seed_database():
    """Seed the database with a demo user and sample expense categories."""
    db: Session = SessionLocal()
    
    try:
        # Check if demo user exists
        existing_user = db.query(models.User).filter(models.User.username == "demo").first()
        if existing_user:
            print("Database already seeded.")
            return
        
        print("Seeding database with demo user and expense templates...")
        
        # Create demo user
        demo_user = models.User(
            username="demo",
            password_hash=get_password_hash("demo123"),
            name="Demo User",
            monthly_budget=50000.0  # ₹50,000 default budget
        )
        db.add(demo_user)
        db.commit()
        db.refresh(demo_user)
        
        # Create expense templates with zero amounts
        # User will fill in their actual amounts
        expense_templates = [
            # Utilities
            {"category": "Utilities", "description": "Fridge + Washing machine + Maid", "amount": 0, "status": "Unpaid", "billing_month": "2026-01"},
            {"category": "Utilities", "description": "Electricity Bill", "amount": 0, "status": "Unpaid", "billing_month": "2026-01"},
            
            # Subscription
            {"category": "Subscription", "description": "Apple one", "amount": 0, "status": "Unpaid", "billing_month": "2026-01"},
            
            # SIP
            {"category": "SIP", "description": "Mutual Funds", "amount": 0, "status": "Unpaid", "billing_month": "2026-01"},
            
            # Rent
            {"category": "Rent", "description": "Monthly Apartment Rent", "amount": 0, "status": "Unpaid", "billing_month": "2026-01"},
            
            # EMI
            {"category": "EMI", "description": "Washing Machine", "amount": 0, "status": "Unpaid", "billing_month": "2026-01"},
            {"category": "EMI", "description": "Loan( 61500 )", "amount": 0, "status": "Paid", "billing_month": "2026-01"},
            
            # Credit Card Bills
            {"category": "Credit Card Bill", "description": "Yes Bank Pop Card", "amount": 0, "status": "Unpaid", "billing_month": "2026-01"},
            {"category": "Credit Card Bill", "description": "Hdfc Bank Moneyback", "amount": 0, "status": "Unpaid", "billing_month": "2026-01"},
            {"category": "Credit Card Bill", "description": "Hdfc Bank Swiggy", "amount": 0, "status": "Completely Paid", "billing_month": "2026-01"},
            {"category": "Credit Card Bill", "description": "Axis Bank Flipkart", "amount": 0, "status": "Unpaid", "billing_month": "2026-01"},
            {"category": "Credit Card Bill", "description": "Federal Bank Scapia Visa", "amount": 0, "status": "Unpaid", "billing_month": "2026-01"},
            {"category": "Credit Card Bill", "description": "Idfc First Bank Millennia", "amount": 0, "status": "Paid", "billing_month": "2026-01"},
            {"category": "Credit Card Bill", "description": "Icici Bank Amazon pay", "amount": 0, "status": "Unpaid", "billing_month": "2026-01"},
            {"category": "Credit Card Bill", "description": "Standard Charted Rewards", "amount": 0, "status": "Completely Paid", "billing_month": "2026-01"},
            {"category": "Credit Card Bill", "description": "Axis Bank My Zone", "amount": 0, "status": "Completely Paid", "billing_month": "2026-01"},
            {"category": "Credit Card Bill", "description": "Hsbc Bank Platinum", "amount": 0, "status": "Completely Paid", "billing_month": "2026-01"},
            {"category": "Credit Card Bill", "description": "Induslnd Bank Legend", "amount": 0, "status": "Completely Paid", "billing_month": "2026-01"},
            {"category": "Credit Card Bill", "description": "Federal Bank Singet Platinum", "amount": 0, "status": "Completely Paid", "billing_month": "2026-01"},
            {"category": "Credit Card Bill", "description": "Federal Bank Scapia Rupay", "amount": 0, "status": "Completely Paid", "billing_month": "2026-01"},
        ]
        
        for data in expense_templates:
            expense = models.Expense(
                user_id=demo_user.id,
                **data
            )
            db.add(expense)
        
        db.commit()
        print(f"Created demo user (demo/demo123) with {len(expense_templates)} expense templates.")
        
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()
