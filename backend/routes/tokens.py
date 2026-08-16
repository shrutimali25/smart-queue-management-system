"""Token routes: create, view, cancel, my-tokens."""
from flask import Blueprint, request, jsonify, g
from db import query, execute
from auth import token_required

tokens_bp = Blueprint('tokens', __name__)

def compute_queue_data(service_id, token_id=None):
    """Compute queue position, people ahead, estimated wait for a token."""
    waiting = query(
        'SELECT id FROM tokens WHERE service_id = %s AND status = %s ORDER BY created_at ASC',
        (service_id, 'waiting'),
        fetch='all'
    )
    if token_id:
        position = None
        people_ahead = 0
        for i, t in enumerate(waiting):
            if t['id'] == token_id:
                position = i + 1
                people_ahead = i
                break
    else:
        people_ahead = len(waiting)
        position = None
    svc = query('SELECT avg_service_time FROM services WHERE id = %s', (service_id,), fetch='one')
    avg_time = svc['avg_service_time'] if svc else 5
    estimated_wait = people_ahead * avg_time
    return position, people_ahead, estimated_wait

def now_serving_for_service(service_id):
    """Return the token_number currently being served for a service, if any."""
    row = query(
        "SELECT token_number FROM tokens WHERE service_id = %s AND status IN ('serving','called') ORDER BY started_at DESC, called_at DESC LIMIT 1",
        (service_id,),
        fetch='one'
    )
    return row['token_number'] if row else None

def serialize_token(t, include_queue=True):
    result = {
        'id': t['id'],
        'token_number': t['token_number'],
        'user_id': t.get('user_id'),
        'user_name': t.get('user_name'),
        'service_id': t['service_id'],
        'service_name': t.get('service_name'),
        'counter_id': t.get('counter_id'),
        'counter_name': t.get('counter_name'),
        'status': t['status'],
        'created_at': t['created_at'].isoformat() if t.get('created_at') else None,
        'called_at': t['called_at'].isoformat() if t.get('called_at') else None,
        'started_at': t['started_at'].isoformat() if t.get('started_at') else None,
        'completed_at': t['completed_at'].isoformat() if t.get('completed_at') else None,
    }
    if include_queue:
        position, people_ahead, est_wait = compute_queue_data(t['service_id'], t['id'])
        result['queue_position'] = position
        result['people_ahead'] = people_ahead
        result['estimated_wait'] = est_wait
        result['now_serving'] = now_serving_for_service(t['service_id'])
    else:
        result['queue_position'] = t.get('queue_position', 0)
        result['people_ahead'] = t.get('people_ahead', 0)
        result['estimated_wait'] = t.get('estimated_wait', 0)
        result['now_serving'] = now_serving_for_service(t['service_id'])
    return result

@tokens_bp.route('/tokens', methods=['POST'])
@token_required
def create_token():
    data = request.get_json(silent=True) or {}
    service_id = data.get('service_id')
    if not service_id:
        return jsonify({'message': 'Service ID is required.'}), 400

    svc = query('SELECT id, name, token_prefix, avg_service_time, status FROM services WHERE id = %s', (service_id,), fetch='one')
    if not svc:
        return jsonify({'message': 'Service not found.'}), 404
    if svc['status'] != 'active':
        return jsonify({'message': 'This service is currently inactive.'}), 400

    # Check if user already has an active token for this service
    active = query(
        "SELECT id FROM tokens WHERE user_id = %s AND service_id = %s AND status IN ('waiting','called','serving')",
        (g.current_user['id'], service_id),
        fetch='one'
    )
    if active:
        return jsonify({'message': 'You already have an active token for this service.'}), 409

    # Generate token number: PREFIX + sequential number for today
    today_count = query(
        'SELECT COUNT(*) AS cnt FROM tokens WHERE service_id = %s AND DATE(created_at) = CURDATE()',
        (service_id,),
        fetch='one'
    )
    seq = (today_count['cnt'] if today_count else 0) + 1
    token_number = f"{svc['token_prefix']}-{seq:03d}"

    position, people_ahead, est_wait = compute_queue_data(service_id)

    lastrowid, _ = execute(
        '''INSERT INTO tokens (token_number, user_id, service_id, status, queue_position, people_ahead, estimated_wait)
           VALUES (%s, %s, %s, 'waiting', %s, %s, %s)''',
        (token_number, g.current_user['id'], service_id, position or people_ahead + 1, people_ahead, est_wait)
    )

    row = query('''
        SELECT t.*, s.name AS service_name, c.name AS counter_name, u.name AS user_name
        FROM tokens t
        LEFT JOIN services s ON t.service_id = s.id
        LEFT JOIN counters c ON t.counter_id = c.id
        LEFT JOIN users u ON t.user_id = u.id
        WHERE t.id = %s
    ''', (lastrowid,), fetch='one')
    return jsonify({'token': serialize_token(row)}), 201

@tokens_bp.route('/tokens/<int:token_id>', methods=['GET'])
@token_required
def get_token(token_id):
    row = query('''
        SELECT t.*, s.name AS service_name, c.name AS counter_name, u.name AS user_name
        FROM tokens t
        LEFT JOIN services s ON t.service_id = s.id
        LEFT JOIN counters c ON t.counter_id = c.id
        LEFT JOIN users u ON t.user_id = u.id
        WHERE t.id = %s
    ''', (token_id,), fetch='one')
    if not row:
        return jsonify({'message': 'Token not found.'}), 404
    if g.current_user['role'] == 'user' and row['user_id'] != g.current_user['id']:
        return jsonify({'message': 'You do not have access to this token.'}), 403
    return jsonify({'token': serialize_token(row)})

@tokens_bp.route('/my-tokens', methods=['GET'])
@token_required
def my_tokens():
    status = request.args.get('status', '')
    sql = '''
        SELECT t.*, s.name AS service_name, c.name AS counter_name, u.name AS user_name
        FROM tokens t
        LEFT JOIN services s ON t.service_id = s.id
        LEFT JOIN counters c ON t.counter_id = c.id
        LEFT JOIN users u ON t.user_id = u.id
        WHERE t.user_id = %s
    '''
    params = [g.current_user['id']]
    if status:
        sql += ' AND t.status = %s'
        params.append(status)
    sql += ' ORDER BY t.created_at DESC'
    rows = query(sql, tuple(params), fetch='all')
    return jsonify({'tokens': [serialize_token(t) for t in rows]})

@tokens_bp.route('/tokens/<int:token_id>/cancel', methods=['PUT'])
@token_required
def cancel_token(token_id):
    row = query('SELECT id, user_id, status FROM tokens WHERE id = %s', (token_id,), fetch='one')
    if not row:
        return jsonify({'message': 'Token not found.'}), 404
    if g.current_user['role'] == 'user' and row['user_id'] != g.current_user['id']:
        return jsonify({'message': 'You can only cancel your own tokens.'}), 403
    if row['status'] not in ('waiting', 'called'):
        return jsonify({'message': 'Only waiting or called tokens can be cancelled.'}), 400
    execute('UPDATE tokens SET status = %s WHERE id = %s', ('cancelled', token_id))
    updated = query('''
        SELECT t.*, s.name AS service_name, c.name AS counter_name, u.name AS user_name
        FROM tokens t
        LEFT JOIN services s ON t.service_id = s.id
        LEFT JOIN counters c ON t.counter_id = c.id
        LEFT JOIN users u ON t.user_id = u.id
        WHERE t.id = %s
    ''', (token_id,), fetch='one')
    return jsonify({'token': serialize_token(updated)})
