"""Counter management routes."""
from flask import Blueprint, request, jsonify
from db import query, execute
from auth import role_required

counters_bp = Blueprint('counters', __name__)

def serialize_counter(c):
    return {
        'id': c['id'],
        'name': c['name'],
        'service_id': c.get('service_id'),
        'service_name': c.get('service_name'),
        'staff_id': c.get('staff_id'),
        'staff_name': c.get('staff_name'),
        'status': c['status'],
    }

@counters_bp.route('/counters', methods=['GET'])
def list_counters():
    rows = query('''
        SELECT c.id, c.name, c.service_id, c.staff_id, c.status,
               s.name AS service_name,
               u.name AS staff_name
        FROM counters c
        LEFT JOIN services s ON c.service_id = s.id
        LEFT JOIN users u ON c.staff_id = u.id
        ORDER BY c.name
    ''', fetch='all')
    return jsonify({'counters': [serialize_counter(c) for c in rows]})

@counters_bp.route('/counters', methods=['POST'])
@role_required('admin')
def create_counter():
    data = request.get_json(silent=True) or {}
    name = (data.get('name') or '').strip()
    service_id = data.get('service_id') or None
    staff_id = data.get('staff_id') or None
    status = data.get('status', 'active')

    if not name:
        return jsonify({'message': 'Counter name is required.'}), 400
    if status not in ('active', 'inactive'):
        return jsonify({'message': 'Invalid status.'}), 400

    if service_id:
        service_id = int(service_id)
    if staff_id:
        staff_id = int(staff_id)

    lastrowid, _ = execute(
        'INSERT INTO counters (name, service_id, staff_id, status) VALUES (%s, %s, %s, %s)',
        (name, service_id, staff_id, status)
    )
    if staff_id:
        execute('UPDATE users SET counter_id = %s WHERE id = %s', (lastrowid, staff_id))

    row = query('''
        SELECT c.id, c.name, c.service_id, c.staff_id, c.status,
               s.name AS service_name, u.name AS staff_name
        FROM counters c
        LEFT JOIN services s ON c.service_id = s.id
        LEFT JOIN users u ON c.staff_id = u.id
        WHERE c.id = %s
    ''', (lastrowid,), fetch='one')
    return jsonify({'counter': serialize_counter(row)}), 201

@counters_bp.route('/counters/<int:counter_id>', methods=['PUT'])
@role_required('admin')
def update_counter(counter_id):
    data = request.get_json(silent=True) or {}
    existing = query('SELECT id, staff_id FROM counters WHERE id = %s', (counter_id,), fetch='one')
    if not existing:
        return jsonify({'message': 'Counter not found.'}), 404

    name = (data.get('name') or '').strip()
    service_id = data.get('service_id')
    staff_id = data.get('staff_id')
    status = data.get('status')

    if name:
        execute('UPDATE counters SET name = %s WHERE id = %s', (name, counter_id))
    if service_id is not None:
        if service_id == '' or service_id == 0:
            execute('UPDATE counters SET service_id = NULL WHERE id = %s', (counter_id,))
        else:
            execute('UPDATE counters SET service_id = %s WHERE id = %s', (int(service_id), counter_id))
    if staff_id is not None:
        if staff_id == '' or staff_id == 0:
            execute('UPDATE counters SET staff_id = NULL WHERE id = %s', (counter_id,))
        else:
            staff_id = int(staff_id)
            execute('UPDATE counters SET staff_id = %s WHERE id = %s', (staff_id, counter_id))
            execute('UPDATE users SET counter_id = %s WHERE id = %s', (counter_id, staff_id))
    if status and status in ('active', 'inactive'):
        execute('UPDATE counters SET status = %s WHERE id = %s', (status, counter_id))

    row = query('''
        SELECT c.id, c.name, c.service_id, c.staff_id, c.status,
               s.name AS service_name, u.name AS staff_name
        FROM counters c
        LEFT JOIN services s ON c.service_id = s.id
        LEFT JOIN users u ON c.staff_id = u.id
        WHERE c.id = %s
    ''', (counter_id,), fetch='one')
    return jsonify({'counter': serialize_counter(row)})

@counters_bp.route('/counters/<int:counter_id>', methods=['DELETE'])
@role_required('admin')
def delete_counter(counter_id):
    existing = query('SELECT id FROM counters WHERE id = %s', (counter_id,), fetch='one')
    if not existing:
        return jsonify({'message': 'Counter not found.'}), 404
    execute('UPDATE users SET counter_id = NULL WHERE counter_id = %s', (counter_id,))
    execute('DELETE FROM counters WHERE id = %s', (counter_id,))
    return jsonify({'message': 'Counter deleted successfully.'})
