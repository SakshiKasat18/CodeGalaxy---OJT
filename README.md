# CodeGalaxy

CodeGalaxy is a focus & productivity dashboard that turns your completed tasks and focus sessions into a living galaxy. The UI is the original “OG Galaxy” dashboard (tasks, calendar, music, galaxy canvas) but now backed by Flask + MongoDB Atlas with clean routes, seed scripts, and local music.

## Project Structure

```
.
├── backend/
│   ├── app.py               # Flask app factory + route wiring
│   ├── routes/              # Tasks, calendar, sessions, stats, galaxy, music, etc.
│   ├── utils/               # Mongo connection + celestial body generator
│   ├── seeds/               # Data seeding scripts
│   └── ...                  # (no frontend assets here)
├── frontend/
│   ├── templates/           # index.html (OG Galaxy UI)
│   └── static/              # CSS, JS, media
├── backend/seeds/           # Seed scripts for moods, tasks, demo stars
├── requirements.txt
├── Procfile
└── .env.example
```

## Prerequisites

- Python 3.11+ (recommended)
- MongoDB Atlas cluster + connection string (SRV URI)

## 1. Install Dependencies

```bash
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

## 2. Environment Variables

Copy `.env.example` to `.env` and fill in your Atlas URI:

```bash
cp .env.example .env
```

```
```
MONGODB_URI="mongodb+srv://<user>:<password>@cluster0.example.mongodb.net/?retryWrites=true&w=majority"
```

> **Note**: Set `MONGODB_URI` before running the app. If not set, it defaults to `mongodb://localhost:27017/codegalaxy` for local development.

No Spotify keys are required now—the music player serves local WAV files located under `backend/static/media`.

### Audio Files
- **Location**: `backend/static/media` (default pack) and `backend/static/audio/lofi` (Lofi pack).
- **Format**: MP3 or WAV.
- **Size**: Recommended 1-3MB per file, ~128kbps.
- **Fallback**: You can provide multiple files per mood in `audioController.js` (e.g., `['file1.mp3', 'file2.mp3']`). The player will try them in order.

## 3. Run the Backend (serves frontend too)

```bash
python -m backend.app
# Visit http://localhost:3000/
```

The Flask app serves `backend/templates/index.html` along with all CSS/JS, so open the site via the local server rather than double-clicking the HTML file.

## 4. Seed Demo Data (optional but recommended)

Use the provided scripts to populate moods, demo tasks, and celestial objects:

```bash
python -m backend.seeds.seed_moods
python -m backend.seeds.seed_tasks
python -m backend.seeds.seed_demo_stars
```

These scripts write to the same database configured via `MONGODB_URI`.

## 5. Available APIs

| Endpoint | Method(s) | Description |
|----------|-----------|-------------|
| `/api/tasks` | GET, POST | List or create tasks |
| `/api/tasks/<id>` | PUT, DELETE | Update/delete task |
| `/api/tasks/<id>/complete` | PATCH | Mark completed |
| `/sessions` | POST | Save a focus session + create celestial body |
| `/sessions/today` | GET | Today’s sessions |
| `/api/calendar` | GET, POST | Calendar events |
| `/api/calendar/<id>` | DELETE | Delete event |
| `/api/galaxy/data` | GET | Celestial objects for canvas |
| `/stats/summary` | GET | Totals for dashboard |
| `/stats/streak` | GET | Current streak |
| `/stats/weekly` | GET | Weekly minutes |
| `/moods` | GET | Mood list (for timer chips) |
| `/moods/<mood>/playlist` | GET | Placeholder metadata |
| `/api/music` | GET | Local WAV playlist metadata |
| `/api/galaxy/reset` | POST | Delete all celestial objects for the demo user |
| `/api/galaxy/layout` | GET, POST | Fetch or persist custom galaxy layouts |
| `/api/constellations` | GET | Preset constellation positions |
| `/status` | GET | DB health check |

All routes assume a single demo user (`demo-user`) so the experience works without auth.

## 6. Local Music Player

`backend/static/media` contains three small WAV loops generated offline:

- Nebula Drift
- Starlight Echoes
- Comet Trail

The `/api/music` route returns these files, and `static/js/music.js` plays them through the existing audio player. You can add more WAV/MP3 files to the same folder and adjust `backend/routes/music.py` accordingly.

## 7. Deployment

- Use the same `.env` variables on your hosting provider (Render, Railway, etc.).
- `Procfile` already defines `web: gunicorn backend.app:app`.

## Troubleshooting

- **No CSS when double-clicking `index.html`**: The frontend is in `/frontend`, but you must serve it through Flask (`python -m backend.app`) because the HTML references `/static/...` via `url_for`.
- **Mongo errors**: Verify `MONGODB_URI` is correct and that your IP is allowed in Atlas network access.
- **Galaxy is empty**: Run the seed scripts above or complete a focus session via the timer panel to generate stars.

## Developer Notes (Galaxy Debugging)

- **Reset button** inside the galaxy panel calls `/api/galaxy/reset`. Use it to clear out celestial objects instantly when iterating on layouts.
- **Constellation presets / drag & drop**: apply a preset, drag stars directly on the canvas (unlock the pattern), then click “Save Layout” which POSTs to `/api/galaxy/layout`. “Revert” re-fetches the last saved layout from the same endpoint.
- **API smoke test**: open the browser console and run `window.GalaxyBG.addStarAt(50, 20)` or `window.resetGalaxy()` to verify the new helpers are wired before integrating backend automation.

Happy galaxy building! 🚀


