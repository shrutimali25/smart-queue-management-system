"""User management routes (admin only)."""
from flask import Blueprint, request, jsonify, g
from db import query, execute
from auth import role_required

users_bp = Blueprint('users', __name__)

def serialize_user(u):
    return {
        'id': u['id'],
        'name': u['name'],
        'email': u['email'],
        'role': u['role'],
        'status': u['status'],
        'counter_id': u.get('counter_id'),
        'counter_name': u.get('counter_name'),
    }

@users_bp.route('/users', methods=['GET'])
@role_required('admin')
def list_users():
    role = request.args.get('role', '')
    sql = '''
        SELECT u.id, u.name, u.email, u.role, u.status, u.counter_id,
               c.name AS counter_name
        FROM users u
        LEFT JOIN counters c ON u.counter_id = c.id
    '''
    params = ()
    if role:
        sql += ' WHERE u.role = %s'
        params = (role,)
    sql += ' ORDER BY u.created_at DESC'
    rows = query(sql, params, fetch='all')
    return jsonify({'users': [serialize_user(u) for u in rows]})

@users_bp.route('/users/<int:user_id>', methods=['GET'])
@role_required('admin')
def get_user(user_id):
    row = query('''
        SELECT u.id, u.name, u.email, u.role, u.status, u.counter_id,
               c.name AS counter_name
        FROM users u
        LEFT JOIN counters c ON u.counter_id = c.id
        WHERE u.id = %s
    ''', (user_id,), fetch='one')
    if not row:
        return jsonify({'message': 'User not found.'}), 404
    return jsonify({'user': serialize_user(row)})

@users_bp.route('/users/<int:user_id>', methods=['PUT'])
@role_required('admin')
def update_user(user_id):
    data = request.get_json(silent=True) or {}
    existing = query('SELECT id FROM users WHERE id = %s', (user_id,), fetch='one')
    if not existing:
        return jsonify({'message': 'User not found.'}), 404

    name = (data.get('name') or '').strip()
    role = data.get('role')
    status = data.get('status')
    counter_id = data.get('counter_id')

    if name:
        execute('UPDATE users SET name = %s WHERE id = %s', (name, user_id))
    if role and role in ('user', 'staff', 'admin'):
        execute('UPDATE users SET role = %s WHERE id = %s', (role, user_id))
    if status and status in ('active', 'inactive'):
        execute('UPDATE users SET status = %s WHERE id = %s', (status, user_id))
    if counter_id is not None:
        if counter_id == '' or counter_id == 0:
            execute('UPDATE users SET counter_id = NULL WHERE id = %s', (user_id,))
        else:
            execute('UPDATE users SET counter_id = %s WHERE id = %s', (int(counter_id), user_id))

    row = query('''
        SELECT u.id, u.name, u.email, u.role, u.status, u.counter_id,
               c.name AS counter_name
        FROM users u
        LEFT JOIN counters c ON u.counter_id = c.id
        WHERE u.id = %s
    ''', (user_id,), fetch='one')
    return jsonify({'user': serialize_user(row)})

@users_bp.route('/users/<int:user_id>', methods=['DELETE'])
@role_required('admin')
def delete_user(user_id):
    if user_id == g.current_user['id']:
        return jsonify({'message': 'You cannot delete your own account.'}), 400
    existing = query('SELECT id FROM users WHERE id = %s', (user_id,), fetch='one')
    if not existing:
        return jsonify({'message': 'User not found.'}), 404
    execute('DELETE FROM users WHERE id = %s', (user_id,))
    return jsonify({'message': 'User deleted successfully.'})
