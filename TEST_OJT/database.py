import sqlite3
from datetime import datetime
import random

DATABASE = 'codegalaxy.db'

def get_db():
    """Get database connection"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Initialize database with schema and hardcoded user"""
    conn = get_db()
    cursor = conn.cursor()
    
    # Create users table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create tasks table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            date DATE,
            priority TEXT DEFAULT 'Medium',
            category TEXT DEFAULT 'Personal',
            completed BOOLEAN DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Create calendar_events table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS calendar_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            date DATE NOT NULL,
            time TIME,
            category TEXT DEFAULT 'Personal',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Create galaxy_objects table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS galaxy_objects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            position_x REAL NOT NULL,
            position_y REAL NOT NULL,
            position_z REAL NOT NULL,
            color TEXT NOT NULL,
            size REAL NOT NULL,
            task_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (task_id) REFERENCES tasks (id)
        )
    ''')
    
    # Check if hardcoded user exists
    cursor.execute('SELECT id FROM users WHERE id = 1')
    if not cursor.fetchone():
        cursor.execute('INSERT INTO users (id, username) VALUES (1, "CodeGalaxy User")')
        
        # Add some sample tasks for demo
        sample_tasks = [
            ('Write blog post', 'Complete article on productivity', '2024-01-25', 'High', 'Work', 0),
            ('Manage Finance', 'Review monthly budget', '2024-02-01', 'High', 'Personal', 0),
            ('Edit Website', 'Update portfolio page', '2024-02-06', 'Medium', 'Work', 0),
            ('Create Social Content', 'Design Instagram posts', '2024-01-30', 'Medium', 'Work', 0),
            ('Workout routine', 'Morning exercise', '2024-01-23', 'High', 'Life', 1),
            ('Read book', 'Finish current chapter', '2024-01-24', 'Low', 'Personal', 1),
        ]
        
        for task in sample_tasks:
            cursor.execute('''
                INSERT INTO tasks (user_id, title, description, date, priority, category, completed)
                VALUES (1, ?, ?, ?, ?, ?, ?)
            ''', task)
        
        # Add sample calendar events
        sample_events = [
            ('Team Meeting', '2024-01-29', '14:00', 'Work'),
            ('Gym Session', '2024-01-30', '07:00', 'Life'),
            ('Project Deadline', '2024-02-05', '23:59', 'Work'),
            ('Doctor Appointment', '2024-02-08', '10:30', 'Personal'),
        ]
        
        for event in sample_events:
            cursor.execute('''
                INSERT INTO calendar_events (user_id, title, date, time, category)
                VALUES (1, ?, ?, ?, ?)
            ''', event)
        
        # Add initial galaxy objects for completed tasks
        completed_task_ids = [5, 6]  # IDs of completed tasks
        for task_id in completed_task_ids:
            add_galaxy_object(cursor, 1, task_id)
    
    conn.commit()
    conn.close()
    print("Database initialized successfully!")

def add_galaxy_object(cursor, user_id, task_id=None):
    """Add a new star or planet to the galaxy"""
    obj_type = random.choice(['star', 'star', 'star', 'planet'])  # More stars than planets
    
    # Random position in 3D space
    position_x = random.uniform(-500, 500)
    position_y = random.uniform(-500, 500)
    position_z = random.uniform(-500, 500)
    
    # Color based on type
    if obj_type == 'star':
        colors = ['#FFD700', '#FFA500', '#FF6347', '#87CEEB', '#FFFFFF']
        size = random.uniform(1, 3)
    else:
        colors = ['#4169E1', '#32CD32', '#FF69B4', '#9370DB', '#FF8C00']
        size = random.uniform(3, 8)
    
    color = random.choice(colors)
    
    cursor.execute('''
        INSERT INTO galaxy_objects (user_id, type, position_x, position_y, position_z, color, size, task_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ''', (user_id, obj_type, position_x, position_y, position_z, color, size, task_id))

if __name__ == '__main__':
    init_db()
