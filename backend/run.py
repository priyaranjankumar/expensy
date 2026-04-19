import uvicorn
import multiprocessing
import os
import sys
from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse
from app.main import app

def configure_static(application):
    # Determine path to static files
    if getattr(sys, 'frozen', False):
        # Running as compiled executable - PyInstaller extracts to sys._MEIPASS
        base_path = sys._MEIPASS
    else:
        # Running as script
        base_path = os.path.dirname(os.path.abspath(__file__))
    
    static_dir = os.path.join(base_path, "static")
    
    if os.path.exists(static_dir):
        # Remove existing root route if it exists (to prevent API taking precedence)
        for route in application.routes:
            if getattr(route, "path", None) == "/":
                application.routes.remove(route)
                break

        # Mount assets folder
        assets_dir = os.path.join(static_dir, "assets")
        if os.path.exists(assets_dir):
            application.mount("/assets", StaticFiles(directory=assets_dir), name="assets")
        
        # Serve index.html at root
        @application.get("/")
        async def serve_root():
            index_path = os.path.join(static_dir, "index.html")
            if os.path.exists(index_path):
                return FileResponse(index_path)
            return {"error": "Frontend not found"}

        # Catch-all route for SPA (must be last)
        @application.get("/{full_path:path}")
        async def serve_spa(full_path: str):
            # Check if file exists in static directory
            file_path = os.path.join(static_dir, full_path)
            if os.path.exists(file_path) and os.path.isfile(file_path):
                return FileResponse(file_path)
            
            # Fallback to index.html for SPA routing
            index_path = os.path.join(static_dir, "index.html")
            if os.path.exists(index_path):
                return FileResponse(index_path)
            return {"error": "Frontend not found"}

if __name__ == "__main__":
    multiprocessing.freeze_support()
    configure_static(app)
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port, reload=False)
