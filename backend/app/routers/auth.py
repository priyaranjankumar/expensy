"""Authentication routes for login, signup, and user profile."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..auth import get_password_hash, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=schemas.TokenResponse)
def signup(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    """Create a new user account."""
    # Check if username already exists
    existing = db.query(models.User).filter(models.User.username == user_data.username).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    # Create user
    user = models.User(
        username=user_data.username,
        password_hash=get_password_hash(user_data.password),
        name=user_data.name,
        monthly_budget=user_data.monthly_budget
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Create token
    token = create_access_token(data={"sub": str(user.id)})
    
    return schemas.TokenResponse(
        access_token=token,
        user=schemas.UserResponse.model_validate(user)
    )


@router.post("/login", response_model=schemas.TokenResponse)
def login(credentials: schemas.UserLogin, db: Session = Depends(get_db)):
    """Login with username and password."""
    user = db.query(models.User).filter(models.User.username == credentials.username).first()
    
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create token
    token = create_access_token(data={"sub": str(user.id)})
    
    return schemas.TokenResponse(
        access_token=token,
        user=schemas.UserResponse.model_validate(user)
    )


@router.get("/me", response_model=schemas.UserResponse)
def get_profile(current_user: models.User = Depends(get_current_user)):
    """Get current user profile."""
    return current_user


@router.put("/me", response_model=schemas.UserResponse)
def update_profile(
    user_data: schemas.UserUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user profile (name, budget)."""
    if user_data.name is not None:
        current_user.name = user_data.name
    if user_data.monthly_budget is not None:
        current_user.monthly_budget = user_data.monthly_budget
    
    db.commit()
    db.refresh(current_user)
    return current_user


@router.put("/password")
def change_password(
    password_data: schemas.PasswordChange,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Change user password."""
    if not verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    current_user.password_hash = get_password_hash(password_data.new_password)
    db.commit()
    
    return {"message": "Password changed successfully"}
