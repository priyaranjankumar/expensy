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
    status: Optional[StatusEnum] = None
    notes: Optional[str] = None
    billing_month: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}$")


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


class MonthlyTotal(BaseModel):
    """Schema for monthly totals."""
    billing_month: str
    total_amount: float
    total_paid: float
    total_unpaid: float
    expense_count: int


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
