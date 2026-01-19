# -*- mode: python ; coding: utf-8 -*-
"""
PyInstaller spec file for Expense Tracker
Build with: pyinstaller expense_tracker.spec --clean
"""

import os

block_cipher = None
SPEC_DIR = os.path.dirname(os.path.abspath(SPEC))

# Frontend dist path (relative to backend)
frontend_dist = os.path.join(os.path.dirname(SPEC_DIR), 'frontend', 'dist')

datas = []
# Verify frontend build exists and add it
if os.path.exists(frontend_dist):
    datas.append((frontend_dist, 'static'))
else:
    print(f"WARNING: Frontend dist not found at {frontend_dist}")

a = Analysis(
    ['run.py'],
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
        'pydantic',
        'sqlalchemy',
        'passlib',
        'passlib.handlers',
        'passlib.handlers.argon2',
        'passlib.handlers.bcrypt',
        'argon2',
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
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)

