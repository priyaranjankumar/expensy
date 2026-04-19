from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import sys


def get_data_directory():
    """
    Get a persistent data directory for storing the database.
    - For frozen executables: Use user's app data directory
    - For development: Use the backend directory
    """
    if getattr(sys, 'frozen', False):
        # Running as compiled executable - use persistent user directory
        if sys.platform == 'win32':
            # Windows: %APPDATA%\ExpenseTracker
            base = os.environ.get('APPDATA', os.path.expanduser('~'))
            data_dir = os.path.join(base, 'ExpenseTracker')
        elif sys.platform == 'darwin':
            # macOS: ~/Library/Application Support/ExpenseTracker
            data_dir = os.path.join(
                os.path.expanduser('~'),
                'Library', 'Application Support', 'ExpenseTracker'
            )
        else:
            # Linux: ~/.local/share/ExpenseTracker
            xdg_data = os.environ.get(
                'XDG_DATA_HOME',
                os.path.join(os.path.expanduser('~'), '.local', 'share')
            )
            data_dir = os.path.join(xdg_data, 'ExpenseTracker')
        
        # Ensure the directory exists
        os.makedirs(data_dir, exist_ok=True)
        return data_dir
    else:
        # Running as script - use the backend directory's data folder
        data_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data")
        os.makedirs(data_dir, exist_ok=True)
        return data_dir


# Get the appropriate data directory
BASE_DIR = get_data_directory()
DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'expenses.db')}"

engine = create_engine(
    DATABASE_URL, 
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """Dependency for getting database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
