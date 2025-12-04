import os
from typing import Any, Dict

from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.database import Database


load_dotenv()

_client: MongoClient | None = None


def get_client() -> MongoClient:
    """
    Return a singleton MongoClient instance.

    The URI is loaded from the MONGODB_URI environment variable.
    Falls back to local MongoDB if not set.
    """
    global _client
    if _client is None:
        mongo_uri = os.getenv("MONGODB_URI")
        if not mongo_uri:
            # Fallback to local
            mongo_uri = "mongodb://localhost:27017/codegalaxy"
            print(f"MONGODB_URI not set. Using local fallback: {mongo_uri}")
        _client = MongoClient(mongo_uri, tlsAllowInvalidCertificates=True)
    return _client


def get_db() -> Database:
    """
    Return the main application database.

    Even if the URI does not contain the database name, MongoDB will
    lazily create the 'codegalaxy' database on first write.
    """
    client = get_client()
    return client["codegalaxy"]


def get_default_user_id() -> str:
    """
    For this project we use a single demo user.
    Later this can be replaced by a real auth system.
    """
    return "demo-user"


def ensure_indexes() -> None:
    """
    Create useful indexes. This is idempotent and safe to call at startup.
    """
    db = get_db()
    db.tasks.create_index([("user_id", 1), ("date", 1)])
    db.sessions.create_index([("user_id", 1), ("started_at", 1)])
    db.celestial_objects.create_index([("user_id", 1), ("created_at", 1)])


