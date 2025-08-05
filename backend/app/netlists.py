"""
backend/app/netlists.py
──────────────────────────────────────────────────────────────────────────────
REST endpoints for uploading and retrieving PCB netlists.

Accepts either:
  • raw JSON   (Content‑Type: application/json)
  • multipart  (form‑data; field name “file” with a JSON file)

Processing pipeline for POST /api/netlists:
  1. Parse incoming JSON (raw body or file)
  2. Validate against JSON Schema (syntax / structure)
  3. Run rule‑based validators (semantic checks)
  4. Persist original netlist + metadata + validation report to Mongo
  5. Return inserted document ID and validation summary

Also exposes read endpoints:
  • GET /api/netlists          → list user’s submissions (id, status, createdAt)
  • GET /api/netlists/{id}     → netlist JSON + validation results

Supports pagination and simple JWT auth via get_current_user (falls back to
“anonymous”).
"""

# ─────────────────────────────────────────────────────────────────────────────
# Standard library / third‑party imports
# ─────────────────────────────────────────────────────────────────────────────
from datetime import datetime
import json
import pathlib
from typing import List, Any

from fastapi import (
    APIRouter,
    Request,
    UploadFile,
    File,
    HTTPException,
    status,
    Depends,
    Query,
)
from fastapi.responses import JSONResponse
from fastjsonschema import compile as compile_schema, JsonSchemaException
from bson import ObjectId

# ─────────────────────────────────────────────────────────────────────────────
# Internal helpers
# ─────────────────────────────────────────────────────────────────────────────
from .jsonc_loader import load_jsonc
from .db import get_collection
from .auth import get_current_user
from . import validators


# ─────────────────────────────────────────────────────────────────────────────
# Compile JSON Schema once at import time (fast!)
# ─────────────────────────────────────────────────────────────────────────────

# Build absolute path to `netlist.schema.jsonc`
schema_path = pathlib.Path(__file__).parent.parent / "schema" / "netlist.schema.jsonc"

# Parse JSON (with comments) → dict
schema_dict = load_jsonc(schema_path)

# Generate an ultra‑fast validation function
validate_netlist = compile_schema(schema_dict)


# ─────────────────────────────────────────────────────────────────────────────
# FastAPI router
# ─────────────────────────────────────────────────────────────────────────────
router = APIRouter(prefix="/api/netlists", tags=["netlists"])


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/netlists  –Upload a new netlist
# ─────────────────────────────────────────────────────────────────────────────
@router.post("", status_code=status.HTTP_201_CREATED)
async def upload_netlist(
    request: Request,
    file: UploadFile | None = File(None),
    user_id: str = Depends(get_current_user),
):
    """
    Upload a netlist in either of two formats:

    1. **Raw JSON** –`Content‑Type: application/json` with body = the JSON.
    2. **Multipart** – field named `file` that contains the JSON file.

    Returns a validation summary and the MongoDB ID of the stored document.
    """

    # 1) ---------------------------------------------------------------------
    # Attempt to extract a JSON payload from the request
    # -----------------------------------------------------------------------
    content_type = request.headers.get("content-type", "")
    netlist: dict | None = None

    if content_type.startswith("application/json"):
        try:
            netlist = await request.json()
        except Exception as exc:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"Invalid JSON body: {exc}",
            ) from exc

    elif file is not None:
        try:
            raw = await file.read()
            netlist = json.loads(raw)
        except json.JSONDecodeError as exc:
            raise HTTPException(
                status.HTTP_400_BAD_REQUEST,
                f"Invalid JSON in uploaded file: {exc.msg}",
            ) from exc

    if netlist is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No JSON payload found")

    # 2) ---------------------------------------------------------------------
    # Structural validation (JSON Schema)
    # -----------------------------------------------------------------------
    try:
        validate_netlist(netlist)
    except JsonSchemaException as exc:
        raise HTTPException(
            status.HTTP_422_UNPROCESSABLE_ENTITY,
            f"Schema validation failed: {exc.message}",
        ) from exc

    # 3) ---------------------------------------------------------------------
    # Semantic validation (rule‑based)
    # -----------------------------------------------------------------------
    violations = validators.run_all(netlist)
    status_val = "valid" if not violations else "invalid"

    # 4) ---------------------------------------------------------------------
    # Persist original JSON + metadata + validation report
    # -----------------------------------------------------------------------
    coll = get_collection()
    doc = {
        "userId": user_id,
        "createdAt": datetime.utcnow().isoformat(timespec="seconds") + "Z",
        "netlist": netlist,
        "validation": {
            "status": status_val,
            "violations": violations,
        },
    }
    result = await coll.insert_one(doc)

    # 5) ---------------------------------------------------------------------
    # Respond with a concise summary
    # -----------------------------------------------------------------------
    return JSONResponse(
        status_code=status.HTTP_201_CREATED,
        content={
            "id": str(result.inserted_id),
            "status": status_val,
            "violations": violations,
        },
    )


# ─────────────────────────────────────────────────────────────────────────────
# Dependency that yields the collection instance
# ─────────────────────────────────────────────────────────────────────────────
def _coll():
    return get_collection()


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/netlists  –List submissions (paginated)
# ─────────────────────────────────────────────────────────────────────────────
@router.get("", summary="List my submissions")
async def list_netlists(
    user_id: str = Depends(get_current_user),
    limit: int = Query(20, ge=1, le=100, description="Max items to return"),
    skip: int = Query(0, ge=0, description="Items to skip (offset)"),
    coll=Depends(_coll),
):
    """
    Return a paginated list of the current user’s submissions.

    Handles both the *new* document shape

        {"validation": {"status": "valid", "violations": []}}

    and the *legacy* shape where `validation` was just a list of violations.
    """
    cursor = (
        coll.find(
            {"userId": user_id},
            {"validation": 1, "createdAt": 1},
        )
        .sort("createdAt", -1)
        .skip(skip)
        .limit(limit)
    )

    items: List[dict] = []

    async for doc in cursor:
        val: Any = doc.get("validation")

        # --------------------------------------------------------------------
        # Back‑compat logic that computes a uniform "status" string
        # --------------------------------------------------------------------
        if isinstance(val, dict):
            status_str = val.get("status", "unknown")
        elif isinstance(val, list):
            status_str = "invalid" if val else "valid"
        else:
            status_str = "unknown"

        items.append(
            {
                "id": str(doc["_id"]),
                "createdAt": doc.get("createdAt", ""),
                "status": status_str,
            }
        )

    total = await coll.count_documents({"userId": user_id})
    return {"total": total, "items": items}


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/netlists/{id}  –Retrieve a single submission
# ─────────────────────────────────────────────────────────────────────────────
@router.get("/{netlist_id}", summary="Get a single submission")
async def get_netlist(
    netlist_id: str,
    user_id: str = Depends(get_current_user),
    coll=Depends(_coll),
):
    """
    Fetch the full netlist document and its validation report, but **only**
    if the submission belongs to the current authenticated user.
    """

    # Early check – ensure the ID can be parsed as an ObjectId
    try:
        oid = ObjectId(netlist_id)
    except Exception:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Invalid netlist ID format")

    # Query by both ID *and* user ID to enforce authorization
    doc = await coll.find_one({"_id": oid, "userId": user_id})
    if not doc:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Netlist not found or access denied")

    # Normalise validation shape (dict vs list) into a uniform response
    validation = doc.get("validation")
    if isinstance(validation, dict):
        status_str = validation.get("status", "unknown")
        violations = validation.get("violations", [])
    else:
        status_str = "invalid" if validation else "valid"
        violations = validation or []

    return {
        "id": netlist_id,
        "createdAt": doc.get("createdAt", ""),
        "status": status_str,
        "violations": violations,
        "netlist": doc["netlist"],
    }
