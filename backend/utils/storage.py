import sqlite3
import os
from typing import List


class Storage:
    def __init__(self, db_path: str = "./backend/data/mood_history.db"):
        self.db_path = db_path
        os.makedirs(os.path.dirname(db_path), exist_ok=True)
        self._init_db()

    def _init_db(self):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute(
            """
        CREATE TABLE IF NOT EXISTS entries (
            id TEXT PRIMARY KEY,
            entry_type TEXT,
            dominant TEXT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """
        )
        conn.commit()
        conn.close()

    def save_entry(self, entry: dict):
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute("INSERT OR REPLACE INTO entries (id, entry_type, dominant) VALUES (?, ?, ?)",
                  (entry.get("id"), entry.get("type"), entry.get("dominant")))
        conn.commit()
        conn.close()

    def get_entries(self, limit: int = 100) -> List[dict]:
        conn = sqlite3.connect(self.db_path)
        c = conn.cursor()
        c.execute("SELECT id, entry_type, dominant, timestamp FROM entries ORDER BY timestamp DESC LIMIT ?", (limit,))
        rows = c.fetchall()
        conn.close()
        return [{"id": r[0], "type": r[1], "dominant": r[2], "timestamp": r[3]} for r in rows]
