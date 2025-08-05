# backend/app/jsonc_loader.py

# Standard library / third‑party imports
from pathlib import Path
import commentjson  # Parses JSON that may contain //‑style comments


# --------------------------------------------------------------------------- 
# Helper that loads "JSON with Comments" (.jsonc) files
# --------------------------------------------------------------------------- 
def load_jsonc(path: Path) -> dict:
    """
    Parse *path* and return the resulting Python dictionary.

    The function behaves like json.load() but allows C‑/C++ style comments
    thanks to the `commentjson` parser.
    """

    # Read file as UTF‑8 and delegate parsing to commentjson
    with path.open(encoding="utf-8") as fh:
        return commentjson.load(fh)
