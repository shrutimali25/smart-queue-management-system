"""Service management routes."""
from flask import Blueprint, request, jsonify
from db import query, execute
from auth import role_required

services_bp = Blueprint('services', __name__)

def validate_service_fields(data, require_all=False):
    """Validate service input fields. Returns (error_message, status_code) or None."""
    name = (data.get('name') or '').strip()
    token_prefix = (data.get('token_prefix') or '').strip()
    avg_service_time = data.get('avg_service_time')

    name_provided = data.get('name') is not None
    prefix_provided = data.get('token_prefix') is not None
    time_provided = avg_service_time is not None

    if require_all or name_provided:
        if not name:
            return ('Service name is required.', 400)
        if len(name) < 2:
            return ('Service name must be at least 2 characters long.', 400)
        if len(name) > 100:
            return ('Service name must not exceed 100 characters.', 400)

    if require_all or prefix_provided:
        if not token_prefix:
            return ('Token prefix is required.', 400)
        if len(token_prefix) > 10:
            return ('Token prefix must not exceed 10 characters.', 400)

    if require_all or time_provided:
        if require_all and avg_service_time is None:
            return ('Average service time is required.', 400)
        if avg_service_time is not None:
            try:
                avg_service_time = float(avg_service_time)
            except (TypeError, ValueError):
                return ('Average service time must be a valid number.', 400)
            if avg_service_time <= 0:
                return ('Average service time must be greater than 0.', 400)

    return None

def serialize_service(s):
    return {
        'id': s['id'],
        'name': s['name'],
        'token_prefix': s['token_prefix'],
        'avg_service_time': s['avg_service_time'],
        'status': s['status'],
    }

@services_bp.route('/services', methods=['GET'])
def list_services():
    rows = query('SELECT id, name, token_prefix, avg_service_time, status FROM services ORDER BY name', fetch='all')
    return jsonify({'services': [serialize_service(s) for s in rows]})

@services_bp.route('/services', methods=['POST'])
@role_required('admin')
def create_service():
    data = request.get_json(silent=True) or {}
    error = validate_service_fields(data, require_all=True)
    if error:
        return jsonify({'message': error[0]}), error[1]

    name = (data.get('name') or '').strip()
    token_prefix = (data.get('token_prefix') or '').strip().upper()
    avg_service_time = float(data.get('avg_service_time'))
    status = data.get('status', 'active')

    if status not in ('active', 'inactive'):
        return jsonify({'message': 'Invalid status.'}), 400

    existing = query('SELECT id FROM services WHERE token_prefix = %s', (token_prefix,), fetch='one')
    if existing:
        return jsonify({'message': 'Token prefix already in use.'}), 409

    lastrowid, _ = execute(
        'INSERT INTO services (name, token_prefix, avg_service_time, status) VALUES (%s, %s, %s, %s)',
        (name, token_prefix, avg_service_time, status)
    )
    row = query('SELECT id, name, token_prefix, avg_service_time, status FROM services WHERE id = %s', (lastrowid,), fetch='one')
    return jsonify({'service': serialize_service(row)}), 201

@services_bp.route('/services/<int:service_id>', methods=['PUT'])
@role_required('admin')
def update_service(service_id):
    data = request.get_json(silent=True) or {}
    existing = query('SELECT id FROM services WHERE id = %s', (service_id,), fetch='one')
    if not existing:
        return jsonify({'message': 'Service not found.'}), 404

    error = validate_service_fields(data, require_all=False)
    if error:
        return jsonify({'message': error[0]}), error[1]

    name = (data.get('name') or '').strip()
    token_prefix = (data.get('token_prefix') or '').strip().upper()
    avg_service_time = data.get('avg_service_time')
    status = data.get('status')

    if name:
        execute('UPDATE services SET name = %s WHERE id = %s', (name, service_id))
    if token_prefix:
        dup = query('SELECT id FROM services WHERE token_prefix = %s AND id != %s', (token_prefix, service_id), fetch='one')
        if dup:
            return jsonify({'message': 'Token prefix already in use.'}), 409
        execute('UPDATE services SET token_prefix = %s WHERE id = %s', (token_prefix, service_id))
    if avg_service_time is not None:
        execute('UPDATE services SET avg_service_time = %s WHERE id = %s', (float(avg_service_time), service_id))
    if status and status in ('active', 'inactive'):
        execute('UPDATE services SET status = %s WHERE id = %s', (status, service_id))

    row = query('SELECT id, name, token_prefix, avg_service_time, status FROM services WHERE id = %s', (service_id,), fetch='one')
    return jsonify({'service': serialize_service(row)})

@services_bp.route('/services/<int:service_id>', methods=['DELETE'])
@role_required('admin')
def delete_service(service_id):
    existing = query('SELECT id FROM services WHERE id = %s', (service_id,), fetch='one')
    if not existing:
        return jsonify({'message': 'Service not found.'}), 404
    execute('DELETE FROM services WHERE id = %s', (service_id,))
    return jsonify({'message': 'Service deleted successfully.'})
