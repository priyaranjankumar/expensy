# -*- mode: python ; coding: utf-8 -*-
"""
PyInstaller spec file for Expense Tracker
Build with: pyinstaller expense_tracker.spec --clean
"""

import os

block_cipher = None
SPEC_DIR = os.path.dirname(os.path.abspath(SPEC))

# Check if static folder exists
static_path = os.path.join(SPEC_DIR, 'static')
datas = []
if os.path.exists(static_path):
    datas.append(('static', 'static'))

a = Analysis(
    ['run_server.py'],
    pathex=[SPEC_DIR],
    binaries=[],
    datas=datas,
    hiddenimports=[
        'uvicorn',
        'uvicorn.logging',
        'uvicorn.loops',
        'uvicorn.loops.auto',
        'uvicorn.protocols',
        'uvicorn.protocols.http',
        'uvicorn.protocols.http.auto',
        'uvicorn.protocols.http.h11_impl',
        'uvicorn.protocols.websockets',
        'uvicorn.protocols.websockets.auto',
        'uvicorn.lifespan',
        'uvicorn.lifespan.on',
        'uvicorn.lifespan.off',
        'fastapi',
        'starlette',
        'starlette.responses',
        'starlette.staticfiles',
        'pydantic',
        'pydantic_core',
        'sqlalchemy',
        'sqlalchemy.dialects.sqlite',
        'h11',
        'anyio',
        'anyio._backends',
        'anyio._backends._asyncio',
    ],
    hookspath=[],
    runtime_hooks=[],
    excludes=[],
    cipher=block_cipher,
    noarchive=False,
)

pyz = PYZ(a.pure, a.zipped_data, cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='ExpenseTracker',
    debug=False,
    strip=False,
    upx=True,
    console=True,
    icon=None,
)
