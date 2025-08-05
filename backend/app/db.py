# backend/app/db.py

# Third‑party imports
from motor.motor_asyncio import AsyncIOMotorClient
from functools import lru_cache
import os


# --------------------------------------------------------------------------- 
# Singleton MongoDB client
# --------------------------------------------------------------------------- 
@lru_cache
def get_client() -> AsyncIOMotorClient:
    """
    Return a *cached* Motor client so that all request handlers share the same
    connection pool.
    """

    # Build the connection URI (override via env for prod / CI)
    uri = os.getenv("MONGO_URI", "mongodb://localhost:27017/pcb")
    return AsyncIOMotorClient(uri)


# --------------------------------------------------------------------------- 
# Convenience wrapper that returns the single collection used by the app
# --------------------------------------------------------------------------- 
def get_collection():
    """
    Shorthand that yields the `netlists` collection from the `pcb` database.
    """
    return get_client()["pcb"]["netlists"]
