#!/bin/bash
# ============================================
#   Expense Tracker - Linux/Raspberry Pi Build Script
# ============================================

set -e

echo "============================================"
echo "  Expense Tracker - Linux Build Script"
echo "============================================"
echo ""

# Check if we're in the right directory
if [ ! -f "app/main.py" ]; then
    echo "ERROR: Please run this script from the backend directory"
    exit 1
fi

# Detect architecture
ARCH=$(uname -m)
echo "Detected architecture: $ARCH"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt
pip install pyinstaller

# Build frontend
echo ""
echo "Building frontend..."
cd ../frontend

if [ ! -d "node_modules" ]; then
    npm install
fi

npm run build

# Copy frontend build to backend static folder
echo ""
echo "Copying frontend build to backend..."
rm -rf ../backend/app/static
mkdir -p ../backend/app/static
cp -r dist/* ../backend/app/static/

# Go back to backend
cd ../backend

# Build executable
echo ""
echo "Building Linux executable..."
pyinstaller expense_tracker.spec --clean

# Make executable
chmod +x dist/ExpenseTracker

echo ""
echo "============================================"
echo "  Build complete!"
echo "  Executable: dist/ExpenseTracker"
echo ""
echo "  To run:"
echo "  ./dist/ExpenseTracker"
echo "============================================"
echo ""

# Output platform-specific notes
if [[ "$ARCH" == "armv7l" ]] || [[ "$ARCH" == "aarch64" ]]; then
    echo "  Raspberry Pi detected!"
    echo "  You can copy the executable to your Pi and run it directly."
fi
