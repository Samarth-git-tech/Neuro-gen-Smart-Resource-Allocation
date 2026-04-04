@echo off
echo ==============================================
echo  NGO Backend Setting up...
echo ==============================================

if not exist "venv" (
    echo [1/3] Creating virtual environment...
    python -m venv venv
) else (
    echo [1/3] Virtual environment found.
)

echo [2/3] Activating virtual environment and installing dependencies...
call venv\Scripts\activate.bat
pip install -r requirements.txt

echo [3/3] Starting the FastAPI development server!
echo.
echo Application will be available at: http://127.0.0.1:8000
echo Check out the auto-generated API docs at: http://127.0.0.1:8000/docs
echo.
uvicorn app.main:app --reload
