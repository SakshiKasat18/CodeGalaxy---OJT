# 🌌 **CodeGalaxy**

**Where every small step leaves a star behind.
A galaxy shaped by your discipline.**
**OJT Project — Sakshi & Aryan**



## ⭐ About CodeGalaxy

**CodeGalaxy is our full-stack focus & productivity system**, built to transform everyday study/work sessions into a cosmic visual experience.

We designed it because normal to-do list apps felt dull, repetitive, and not motivating enough.
So we built something better — a dashboard where:

* Every completed **focus session** adds a **golden star**
* Tasks sit inside a clean calendar
* Progress feels visual, alive, rewarding
* Your galaxy grows with you

This is *our* app.
This is how *we* used our creativity, engineering skills, and a LOT of debugging to bring CodeGalaxy to life.



# 🚀 What CodeGalaxy Does

When you open the app, you get one powerful dashboard:

### ✔ Focus Timer

You pick a mood → start a focus session → when it ends, a **golden star** appears in your personal galaxy.

### ✔ Galaxy Canvas

Stars represent your discipline.
Drag them, arrange them, save layouts, apply constellation presets — all without losing existing stars.

### ✔ Tasks + Calendar

Add tasks with **date + time**, view them on the calendar, and use the side panel to see everything for a specific day.

### ✔ Upcoming Panel

Automatically shows tasks due soon → helps you plan smarter.

### ✔ Music Player

Local audio tracks play during focus (small, stable files).
There’s also a Spotify button if you want playlists without using APIs.

### ✔ Reset & Stats

Reset the galaxy, reset stats, check streaks, weekly focus minutes, total sessions.

Everything works under our demo user setup so evaluators can try it instantly — no login needed.



# 🗂️ Project Structure (simple explanation)

```
backend/
    app.py               → Flask app
    routes/              → APIs (tasks, calendar, sessions, galaxy)
    utils/               → MongoDB connector, helpers
    seeds/               → Optional demo data

frontend/
    templates/           → index.html (main UI)
    static/              → CSS, JS, media, galaxy scripts

requirements.txt
Procfile
.env.example
```

We decided to let Flask serve both frontend + backend, so the app runs as one clean service.



# 🔧 How to Run CodeGalaxy Locally

### 1. Install dependencies

```
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure MongoDB

Copy `.env.example` → `.env` and add your Atlas URI:

```
MONGODB_URI="mongodb+srv://USERNAME:PASSWORD@cluster.mongodb.net/?retryWrites=true&w=majority"
SECRET_KEY="anyrandomstring"
```

### 3. Start the app

```
python -m backend.app
```

Visit:
👉 **[http://localhost:3000](http://localhost:3000)**



# 🎧 Music Setup

All music is local — no API required.
Add or remove MP3/WAV files in:

```
backend/static/media
```

The app picks them automatically.

Spotify button opens your curated playlists in a new tab.

---

# 🌠 Galaxy Features (Our Favourite Part)

### ⭐ Focus session → Golden star

Stars symbolize discipline.

### ⭐ Constellation system (with safe merge)

Apply a constellation → **no stars disappear.**
We fixed the old overwrite bug.

### ⭐ Drag & Drop

Move stars anywhere, save layout, revert layout.

### ⭐ Reset

Starts your galaxy fresh.



# 📅 Calendar & Tasks

* Add tasks with **date + time**
* Multiple tasks per day
* Clicking a date opens a side panel with all tasks
* Checkbox to mark tasks done
* Upcoming section auto-updates

---

# 🌍 Deploying CodeGalaxy

We recommend **Render** for hosting:

### Build

```
pip install -r requirements.txt
```

### Start

```
gunicorn backend.app:app
```

### Environment Vars

```
MONGODB_URI=<your uri>
SECRET_KEY=<your key>
```

Whenever main branch updates → Render redeploys.



# 🧪 Troubleshooting (Fast Guide)

### MongoDB not connecting?

Check:

* correct username + password
* IP whitelist = 0.0.0.0/0
* run:

```
client.admin.command("ping")
```

### Galaxy empty?

Run seed scripts or complete a focus session.

### Music not playing?

Use small MP3/WAV files.

### CSS missing?

Open app via Flask, not static HTML.



# 🧑‍💻 Built By

### ⭐ **Sakshi Kasat**

Backend Integration • Database • Focus Logic • Galaxy System • Deployment • Debugging • Full App Integration

### ⭐ **Aryan**

Frontend UI • Canvas Rendering • Constellation System • Animations • Layout • Interactions

Together, we shaped CodeGalaxy into a clean, aesthetic, fully working full-stack product for our OJT project.



# ✨ Footer

**CodeGalaxy — where procrastination ends and the Big Bang begins
OJT Project — Sakshi & Aryan**

