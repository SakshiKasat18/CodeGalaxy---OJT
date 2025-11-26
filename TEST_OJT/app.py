from flask import Flask, render_template, jsonify, request
from database import get_db, init_db, add_galaxy_object
from datetime import datetime
from typing import Any
import os

app = Flask(__name__)

# Initialize database on first run
if not os.path.exists('codegalaxy.db'):
    init_db()

# Hardcoded user ID (no login required)
CURRENT_USER_ID = 1

@app.route('/')
def index():
    """Main dashboard"""
    return render_template('index.html')

# ==================== TASK ENDPOINTS ====================

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    """Get all tasks for current user"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Optional filters
    category = request.args.get('category')
    completed = request.args.get('completed')
    
    query = 'SELECT * FROM tasks WHERE user_id = ?'
    params: list[Any] = [CURRENT_USER_ID]
    
    if category and category != 'all':
        query += ' AND category = ?'
        params.append(category)
    
    if completed is not None:
        query += ' AND completed = ?'
        params.append(1 if completed == 'true' else 0)
    
    query += ' ORDER BY date DESC, created_at DESC'
    
    cursor.execute(query, params)
    tasks = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify(tasks)

@app.route('/api/tasks', methods=['POST'])
def create_task():
    """Create a new task"""
    data = request.get_json(silent=True) or {}
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO tasks (user_id, title, description, date, priority, category, completed)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (
        CURRENT_USER_ID,
        data.get('title'),
        data.get('description', ''),
        data.get('date'),
        data.get('priority', 'Medium'),
        data.get('category', 'Personal'),
        data.get('completed', 0)
    ))
    
    task_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return jsonify({'id': task_id, 'message': 'Task created successfully'}), 201

@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    """Update a task"""
    data = request.get_json(silent=True) or {}
    conn = get_db()
    cursor = conn.cursor()
    
    # Check if task is being marked as completed
    cursor.execute('SELECT completed FROM tasks WHERE id = ?', (task_id,))
    old_task = cursor.fetchone()
    was_completed = old_task['completed'] if old_task else False
    is_now_completed = data.get('completed', False)
    
    # Update task
    cursor.execute('''
        UPDATE tasks 
        SET title = ?, description = ?, date = ?, priority = ?, category = ?, completed = ?
        WHERE id = ? AND user_id = ?
    ''', (
        data.get('title'),
        data.get('description', ''),
        data.get('date'),
        data.get('priority', 'Medium'),
        data.get('category', 'Personal'),
        1 if is_now_completed else 0,
        task_id,
        CURRENT_USER_ID
    ))
    
    # If task just got completed, add a galaxy object
    if not was_completed and is_now_completed:
        add_galaxy_object(cursor, CURRENT_USER_ID, task_id)
    
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Task updated successfully'})

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    """Delete a task"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM tasks WHERE id = ? AND user_id = ?', (task_id, CURRENT_USER_ID))
    
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Task deleted successfully'})

# ==================== CALENDAR ENDPOINTS ====================

@app.route('/api/calendar', methods=['GET'])
def get_calendar_events():
    """Get all calendar events for current user"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Optional date filter
    month = request.args.get('month')
    year = request.args.get('year')
    
    query = 'SELECT * FROM calendar_events WHERE user_id = ?'
    params: list[Any] = [CURRENT_USER_ID]
    
    if month and year:
        query += ' AND strftime("%m", date) = ? AND strftime("%Y", date) = ?'
        params.extend([month.zfill(2), year])
    
    query += ' ORDER BY date ASC, time ASC'
    
    cursor.execute(query, params)
    events = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify(events)

@app.route('/api/calendar', methods=['POST'])
def create_calendar_event():
    """Create a new calendar event"""
    data = request.get_json(silent=True) or {}
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO calendar_events (user_id, title, date, time, category)
        VALUES (?, ?, ?, ?, ?)
    ''', (
        CURRENT_USER_ID,
        data.get('title'),
        data.get('date'),
        data.get('time', '00:00'),
        data.get('category', 'Personal')
    ))
    
    event_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return jsonify({'id': event_id, 'message': 'Event created successfully'}), 201

@app.route('/api/calendar/<int:event_id>', methods=['DELETE'])
def delete_calendar_event(event_id):
    """Delete a calendar event"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('DELETE FROM calendar_events WHERE id = ? AND user_id = ?', (event_id, CURRENT_USER_ID))
    
    conn.commit()
    conn.close()
    
    return jsonify({'message': 'Event deleted successfully'})

# ==================== GALAXY ENDPOINTS ====================

@app.route('/api/galaxy', methods=['GET'])
def get_galaxy_objects():
    """Get all galaxy objects for current user"""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute('SELECT * FROM galaxy_objects WHERE user_id = ? ORDER BY created_at ASC', (CURRENT_USER_ID,))
    objects = [dict(row) for row in cursor.fetchall()]
    conn.close()
    
    return jsonify(objects)

# ==================== MUSIC ENDPOINTS ====================

@app.route('/api/music', methods=['GET'])
def get_music_tracks():
    """Get music tracks - PLACEHOLDER for future API integration"""
    # TODO: Replace with real music API integration
    # Example APIs: Spotify, SoundCloud, Free Music Archive
    # Add your API key and endpoint here
    
    placeholder_tracks = [
        {
            'id': 1,
            'title': 'Lofi Study Beat 1',
            'artist': 'Chill Beats',
            'duration': '3:45',
            'url': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'  # Free sample
        },
        {
            'id': 2,
            'title': 'Focus Flow',
            'artist': 'Ambient Sounds',
            'duration': '4:20',
            'url': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
        },
        {
            'id': 3,
            'title': 'Peaceful Piano',
            'artist': 'Relaxing Music',
            'duration': '5:10',
            'url': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
        },
        {
            'id': 4,
            'title': 'Deep Work',
            'artist': 'Productivity Beats',
            'duration': '3:55',
            'url': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3'
        },
        {
            'id': 5,
            'title': 'Coding Zone',
            'artist': 'Tech Vibes',
            'duration': '4:30',
            'url': 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3'
        }
    ]
    
    return jsonify(placeholder_tracks)

if __name__ == '__main__':
    app.run(debug=True, port=3000)
