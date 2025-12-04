from __future__ import annotations

from datetime import datetime
from typing import Any, Dict

from flask import Blueprint, jsonify, request
from bson import ObjectId

from ..utils.db import get_db, get_default_user_id


bp = Blueprint("tasks", __name__, url_prefix="/tasks")


def serialize_task(doc: Dict[str, Any]) -> Dict[str, Any]:
    return {
        "id": str(doc["_id"]),
        "title": doc.get("title", ""),
        "description": doc.get("description", ""),
        "date": doc.get("date"),
        "due_at": doc.get("due_at"),  # ISO string
        "priority": doc.get("priority", "Medium"),
        "category": doc.get("category", "Personal"),
        "completed": bool(doc.get("completed", False)),
        "created_at": doc.get("created_at"),
    }


@bp.get("")
def list_tasks():
    """
    GET /tasks
    Optional query params: category, completed
    """
    db = get_db()
    user_id = get_default_user_id()

    query: Dict[str, Any] = {"user_id": user_id}

    category = request.args.get("category")
    if category and category != "all":
        query["category"] = category

    completed = request.args.get("completed")
    if completed is not None:
        query["completed"] = completed == "true"

    docs = (
        db.tasks.find(query)
        .sort([("date", -1), ("due_at", 1), ("created_at", -1)])
    )
    return jsonify([serialize_task(d) for d in docs])


@bp.post("")
def create_task():
    """
    POST /tasks
    Body: { title, description?, date, due_at?, priority?, category?, completed? }
    """
    db = get_db()
    user_id = get_default_user_id()
    data = request.get_json(silent=True) or {}

    doc = {
        "user_id": user_id,
        "title": data.get("title", "").strip(),
        "description": data.get("description", "").strip(),
        "date": data.get("date"),
        "due_at": data.get("due_at"),
        "priority": data.get("priority", "Medium"),
        "category": data.get("category", "Personal"),
        "completed": bool(data.get("completed", False)),
        "created_at": datetime.utcnow(),
    }
    result = db.tasks.insert_one(doc)
    return (
        jsonify({"id": str(result.inserted_id), "message": "Task created successfully"}),
        201,
    )


@bp.put("/<task_id>")
def update_task(task_id: str):
    """
    PUT /tasks/<id>
    Replaces editable fields.
    """
    db = get_db()
    user_id = get_default_user_id()
    data = request.get_json(silent=True) or {}

    try:
        oid = ObjectId(task_id)
    except Exception:
        return jsonify({"error": "Invalid task id"}), 400

    existing = db.tasks.find_one({"_id": oid, "user_id": user_id})
    if not existing:
        return jsonify({"error": "Task not found"}), 404

    update_doc = {
        "title": data.get("title", existing.get("title", "")).strip(),
        "description": data.get("description", existing.get("description", "")).strip(),
        "date": data.get("date", existing.get("date")),
        "due_at": data.get("due_at", existing.get("due_at")),
        "priority": data.get("priority", existing.get("priority", "Medium")),
        "category": data.get("category", existing.get("category", "Personal")),
        "completed": bool(data.get("completed", existing.get("completed", False))),
    }

    db.tasks.update_one({"_id": oid, "user_id": user_id}, {"$set": update_doc})
    return jsonify({"message": "Task updated successfully"})


@bp.delete("/<task_id>")
def delete_task(task_id: str):
    """
    DELETE /tasks/<id>
    """
    db = get_db()
    user_id = get_default_user_id()

    try:
        oid = ObjectId(task_id)
    except Exception:
        return jsonify({"error": "Invalid task id"}), 400

    db.tasks.delete_one({"_id": oid, "user_id": user_id})
    return jsonify({"message": "Task deleted successfully"})


@bp.patch("/<task_id>/complete")
def complete_task(task_id: str):
    """
    PATCH /tasks/<id>/complete
    Marks task as completed=true.
    """
    db = get_db()
    user_id = get_default_user_id()

    try:
        oid = ObjectId(task_id)
    except Exception:
        return jsonify({"error": "Invalid task id"}), 400

    db.tasks.update_one({"_id": oid, "user_id": user_id}, {"$set": {"completed": True}})
    return jsonify({"message": "Task marked as completed"})


