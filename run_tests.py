import subprocess
import sys

def main():
    print("[AURA TESTS] Launching automated pytest verification suite...")
    try:
        # Run pytest inside the project module structures
        result = subprocess.run(
            [sys.executable, "-m", "pytest", "backend/tests/", "-v"],
            capture_output=False,
            text=True
        )
        if result.returncode == 0:
            print("\n[AURA TESTS] SUCCESS: All unit tests passed!")
            sys.exit(0)
        else:
            print("\n[AURA TESTS] FAILURE: One or more unit tests failed.")
            sys.exit(result.returncode)
    except Exception as e:
        print(f"[AURA TESTS] Unexpected exception executing pytest: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
