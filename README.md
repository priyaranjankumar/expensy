# Personal Expense Tracker

A full-stack personal expense tracking application.

![Expense Tracker](https://via.placeholder.com/800x400/6366f1/ffffff?text=Personal+Expense+Tracker)


## 🚀 Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### 1️⃣ Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # Windows
   venv\Scripts\activate
   # macOS/Linux
   source venv/bin/activate
   ```

3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

4. Start the server (Database is auto-created):
   ```bash
   python -m uvicorn app.main:app --reload
   ```
   *Server runs at: http://localhost:8000*

### 3️⃣ Configuration (Optional)

Create a `.env` file in the `backend/` directory (or next to your executable) to override default settings:

```env
# backend/.env
SECRET_KEY=your-secure-production-key-here
```
*If not provided, the app uses a default development key.*

### 2️⃣ Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the application:
   ```bash
   npm run dev
   ```
   *App runs at: http://localhost:5173*

---

## � Building for Distribution

### 1. Build Frontend
First, compile the React frontend into static files:
```bash
cd frontend
npm run build
```
This creates a `dist/` folder which the backend is configured to serve automatically.

### 2. Create Executable (PyInstaller)

You can package the entire application (Backend + Frontend) into a single executable file.

**Windows / Linux / macOS:**

1. Ensure requirements are installed:
   ```bash
   pip install -r requirements.txt
   pip install pyinstaller
   ```

2. Run the build using the spec file (recommended):
   ```bash
   cd backend
   pyinstaller expense_tracker.spec --clean
   ```

   *Note: This automatically handles the differing path separators and includes all necessary hidden imports (like `passlib`) and frontend static files.*

3. The executable will be created in `backend/dist/ExpenseTracker` (or `ExpenseTracker.exe` on Windows).

### 3. Data Storage

When running as a packaged executable, your data (SQLite database) is stored in a persistent user directory:

| Platform | Data Location |
|----------|---------------|
| **Linux** | `~/.local/share/ExpenseTracker/expenses.db` |
| **macOS** | `~/Library/Application Support/ExpenseTracker/expenses.db` |
| **Windows** | `%APPDATA%\ExpenseTracker\expenses.db` |

> **Note:** During development (running as a script), the database is stored in the `backend/` directory.

### 4. Cross-Platform (Docker)
For the most consistent experience across architectures (x86, ARM) and OS (Windows, Linux, Mac), use Docker.

**Dockerfile:**
```dockerfile
# Build Frontend
FROM node:18 as frontend-build
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ .
RUN npm run build

# Build Backend
FROM python:3.11-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/app ./app
COPY --from=frontend-build /app/frontend/dist ./frontend/dist

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Build & Run:**
```bash
docker build -t expensy .
docker run -p 8000:8000 expensy
```


---

## 📡 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login and get JWT |
| GET | `/api/auth/me` | Get current profile |
| PUT | `/api/auth/me` | Update profile/budget |

### Expenses & Metrics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/expenses` | List all expenses (filterable) |
| POST | `/api/expenses` | Create new expense |
| GET | `/api/metrics` | Get budget & dashboard stats |

---
