from __future__ import annotations

from dotenv import load_dotenv
from flask import Flask, render_template

from .utils.db import ensure_indexes
from .routes.tasks import bp as tasks_bp
from .routes.sessions import bp as sessions_bp
from .routes.moods import bp as moods_bp
from .routes.galaxy import bp as galaxy_bp
from .routes.stats import bp as stats_bp
from .routes.status import bp as status_bp
from .routes.calendar import bp as calendar_bp
from .routes.music import bp as music_bp

import os

load_dotenv()


def create_app() -> Flask:
    """
    Application factory for CodeGalaxy.
    """
    base_dir = os.path.dirname(os.path.abspath(__file__))
    frontend_dir = os.path.join(base_dir, "..", "frontend")
    templates_path = os.path.join(frontend_dir, "templates")
    static_path = os.path.join(frontend_dir, "static")

    app = Flask(
        __name__,
        template_folder=templates_path,
        static_folder=static_path,
    )

    @app.route('/static/<path:filename>')
    def custom_static(filename):
        return app.send_static_file(filename)

    # Initialize DB indexes
    ensure_indexes()

    # Blueprints
    app.register_blueprint(tasks_bp)
    app.register_blueprint(sessions_bp)
    app.register_blueprint(moods_bp)
    app.register_blueprint(galaxy_bp)
    app.register_blueprint(stats_bp)
    app.register_blueprint(status_bp)
    app.register_blueprint(calendar_bp)
    app.register_blueprint(music_bp, url_prefix="/api")

    @app.route("/")
    def index():
        return render_template("index.html")

    # Backwards compatible API routes used by existing frontend
    @app.route("/api/tasks", methods=["GET"])
    def api_get_tasks():
        from .routes.tasks import list_tasks

        return list_tasks()

    @app.route("/api/tasks", methods=["POST"])
    def api_create_task():
        from .routes.tasks import create_task

        return create_task()

    @app.route("/api/tasks/<task_id>", methods=["PUT"])
    def api_update_task(task_id: str):
        from .routes.tasks import update_task

        return update_task(task_id)

    @app.route("/api/tasks/<task_id>", methods=["DELETE"])
    def api_delete_task(task_id: str):
        from .routes.tasks import delete_task

        return delete_task(task_id)

    @app.route("/api/galaxy", methods=["GET"])
    def api_galaxy():
        from .routes.galaxy import galaxy_data

        return galaxy_data()

    @app.route("/api/calendar", methods=["GET"])
    def api_get_calendar():
        from .routes.calendar import list_events

        return list_events()

    @app.route("/api/calendar", methods=["POST"])
    def api_create_calendar():
        from .routes.calendar import create_event

        return create_event()

    @app.route("/api/calendar/<event_id>", methods=["DELETE"])
    def api_delete_calendar(event_id: str):
        from .routes.calendar import delete_event

        return delete_event(event_id)

    return app


app = create_app()


if __name__ == "__main__":
    app.run(debug=True, port=3000)


