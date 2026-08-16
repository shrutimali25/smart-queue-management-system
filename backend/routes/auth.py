"""Authentication routes: register, login, logout, profile."""
import bcrypt
from flask import Blueprint, request, jsonify, g
from db import query, execute
from auth import token_required
from jwt_utils import encode_token

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json(silent=True) or {}
    name = (data.get('name') or '').strip()
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    if not name or len(name) < 2:
        return jsonify({'message': 'Name must be at least 2 characters.'}), 400
    if not email or '@' not in email:
        return jsonify({'message': 'A valid email is required.'}), 400
    if len(password) < 6:
        return jsonify({'message': 'Password must be at least 6 characters.'}), 400

    existing = query('SELECT id FROM users WHERE email = %s', (email,), fetch='one')
    if existing:
        return jsonify({'message': 'An account with this email already exists.'}), 409

    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    lastrowid, _ = execute(
        'INSERT INTO users (name, email, password_hash, role, status) VALUES (%s, %s, %s, %s, %s)',
        (name, email, password_hash, 'user', 'active')
    )
    return jsonify({'message': 'Account created successfully.', 'user_id': lastrowid}), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    if not email or not password:
        return jsonify({'message': 'Email and password are required.'}), 400

    user = query('SELECT id, name, email, password_hash, role, status, counter_id FROM users WHERE email = %s', (email,), fetch='one')
    if not user or not bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
        return jsonify({'message': 'Invalid email or password.'}), 401
    if user['status'] != 'active':
        return jsonify({'message': 'Account is inactive. Contact an administrator.'}), 403

    token = encode_token(user['id'], user['role'])
    return jsonify({
        'token': token,
        'user': {
            'id': user['id'],
            'name': user['name'],
            'email': user['email'],
            'role': user['role'],
            'status': user['status'],
            'counter_id': user['counter_id'],
        }
    })


@auth_bp.route('/logout', methods=['POST'])
@token_required
def logout():
    return jsonify({'message': 'Logged out successfully.'})


@auth_bp.route('/profile', methods=['GET'])
@token_required
def get_profile():
    u = g.current_user
    counter_name = None
    if u['counter_id']:
        row = query('SELECT name FROM counters WHERE id = %s', (u['counter_id'],), fetch='one')
        if row:
            counter_name = row['name']
    return jsonify({
        'user': {
            'id': u['id'],
            'name': u['name'],
            'email': u['email'],
            'role': u['role'],
            'status': u['status'],
            'counter_id': u['counter_id'],
            'counter_name': counter_name,
        }
    })


@auth_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile():
    data = request.get_json(silent=True) or {}
    u = g.current_user
    name = (data.get('name') or '').strip()
    current_password = data.get('current_password')
    new_password = data.get('new_password')

    if name:
        if len(name) < 2:
            return jsonify({'message': 'Name must be at least 2 characters.'}), 400
        execute('UPDATE users SET name = %s WHERE id = %s', (name, u['id']))

    if new_password:
        if len(new_password) < 6:
            return jsonify({'message': 'New password must be at least 6 characters.'}), 400
        if not current_password:
            return jsonify({'message': 'Current password is required to change password.'}), 400
        user_row = query('SELECT password_hash FROM users WHERE id = %s', (u['id'],), fetch='one')
        if not user_row or not bcrypt.checkpw(current_password.encode('utf-8'), user_row['password_hash'].encode('utf-8')):
            return jsonify({'message': 'Current password is incorrect.'}), 400
        password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        execute('UPDATE users SET password_hash = %s WHERE id = %s', (password_hash, u['id']))

    updated = query('SELECT id, name, email, role, status, counter_id FROM users WHERE id = %s', (u['id'],), fetch='one')
    return jsonify({'user': updated})
