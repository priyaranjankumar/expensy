from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class StatusEnum(str, Enum):
    UNPAID = "Unpaid"
    PAID = "Paid"
    COMPLETELY_PAID = "Completely Paid"


def get_current_billing_month() -> str:
    """Get current month in YYYY-MM format."""
    return datetime.now().strftime("%Y-%m")


# ============ USER SCHEMAS ============

class UserCreate(BaseModel):
    """Schema for creating a new user."""
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=4)
    name: str = Field(..., min_length=1, max_length=100)
    monthly_budget: float = Field(default=0.0, ge=0)


class UserLogin(BaseModel):
    """Schema for user login."""
    username: str
    password: str


class UserUpdate(BaseModel):
    """Schema for updating user profile."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    monthly_budget: Optional[float] = Field(None, ge=0)


class PasswordChange(BaseModel):
    """Schema for changing password."""
    current_password: str
    new_password: str = Field(..., min_length=4)


class UserResponse(BaseModel):
    """Schema for user response."""
    id: int
    username: str
    name: str
    monthly_budget: float
    created_at: datetime

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    """Schema for authentication token response."""
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


# ============ EXPENSE SCHEMAS ============

class ExpenseBase(BaseModel):
    """Base schema for expense data."""
    category: str = Field(..., min_length=1, max_length=100)
    description: str = Field(..., min_length=1, max_length=255)
    amount: float = Field(..., ge=0)
    paid_amount: float = Field(0.0, ge=0)
    status: StatusEnum = StatusEnum.UNPAID
    notes: Optional[str] = None
    billing_month: str = Field(default_factory=get_current_billing_month, pattern=r"^\d{4}-\d{2}$")


class ExpenseCreate(ExpenseBase):
    """Schema for creating a new expense."""
    pass


class ExpenseUpdate(BaseModel):
    """Schema for updating an expense."""
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, min_length=1, max_length=255)
    amount: Optional[float] = Field(None, ge=0)
    paid_amount: Optional[float] = Field(None, ge=0)
    status: Optional[StatusEnum] = None
    notes: Optional[str] = None
    billing_month: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}$")


class BulkStatusUpdate(BaseModel):
    """Schema for bulk status update."""
    expense_ids: List[int] = Field(..., min_length=1)
    status: StatusEnum


class BulkDelete(BaseModel):
    """Schema for bulk delete."""
    expense_ids: List[int] = Field(..., min_length=1)


class ExpenseResponse(ExpenseBase):
    """Schema for expense response."""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ExpenseListResponse(BaseModel):
    """Schema for list of expenses."""
    expenses: List[ExpenseResponse]
    total: int


class CategoryTotal(BaseModel):
    """Schema for category-wise total."""
    category: str
    total: float
    count: int
    budget: float = 0.0


class MonthlyTotal(BaseModel):
    """Schema for monthly totals."""
    billing_month: str
    total_amount: float
    total_paid: float
    total_unpaid: float
    expense_count: int


class TrendsResponse(BaseModel):
    """Schema for spending trends response."""
    months: List[MonthlyTotal]
    average_monthly: float


class MetricsResponse(BaseModel):
    """Schema for metrics/dashboard response."""
    total_amount: float
    total_paid: float
    total_unpaid: float
    budget: float
    remaining: float  # budget - total_amount
    category_totals: List[CategoryTotal]
    expense_count: int
    current_month: str
    total_income: float = 0.0
    net_savings: float = 0.0
    overdue_unpaid: float = 0.0


# ============ RECURRING EXPENSE SCHEMAS ============

class FrequencyEnum(str, Enum):
    MONTHLY = "monthly"
    WEEKLY = "weekly"
    YEARLY = "yearly"


class RecurringExpenseBase(BaseModel):
    """Base schema for recurring expenses."""
    category: str = Field(..., min_length=1, max_length=100)
    description: str = Field(..., min_length=1, max_length=255)
    amount: float = Field(..., ge=0)
    frequency: FrequencyEnum = FrequencyEnum.MONTHLY
    day_of_month: Optional[int] = Field(None, ge=1, le=31)
    is_active: bool = True
    notes: Optional[str] = None


class RecurringExpenseCreate(RecurringExpenseBase):
    """Schema for creating a recurring expense."""
    start_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    end_date: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}-\d{2}$")


class RecurringExpenseUpdate(BaseModel):
    """Schema for updating a recurring expense."""
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, min_length=1, max_length=255)
    amount: Optional[float] = Field(None, ge=0)
    frequency: Optional[FrequencyEnum] = None
    day_of_month: Optional[int] = Field(None, ge=1, le=31)
    is_active: Optional[bool] = None
    end_date: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    notes: Optional[str] = None


class RecurringExpenseResponse(RecurringExpenseBase):
    """Schema for recurring expense response."""
    id: int
    start_date: str
    end_date: Optional[str]
    last_generated: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============ TAG SCHEMAS ============

class TagBase(BaseModel):
    """Base schema for tags."""
    name: str = Field(..., min_length=1, max_length=50)
    color: str = Field(default="#6366f1", pattern=r"^#[0-9a-fA-F]{6}$")


class TagCreate(TagBase):
    """Schema for creating a tag."""
    pass


class TagUpdate(BaseModel):
    """Schema for updating a tag."""
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    color: Optional[str] = Field(None, pattern=r"^#[0-9a-fA-F]{6}$")


class TagResponse(TagBase):
    """Schema for tag response."""
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ============ CATEGORY BUDGET SCHEMAS ============

class CategoryBudgetBase(BaseModel):
    """Base schema for category budgets."""
    category: str = Field(..., min_length=1, max_length=100)
    budget_amount: float = Field(..., ge=0)
    billing_month: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}$")


class CategoryBudgetCreate(CategoryBudgetBase):
    """Schema for creating a category budget."""
    pass


class CategoryBudgetUpdate(BaseModel):
    """Schema for updating a category budget."""
    budget_amount: Optional[float] = Field(None, ge=0)
    billing_month: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}$")


class CategoryBudgetResponse(CategoryBudgetBase):
    """Schema for category budget response."""
    id: int
    spent: Optional[float] = None  # Populated when retrieving with spent amount
    remaining: Optional[float] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============ INCOME SCHEMAS ============

class IncomeBase(BaseModel):
    """Base schema for income entries."""
    source: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=255)
    amount: float = Field(..., ge=0)
    billing_month: str = Field(..., pattern=r"^\d{4}-\d{2}$")
    received_date: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    is_recurring: bool = False
    notes: Optional[str] = None


class IncomeCreate(IncomeBase):
    """Schema for creating an income entry."""
    pass


class IncomeUpdate(BaseModel):
    """Schema for updating an income entry."""
    source: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=255)
    amount: Optional[float] = Field(None, ge=0)
    billing_month: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}$")
    received_date: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    is_recurring: Optional[bool] = None
    notes: Optional[str] = None


class IncomeResponse(IncomeBase):
    """Schema for income response."""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class IncomeSummary(BaseModel):
    """Schema for income summary."""
    total_income: float
    income_count: int
    by_source: List[dict]


# ============ REMINDER SCHEMAS ============

class ExpenseReminder(BaseModel):
    """Schema for expense due date reminder."""
    expense_id: int
    category: str
    description: str
    amount: float
    due_date: str
    days_until_due: int
    is_overdue: bool
    status: str


class RemindersResponse(BaseModel):
    """Schema for reminders response."""
    upcoming: List[ExpenseReminder]
    overdue: List[ExpenseReminder]
    total_overdue_amount: float


class ReminderCount(BaseModel):
    """Schema for reminder counts."""
    overdue_count: int
    upcoming_count: int
    total_pending: int


# ============ PAYEE SCHEMAS ============

class PayeeBase(BaseModel):
    """Base schema for payee."""
    name: str = Field(..., min_length=1, max_length=100)
    category: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None


class PayeeCreate(PayeeBase):
    """Schema for creating a payee."""
    pass


class PayeeUpdate(BaseModel):
    """Schema for updating a payee."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    category: Optional[str] = Field(None, max_length=100)
    notes: Optional[str] = None


class PayeeResponse(PayeeBase):
    """Schema for payee response."""
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============ SUB-CATEGORY SCHEMAS ============

class SubCategoryBase(BaseModel):
    """Base schema for sub-category."""
    parent_category: str = Field(..., min_length=1, max_length=100)
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=255)


class SubCategoryCreate(SubCategoryBase):
    """Schema for creating a sub-category."""
    pass


class SubCategoryResponse(SubCategoryBase):
    """Schema for sub-category response."""
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# ============ SPLIT EXPENSE SCHEMAS ============

class SplitExpenseBase(BaseModel):
    """Base schema for split expense."""
    category: str = Field(..., min_length=1, max_length=100)
    sub_category: Optional[str] = Field(None, max_length=100)
    description: str = Field(..., min_length=1, max_length=255)
    amount: float = Field(..., ge=0)
    notes: Optional[str] = None


class SplitExpenseCreate(SplitExpenseBase):
    """Schema for creating a split expense."""
    pass


class SplitExpenseResponse(SplitExpenseBase):
    """Schema for split expense response."""
    id: int
    parent_expense_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class SplitRequest(BaseModel):
    """Schema for splitting an expense."""
    splits: List[SplitExpenseCreate] = Field(..., min_length=2)


# ============ EXPENSE GROUP SCHEMAS ============

class ExpenseGroupBase(BaseModel):
    """Base schema for expense group."""
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=255)
    color: Optional[str] = Field("#6366f1", pattern=r"^#[0-9a-fA-F]{6}$")


class ExpenseGroupCreate(ExpenseGroupBase):
    """Schema for creating an expense group."""
    pass


class ExpenseGroupUpdate(BaseModel):
    """Schema for updating an expense group."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=255)
    color: Optional[str] = Field(None, pattern=r"^#[0-9a-fA-F]{6}$")


class ExpenseGroupResponse(ExpenseGroupBase):
    """Schema for expense group response."""
    id: int
    expense_count: int = 0
    total_amount: float = 0.0
    created_at: datetime

    class Config:
        from_attributes = True


# ============ PHASE 6: FINANCIAL FEATURES SCHEMAS ============

# Account Schemas
class AccountBase(BaseModel):
    """Base schema for account."""
    name: str = Field(..., min_length=1, max_length=100)
    account_type: str = Field(..., pattern=r"^(bank|wallet|credit_card|cash)$")
    balance: float = Field(0.0)
    currency: str = Field("INR", min_length=3, max_length=3)
    color: Optional[str] = Field("#3b82f6", pattern=r"^#[0-9a-fA-F]{6}$")
    icon: Optional[str] = Field("💳", max_length=50)
    notes: Optional[str] = None


class AccountCreate(AccountBase):
    """Schema for creating an account."""
    pass


class AccountUpdate(BaseModel):
    """Schema for updating an account."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    account_type: Optional[str] = Field(None, pattern=r"^(bank|wallet|credit_card|cash)$")
    balance: Optional[float] = None
    currency: Optional[str] = Field(None, min_length=3, max_length=3)
    color: Optional[str] = Field(None, pattern=r"^#[0-9a-fA-F]{6}$")
    icon: Optional[str] = Field(None, max_length=50)
    is_active: Optional[bool] = None
    notes: Optional[str] = None


class AccountResponse(AccountBase):
    """Schema for account response."""
    id: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Savings Goal Schemas
class SavingsGoalBase(BaseModel):
    """Base schema for savings goal."""
    name: str = Field(..., min_length=1, max_length=100)
    target_amount: float = Field(..., gt=0)
    current_amount: float = Field(0.0, ge=0)
    target_date: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    color: Optional[str] = Field("#10b981", pattern=r"^#[0-9a-fA-F]{6}$")
    icon: Optional[str] = Field("🎯", max_length=50)
    notes: Optional[str] = None


class SavingsGoalCreate(SavingsGoalBase):
    """Schema for creating a savings goal."""
    pass


class SavingsGoalUpdate(BaseModel):
    """Schema for updating a savings goal."""
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    target_amount: Optional[float] = Field(None, gt=0)
    current_amount: Optional[float] = Field(None, ge=0)
    target_date: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    color: Optional[str] = Field(None, pattern=r"^#[0-9a-fA-F]{6}$")
    icon: Optional[str] = Field(None, max_length=50)
    is_completed: Optional[bool] = None
    notes: Optional[str] = None


class SavingsGoalResponse(SavingsGoalBase):
    """Schema for savings goal response."""
    id: int
    is_completed: bool
    progress_percent: float = 0.0
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# Payment Method Schemas
class PaymentMethodBase(BaseModel):
    """Base schema for payment method."""
    name: str = Field(..., min_length=1, max_length=100)
    method_type: str = Field(..., pattern=r"^(card|upi|cash|net_banking|other)$")
    last_four: Optional[str] = Field(None, min_length=4, max_length=4)
    icon: Optional[str] = Field("💳", max_length=50)


class PaymentMethodCreate(PaymentMethodBase):
    """Schema for creating a payment method."""
    is_default: bool = False


class PaymentMethodResponse(PaymentMethodBase):
    """Schema for payment method response."""
    id: int
    is_default: bool
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


# Currency Rate Schemas
class CurrencyRateBase(BaseModel):
    """Base schema for currency rate."""
    from_currency: str = Field(..., min_length=3, max_length=3)
    to_currency: str = Field(..., min_length=3, max_length=3)
    rate: float = Field(..., gt=0)


class CurrencyRateCreate(CurrencyRateBase):
    """Schema for creating a currency rate."""
    pass


class CurrencyRateResponse(CurrencyRateBase):
    """Schema for currency rate response."""
    id: int
    updated_at: datetime

    class Config:
        from_attributes = True
