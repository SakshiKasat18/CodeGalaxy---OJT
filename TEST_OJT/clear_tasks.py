import sqlite3
import os

def clear_tasks():
    db_path = 'codegalaxy.db'
    if not os.path.exists(db_path):
        print(f"Database file {db_path} not found.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        cursor.execute('DELETE FROM tasks')
        conn.commit()
        print(f"Successfully deleted {cursor.rowcount} tasks.")
    except sqlite3.Error as e:
        print(f"An error occurred: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    clear_tasks()
