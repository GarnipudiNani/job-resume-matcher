import subprocess
import time
import webbrowser
from pathlib import Path
from urllib.request import urlopen
from urllib.error import URLError

PROJECT_DIR = Path(__file__).resolve().parent
PYTHON_EXE = PROJECT_DIR / "venv" / "Scripts" / "python.exe"
FRONTEND_DIR = PROJECT_DIR / "frontend"

BACKEND_URL = "http://127.0.0.1:8001"
FRONTEND_URL = "http://localhost:5173"

backend = None
frontend = None

try:
    # Start FastAPI backend
    print("Starting FastAPI backend...", flush=True)

    backend = subprocess.Popen(
        [
            str(PYTHON_EXE),
            "-m",
            "uvicorn",
            "app.main:app",
            "--host",
            "127.0.0.1",
            "--port",
            "8001",
        ],
        cwd=str(PROJECT_DIR),
    )

    # Wait for backend
    for _ in range(60):
        if backend.poll() is not None:
            raise RuntimeError("Backend stopped unexpectedly.")

        try:
            with urlopen(f"{BACKEND_URL}/openapi.json", timeout=1):
                break
        except (URLError, TimeoutError, OSError):
            time.sleep(1)
    else:
        raise RuntimeError("Backend did not start within 60 seconds.")

    print("Backend started successfully!", flush=True)

    # Start React frontend
    print("Starting React frontend...", flush=True)

    frontend = subprocess.Popen(
        [
            "npm.cmd",
            "run",
            "dev",
            "--",
            "--host",
            "127.0.0.1",
            "--port",
            "5173",
            "--strictPort",
        ],
        cwd=str(FRONTEND_DIR),
    )

    # Wait for frontend
    for _ in range(60):
        if frontend.poll() is not None:
            raise RuntimeError("Frontend stopped. Check its terminal output.")

        try:
            with urlopen(FRONTEND_URL, timeout=1):
                break
        except (URLError, TimeoutError, OSError):
            time.sleep(1)
    else:
        raise RuntimeError("Frontend did not start within 60 seconds.")

    print("\nBoth applications are running!", flush=True)
    print("Frontend:", FRONTEND_URL, flush=True)
    print("Backend Swagger:", f"{BACKEND_URL}/docs", flush=True)

    # Open frontend and Swagger in separate tabs
    webbrowser.open_new_tab(FRONTEND_URL)
    time.sleep(2)
    webbrowser.open_new_tab(f"{BACKEND_URL}/docs")

    print("\nKeep this terminal open.", flush=True)
    print("Press Ctrl+C to stop both servers.", flush=True)

    # Keep both servers running
    while True:
        if backend.poll() is not None:
            print("Backend stopped unexpectedly.")
            break

        if frontend.poll() is not None:
            print("Frontend stopped unexpectedly.")
            break

        time.sleep(1)

except KeyboardInterrupt:
    print("\nStopping applications...")

except Exception as error:
    print(f"\nStartup error: {error}")

finally:
    for process in (frontend, backend):
        if process is not None and process.poll() is None:
            process.terminate()

    for process in (frontend, backend):
        if process is not None and process.poll() is None:
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()

    print("Applications stopped.")