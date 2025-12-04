import os
from typing import Any, Dict

from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.database import Database
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError


load_dotenv()

_client: MongoClient | None = None


def get_client() -> MongoClient:
    """
    Return a singleton MongoClient instance with production-ready settings.

    The URI is loaded from the MONGODB_URI environment variable.
    Falls back to local MongoDB if not set (development only).
    """
    global _client
    if _client is None:
        mongo_uri = os.getenv("MONGODB_URI")
        if not mongo_uri:
            # Fallback to local (development only)
            mongo_uri = "mongodb://localhost:27017/codegalaxy"
            print("⚠️  MONGODB_URI not set. Using local fallback (development mode)")
        
        try:
            # Production-ready MongoDB client configuration
            _client = MongoClient(
                mongo_uri,
                serverSelectionTimeoutMS=5000,  # 5 second timeout
                connectTimeoutMS=10000,  # 10 second connection timeout
                socketTimeoutMS=20000,  # 20 second socket timeout
                maxPoolSize=50,  # Connection pool size
                retryWrites=True,  # Retry failed writes
                w='majority'  # Write concern for data safety
            )
            # Test the connection
            _client.admin.command('ping')
            print("✓ MongoDB connection successful")
        except (ConnectionFailure, ServerSelectionTimeoutError) as e:
            print(f"❌ MongoDB connection failed: {e}")
            raise Exception(f"Failed to connect to MongoDB: {e}")
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


