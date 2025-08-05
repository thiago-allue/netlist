# backend/app/auth.py

# Standard library / third‑party imports
import os
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials


# --------------------------------------------------------------------------- 
# Configuration constants
# --------------------------------------------------------------------------- 

# Secret used to sign/verify JWTs (override via env var in production)
_JWT_SECRET = os.getenv("JWT_SECRET", "dev-only-secret")

# Hashing algorithm enforced for JWTs
_ALG = "HS256"

# Re‑usable HTTPBearer instance (auto_error=False ⇒ endpoint can be public)
_scheme = HTTPBearer(auto_error=False)


# --------------------------------------------------------------------------- 
# Dependency that extracts the user ID from the Authorization header
# --------------------------------------------------------------------------- 
def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(_scheme),
) -> str:
    """
    Return the `sub` claim of a valid JWT or the literal string "anonymous"
    when the request is unauthenticated.
    """

    # No Authorization header ⇒ unauthenticated request
    if not creds:
        return "anonymous"

    try:
        # Decode and verify the JWT   
        payload = jwt.decode(creds.credentials, _JWT_SECRET, algorithms=[_ALG])
        return payload["sub"]
    except (jwt.PyJWTError, KeyError):
        # Any decode error ⇒ treat as unauthenticated/invalid token
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )
