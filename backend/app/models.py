from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey, Boolean, Date, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


# Enum for recurring frequency
class RecurringFrequency:
    MONTHLY = "monthly"
    WEEKLY = "weekly"
    YEARLY = "yearly"


# Status enum for expenses
class StatusEnum:
    UNPAID = "Unpaid"
    PAID = "Paid"
    COMPLETELY_PAID = "Completely Paid"


# Association table for expense-tag many-to-many relationship
expense_tags = Table(
    'expense_tags',
    Base.metadata,
    Column('expense_id', Integer, ForeignKey('expenses.id', ondelete='CASCADE'), primary_key=True),
    Column('tag_id', Integer, ForeignKey('tags.id', ondelete='CASCADE'), primary_key=True)
)


class User(Base):
    """SQLAlchemy ORM model for users table."""
    
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    monthly_budget = Column(Float, nullable=False, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    expenses = relationship("Expense", back_populates="user", cascade="all, delete-orphan")
    recurring_expenses = relationship("RecurringExpense", back_populates="user", cascade="all, delete-orphan")
    tags = relationship("Tag", back_populates="user", cascade="all, delete-orphan")
    category_budgets = relationship("CategoryBudget", back_populates="user", cascade="all, delete-orphan")
    incomes = relationship("Income", back_populates="user", cascade="all, delete-orphan")
    payees = relationship("Payee", back_populates="user", cascade="all, delete-orphan")
    sub_categories = relationship("SubCategory", back_populates="user", cascade="all, delete-orphan")
    expense_groups = relationship("ExpenseGroup", back_populates="user", cascade="all, delete-orphan")
    accounts = relationship("Account", back_populates="user", cascade="all, delete-orphan")
    savings_goals = relationship("SavingsGoal", back_populates="user", cascade="all, delete-orphan")
    payment_methods = relationship("PaymentMethod", back_populates="user", cascade="all, delete-orphan")
    currency_rates = relationship("CurrencyRate", back_populates="user", cascade="all, delete-orphan")


class Expense(Base):
    """SQLAlchemy ORM model for expenses table."""
    
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    category = Column(String(100), nullable=False, index=True)
    description = Column(String(255), nullable=False)
    amount = Column(Float, nullable=False)
    paid_amount = Column(Float, nullable=False, default=0.0)
    status = Column(String(50), nullable=False, default="Unpaid", index=True)
    notes = Column(Text, nullable=True)
    billing_month = Column(String(7), nullable=False, index=True)  # Format: YYYY-MM
    due_date = Column(Date, nullable=True)  # Optional due date
    recurring_expense_id = Column(Integer, ForeignKey("recurring_expenses.id"), nullable=True)  # Link to recurring
    payee_id = Column(Integer, ForeignKey("payees.id"), nullable=True)  # Link to payee
    sub_category = Column(String(100), nullable=True)  # Sub-category name
    group_id = Column(Integer, ForeignKey("expense_groups.id"), nullable=True)  # Link to expense group
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=True)  # Link to account
    payment_method_id = Column(Integer, ForeignKey("payment_methods.id"), nullable=True)  # Link to payment method
    currency = Column(String(3), nullable=True, default="INR")  # Currency code
    original_amount = Column(Float, nullable=True)  # Original amount if different currency
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="expenses")
    recurring_expense = relationship("RecurringExpense", back_populates="generated_expenses")
    tags = relationship("Tag", secondary=expense_tags, back_populates="expenses")
    payee = relationship("Payee", back_populates="expenses")
    group = relationship("ExpenseGroup", back_populates="expenses")
    splits = relationship("SplitExpense", back_populates="parent_expense", cascade="all, delete-orphan")
    account = relationship("Account", back_populates="expenses")
    payment_method = relationship("PaymentMethod", back_populates="expenses")


class RecurringExpense(Base):
    """SQLAlchemy ORM model for recurring expenses (templates)."""
    
    __tablename__ = "recurring_expenses"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    category = Column(String(100), nullable=False)
    description = Column(String(255), nullable=False)
    amount = Column(Float, nullable=False)
    frequency = Column(String(20), nullable=False, default="monthly")  # monthly, weekly, yearly
    day_of_month = Column(Integer, nullable=True)  # 1-31, for monthly/yearly
    is_active = Column(Boolean, nullable=False, default=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)  # Optional end date
    last_generated = Column(String(7), nullable=True)  # YYYY-MM of last generated expense
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="recurring_expenses")
    generated_expenses = relationship("Expense", back_populates="recurring_expense")


class Tag(Base):
    """SQLAlchemy ORM model for tags/labels."""
    
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(50), nullable=False)
    color = Column(String(7), nullable=False, default="#6366f1")  # Hex color
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="tags")
    expenses = relationship("Expense", secondary=expense_tags, back_populates="tags")


class CategoryBudget(Base):
    """SQLAlchemy ORM model for per-category budgets."""
    
    __tablename__ = "category_budgets"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    category = Column(String(100), nullable=False)
    budget_amount = Column(Float, nullable=False)
    billing_month = Column(String(7), nullable=True)  # If null, applies to all months
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="category_budgets")


class Income(Base):
    """SQLAlchemy ORM model for income entries."""
    
    __tablename__ = "incomes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    source = Column(String(100), nullable=False)  # e.g., "Salary", "Freelance", "Investment"
    description = Column(String(255), nullable=True)
    amount = Column(Float, nullable=False)
    billing_month = Column(String(7), nullable=False, index=True)  # YYYY-MM
    received_date = Column(Date, nullable=True)  # Actual date received
    is_recurring = Column(Boolean, nullable=False, default=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="incomes")


class Payee(Base):
    """SQLAlchemy ORM model for payees (vendors/merchants)."""
    
    __tablename__ = "payees"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    category = Column(String(100), nullable=True)  # Default category for this payee
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="payees")
    expenses = relationship("Expense", back_populates="payee")


class SubCategory(Base):
    """SQLAlchemy ORM model for sub-categories."""
    
    __tablename__ = "sub_categories"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    parent_category = Column(String(100), nullable=False, index=True)  # Main category
    name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="sub_categories")


class SplitExpense(Base):
    """SQLAlchemy ORM model for split expense parts."""
    
    __tablename__ = "split_expenses"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    parent_expense_id = Column(Integer, ForeignKey("expenses.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String(100), nullable=False)
    sub_category = Column(String(100), nullable=True)
    description = Column(String(255), nullable=False)
    amount = Column(Float, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    parent_expense = relationship("Expense", back_populates="splits")


class ExpenseGroup(Base):
    """SQLAlchemy ORM model for grouping related expenses."""
    
    __tablename__ = "expense_groups"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    description = Column(String(255), nullable=True)
    color = Column(String(7), nullable=True, default="#6366f1")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="expense_groups")
    expenses = relationship("Expense", back_populates="group")


# ============ PHASE 6: FINANCIAL FEATURES ============

class Account(Base):
    """SQLAlchemy ORM model for financial accounts (bank, wallet, credit card)."""
    
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    account_type = Column(String(50), nullable=False)  # bank, wallet, credit_card, cash
    balance = Column(Float, nullable=False, default=0.0)
    currency = Column(String(3), nullable=False, default="INR")
    color = Column(String(7), nullable=True, default="#3b82f6")
    icon = Column(String(50), nullable=True, default="💳")
    is_active = Column(Boolean, default=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="accounts")
    expenses = relationship("Expense", back_populates="account")


class SavingsGoal(Base):
    """SQLAlchemy ORM model for savings goals."""
    
    __tablename__ = "savings_goals"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    target_amount = Column(Float, nullable=False)
    current_amount = Column(Float, nullable=False, default=0.0)
    target_date = Column(Date, nullable=True)
    color = Column(String(7), nullable=True, default="#10b981")
    icon = Column(String(50), nullable=True, default="🎯")
    is_completed = Column(Boolean, default=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="savings_goals")


class PaymentMethod(Base):
    """SQLAlchemy ORM model for payment methods."""
    
    __tablename__ = "payment_methods"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    method_type = Column(String(50), nullable=False)  # card, upi, cash, net_banking
    last_four = Column(String(4), nullable=True)  # Last 4 digits for cards
    icon = Column(String(50), nullable=True, default="💳")
    is_default = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="payment_methods")
    expenses = relationship("Expense", back_populates="payment_method")


class CurrencyRate(Base):
    """SQLAlchemy ORM model for currency exchange rates."""
    
    __tablename__ = "currency_rates"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    from_currency = Column(String(3), nullable=False)
    to_currency = Column(String(3), nullable=False)
    rate = Column(Float, nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="currency_rates")


# ============ PHASE 7: DATA & SHARING ============

class Family(Base):
    """SQLAlchemy ORM model for family/household groups."""
    
    __tablename__ = "families"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    invite_code = Column(String(20), unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    owner = relationship("User", foreign_keys=[owner_id])
    members = relationship("FamilyMember", back_populates="family", cascade="all, delete-orphan")


class FamilyMember(Base):
    """SQLAlchemy ORM model for family members."""
    
    __tablename__ = "family_members"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    family_id = Column(Integer, ForeignKey("families.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    role = Column(String(20), nullable=False, default="member")  # owner, admin, member
    can_view = Column(Boolean, default=True)
    can_edit = Column(Boolean, default=False)
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    family = relationship("Family", back_populates="members")
    user = relationship("User")


class SharedBudget(Base):
    """SQLAlchemy ORM model for shared budgets between family members."""
    
    __tablename__ = "shared_budgets"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    family_id = Column(Integer, ForeignKey("families.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    category = Column(String(100), nullable=True)
    budget_amount = Column(Float, nullable=False)
    spent_amount = Column(Float, nullable=False, default=0.0)
    billing_month = Column(String(7), nullable=False)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    family = relationship("Family")
    creator = relationship("User")


class DataExport(Base):
    """SQLAlchemy ORM model for tracking data exports."""
    
    __tablename__ = "data_exports"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    export_type = Column(String(20), nullable=False)  # pdf, csv, json
    date_range_start = Column(String(7), nullable=True)
    date_range_end = Column(String(7), nullable=True)
    file_path = Column(String(255), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User")

