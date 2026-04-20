"""
Pixie Portal Backend
Handles accounts, journal entries, and game scores.
"""

from flask import Flask, request, jsonify, send_from_directory, session
from flask_cors import CORS
import sqlite3
import bcrypt
import os
import json
import time
import secrets

app = Flask(__name__, static_folder='.', static_url_path='')
app.secret_key = secrets.token_hex(32)
CORS(app, supports_credentials=True)

DB = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'pixie_portal.db')


# ============================================================
# DATABASE
# ============================================================

def get_db():
    conn = sqlite3.connect(DB)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.executescript('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            display_name TEXT,
            bio TEXT DEFAULT '',
            avatar_emoji TEXT DEFAULT '✦',
            created_at REAL
        );
        CREATE TABLE IF NOT EXISTS journal_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT,
            content TEXT,
            mood TEXT DEFAULT 'neutral',
            created_at REAL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            game TEXT NOT NULL,
            score INTEGER NOT NULL,
            details TEXT DEFAULT '{}',
            created_at REAL,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );
    ''')
    conn.commit()
    conn.close()

init_db()


# ============================================================
# AUTH ROUTES
# ============================================================

@app.route('/api/signup', methods=['POST'])
def signup():
    data = request.json
    username = data.get('username', '').strip().lower()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    display_name = data.get('display_name', username)

    if not username or not email or not password:
        return jsonify({'error': 'All fields required'}), 400
    if len(username) < 3:
        return jsonify({'error': 'Username must be at least 3 characters'}), 400
    if len(password) < 4:
        return jsonify({'error': 'Password must be at least 4 characters'}), 400

    password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    try:
        conn = get_db()
        conn.execute(
            'INSERT INTO users (username, email, password_hash, display_name, created_at) VALUES (?, ?, ?, ?, ?)',
            (username, email, password_hash, display_name, time.time())
        )
        conn.commit()
        user_id = conn.execute('SELECT id FROM users WHERE username = ?', (username,)).fetchone()['id']
        conn.close()

        session['user_id'] = user_id
        return jsonify({'success': True, 'user': {'id': user_id, 'username': username, 'display_name': display_name, 'avatar_emoji': '✦'}})
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Username or email already taken'}), 400


@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username', '').strip().lower()
    password = data.get('password', '')

    conn = get_db()
    user = conn.execute('SELECT * FROM users WHERE username = ? OR email = ?', (username, username)).fetchone()
    conn.close()

    if not user or not bcrypt.checkpw(password.encode(), user['password_hash'].encode()):
        return jsonify({'error': 'Invalid username or password'}), 401

    session['user_id'] = user['id']
    return jsonify({'success': True, 'user': {
        'id': user['id'],
        'username': user['username'],
        'display_name': user['display_name'],
        'avatar_emoji': user['avatar_emoji'],
        'bio': user['bio'],
    }})


@app.route('/api/logout', methods=['POST'])
def logout():
    session.pop('user_id', None)
    return jsonify({'success': True})


@app.route('/api/me', methods=['GET'])
def me():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'user': None})
    conn = get_db()
    user = conn.execute('SELECT id, username, display_name, avatar_emoji, bio FROM users WHERE id = ?', (user_id,)).fetchone()
    conn.close()
    if not user:
        return jsonify({'user': None})
    return jsonify({'user': dict(user)})


@app.route('/api/profile', methods=['PUT'])
def update_profile():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not logged in'}), 401
    data = request.json
    conn = get_db()
    conn.execute('UPDATE users SET display_name=?, bio=?, avatar_emoji=? WHERE id=?',
                 (data.get('display_name', ''), data.get('bio', ''), data.get('avatar_emoji', '✦'), user_id))
    conn.commit()
    conn.close()
    return jsonify({'success': True})


# ============================================================
# JOURNAL ROUTES
# ============================================================

@app.route('/api/journal', methods=['GET'])
def get_journal():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not logged in'}), 401
    conn = get_db()
    entries = conn.execute(
        'SELECT * FROM journal_entries WHERE user_id = ? ORDER BY created_at DESC',
        (user_id,)
    ).fetchall()
    conn.close()
    return jsonify({'entries': [dict(e) for e in entries]})


@app.route('/api/journal', methods=['POST'])
def add_journal():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not logged in'}), 401
    data = request.json
    conn = get_db()
    conn.execute(
        'INSERT INTO journal_entries (user_id, title, content, mood, created_at) VALUES (?, ?, ?, ?, ?)',
        (user_id, data.get('title', ''), data.get('content', ''), data.get('mood', 'neutral'), time.time())
    )
    conn.commit()
    conn.close()
    return jsonify({'success': True})


@app.route('/api/journal/<int:entry_id>', methods=['DELETE'])
def delete_journal(entry_id):
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not logged in'}), 401
    conn = get_db()
    conn.execute('DELETE FROM journal_entries WHERE id = ? AND user_id = ?', (entry_id, user_id))
    conn.commit()
    conn.close()
    return jsonify({'success': True})


# ============================================================
# SCORES ROUTES
# ============================================================

@app.route('/api/scores', methods=['GET'])
def get_scores():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not logged in'}), 401
    conn = get_db()
    scores = conn.execute(
        'SELECT * FROM scores WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
        (user_id,)
    ).fetchall()
    conn.close()
    return jsonify({'scores': [dict(s) for s in scores]})


@app.route('/api/scores', methods=['POST'])
def add_score():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Not logged in'}), 401
    data = request.json
    conn = get_db()
    conn.execute(
        'INSERT INTO scores (user_id, game, score, details, created_at) VALUES (?, ?, ?, ?, ?)',
        (user_id, data.get('game', ''), data.get('score', 0),
         json.dumps(data.get('details', {})), time.time())
    )
    conn.commit()
    conn.close()
    return jsonify({'success': True})


@app.route('/api/leaderboard/<game>', methods=['GET'])
def leaderboard(game):
    conn = get_db()
    scores = conn.execute('''
        SELECT s.score, s.created_at, u.display_name, u.avatar_emoji
        FROM scores s JOIN users u ON s.user_id = u.id
        WHERE s.game = ?
        ORDER BY s.score DESC LIMIT 20
    ''', (game,)).fetchall()
    conn.close()
    return jsonify({'leaderboard': [dict(s) for s in scores]})


# ============================================================
# SERVE WEBSITE
# ============================================================

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')


if __name__ == '__main__':
    print("=" * 50)
    print("  ✦ Pixie Portal Server ✦")
    print("=" * 50)
    print()
    print("  http://localhost:5000")
    print()
    print("  Ctrl+C to stop")
    print()
    app.run(host='0.0.0.0', port=5000, debug=True)
