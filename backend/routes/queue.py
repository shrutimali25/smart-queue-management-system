"""Queue management routes: list queue, call next, start, complete, skip, recall."""
from flask import Blueprint, request, jsonify, g
from db import query, execute
from auth import token_required, role_required
from routes.tokens import compute_queue_data, now_serving_for_service

queue_bp = Blueprint('queue', __name__)

def staff_scope(user):
    """Return (counter_id, service_id) for a staff member, or (None, None) if unassigned/admin."""
    if user['role'] != 'staff' or not user.get('counter_id'):
        return None, None
    counter = query('SELECT service_id FROM counters WHERE id = %s', (user['counter_id'],), fetch='one')
    if not counter or not counter['service_id']:
        return user['counter_id'], None
    return user['counter_id'], counter['service_id']

def staff_owns_token(user, token_row):
    """Staff may only act on tokens for their assigned service. Admins bypass this check."""
    if user['role'] == 'admin':
        return True
    if user['role'] != 'staff':
        return False
    _, staff_service_id = staff_scope(user)
    return staff_service_id is not None and token_row.get('service_id') == staff_service_id

def serialize_user_queue_token(t):
    position, people_ahead, estimated_wait = compute_queue_data(t['service_id'], t['id'])
    return {
        'id': t['id'],
        'token_number': t['token_number'],
        'service_id': t['service_id'],
        'service_name': t.get('service_name'),
        'status': t['status'],
        'created_at': t['created_at'].isoformat() if t.get('created_at') else None,
        'called_at': t['called_at'].isoformat() if t.get('called_at') else None,
        'started_at': t['started_at'].isoformat() if t.get('started_at') else None,
        'completed_at': t['completed_at'].isoformat() if t.get('completed_at') else None,
        'queue_position': position,
        'people_ahead': people_ahead,
        'estimated_wait': estimated_wait,
        'now_serving': now_serving_for_service(t['service_id']),
    }

def serialize_token(t):
    return {
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
        'waiting_time': compute_waiting_time(t),
    }

def compute_waiting_time(t):
    """Minutes from created_at to called_at (or now if not called)."""
    from datetime import datetime
    if not t.get('created_at'):
        return 0
    end = t.get('called_at') or t.get('started_at') or datetime.now()
    if isinstance(end, str):
        end = datetime.fromisoformat(end)
    start = t['created_at']
    if isinstance(start, str):
        start = datetime.fromisoformat(start)
    delta = (end - start).total_seconds() / 60
    return int(max(0, delta))

@queue_bp.route('/queue', methods=['GET'])
@token_required
def get_queue():
    status = request.args.get('status', '')
    service_id = request.args.get('service_id', '')

    user = g.current_user

    if user['role'] == 'user':
        sql = '''
            SELECT t.*, s.name AS service_name
            FROM tokens t
            LEFT JOIN services s ON t.service_id = s.id
            WHERE t.user_id = %s
        '''
        params = [user['id']]
        if status:
            sql += ' AND t.status = %s'
            params.append(status)
        if service_id:
            sql += ' AND t.service_id = %s'
            params.append(int(service_id))
        sql += ' ORDER BY t.created_at ASC'
        rows = query(sql, tuple(params), fetch='all')
        serialized = [serialize_user_queue_token(t) for t in rows]
        waiting = [t for t in serialized if t['status'] == 'waiting']
        completed = [t for t in serialized if t['status'] == 'completed']
        current = next((t for t in serialized if t['status'] in ('serving', 'called')), None)
        service_name = rows[0].get('service_name') if rows else None
        return jsonify({
            'tokens': serialized,
            'waiting': waiting,
            'completed': completed,
            'current': current,
            'summary': {
                'waiting_count': len(waiting),
                'completed_count': len(completed),
                'avg_wait': int(sum(t['estimated_wait'] for t in completed) / len(completed)) if completed else 0,
                'service_name': service_name,
            }
        })

    sql = '''
        SELECT t.*, s.name AS service_name, s.avg_service_time, c.name AS counter_name, u.name AS user_name
        FROM tokens t
        LEFT JOIN services s ON t.service_id = s.id
        LEFT JOIN counters c ON t.counter_id = c.id
        LEFT JOIN users u ON t.user_id = u.id
        WHERE 1=1
    '''
    params = []

    # Staff are always scoped to their assigned counter's service, regardless of query params.
    staff_counter_id, staff_service_id = staff_scope(user)
    if user['role'] == 'staff':
        if staff_service_id:
            sql += ' AND t.service_id = %s'
            params.append(staff_service_id)
        else:
            # No assigned service: staff sees nothing.
            sql += ' AND 1=0'
    elif user['role'] == 'user':
        # Regular users see only their own tokens here; the my-tokens endpoint is preferred.
        sql += ' AND t.user_id = %s'
        params.append(user['id'])
    else:
        if service_id:
            sql += ' AND t.service_id = %s'
            params.append(int(service_id))

    if status:
        sql += ' AND t.status = %s'
        params.append(status)

    sql += ' ORDER BY FIELD(t.status, "serving", "called", "waiting", "completed", "skipped", "cancelled"), t.created_at ASC'
    rows = query(sql, tuple(params), fetch='all')

    # Build summary
    waiting = [r for r in rows if r['status'] == 'waiting']
    completed = [r for r in rows if r['status'] == 'completed']

    # Current token (serving or called)
    current = None
    for r in rows:
        if r['status'] in ('serving', 'called'):
            current = serialize_token(r)
            break

    # Compute summary
    avg_wait = 0
    if completed:
        total_wait = sum(compute_waiting_time(t) for t in completed)
        avg_wait = int(total_wait / len(completed))

    svc_name = None
    if user['role'] == 'staff' and staff_service_id:
        c = query('SELECT s.name FROM counters c LEFT JOIN services s ON c.service_id = s.id WHERE c.id = %s', (staff_counter_id,), fetch='one')
        if c:
            svc_name = c['name']
    elif user['role'] == 'admin' and service_id:
        s = query('SELECT name FROM services WHERE id = %s', (int(service_id),), fetch='one')
        if s:
            svc_name = s['name']

    return jsonify({
        'tokens': [serialize_token(t) for t in rows],
        'waiting': [serialize_token(t) for t in waiting],
        'completed': [serialize_token(t) for t in completed],
        'current': current,
        'summary': {
            'waiting_count': len(waiting),
            'completed_count': len(completed),
            'avg_wait': avg_wait,
            'service_name': svc_name,
        }
    })

@queue_bp.route('/queue/next', methods=['POST'])
@role_required('staff', 'admin')
def call_next():
    data = request.get_json(silent=True) or {}
    user = g.current_user

    if user['role'] == 'staff':
        # Staff are always scoped to their assigned counter/service; ignore client-supplied IDs.
        counter_id, service_id = staff_scope(user)
        if not service_id:
            return jsonify({'message': 'No service assigned to your counter. Please contact an admin.'}), 400
    else:
        # Admin may target a specific counter; otherwise pick any counter for the service.
        counter_id = data.get('counter_id')
        service_id = data.get('service_id')

        if not service_id and counter_id:
            counter = query('SELECT service_id FROM counters WHERE id = %s', (counter_id,), fetch='one')
            if counter:
                service_id = counter['service_id']

        if not service_id:
            return jsonify({'message': 'No service assigned to this counter. Please contact an admin.'}), 400

    # Find the oldest waiting token for this service
    next_token = query(
        "SELECT id FROM tokens WHERE service_id = %s AND status = 'waiting' ORDER BY created_at ASC LIMIT 1",
        (service_id,),
        fetch='one'
    )
    if not next_token:
        return jsonify({'message': 'No tokens waiting in the queue.'}), 404

    execute(
        "UPDATE tokens SET status = 'called', counter_id = %s, called_at = NOW() WHERE id = %s",
        (counter_id, next_token['id'])
    )

    row = query('''
        SELECT t.*, s.name AS service_name, c.name AS counter_name, u.name AS user_name
        FROM tokens t
        LEFT JOIN services s ON t.service_id = s.id
        LEFT JOIN counters c ON t.counter_id = c.id
        LEFT JOIN users u ON t.user_id = u.id
        WHERE t.id = %s
    ''', (next_token['id'],), fetch='one')
    return jsonify({'token': serialize_token(row)})

@queue_bp.route('/queue/<int:token_id>/start', methods=['PUT'])
@role_required('staff', 'admin')
def start_token(token_id):
    row = query('SELECT id, status, service_id, counter_id FROM tokens WHERE id = %s', (token_id,), fetch='one')
    if not row:
        return jsonify({'message': 'Token not found.'}), 404
    if not staff_owns_token(g.current_user, row):
        return jsonify({'message': 'You do not have access to this token.'}), 403
    if row['status'] != 'called':
        return jsonify({'message': 'Only called tokens can be started.'}), 400
    execute("UPDATE tokens SET status = 'serving', started_at = NOW() WHERE id = %s", (token_id,))
    updated = query('''
        SELECT t.*, s.name AS service_name, c.name AS counter_name, u.name AS user_name
        FROM tokens t
        LEFT JOIN services s ON t.service_id = s.id
        LEFT JOIN counters c ON t.counter_id = c.id
        LEFT JOIN users u ON t.user_id = u.id
        WHERE t.id = %s
    ''', (token_id,), fetch='one')
    return jsonify({'token': serialize_token(updated)})

@queue_bp.route('/queue/<int:token_id>/complete', methods=['PUT'])
@role_required('staff', 'admin')
def complete_token(token_id):
    row = query('SELECT id, status, service_id, counter_id FROM tokens WHERE id = %s', (token_id,), fetch='one')
    if not row:
        return jsonify({'message': 'Token not found.'}), 404
    if not staff_owns_token(g.current_user, row):
        return jsonify({'message': 'You do not have access to this token.'}), 403
    if row['status'] not in ('serving', 'called'):
        return jsonify({'message': 'Only serving or called tokens can be completed.'}), 400
    execute("UPDATE tokens SET status = 'completed', completed_at = NOW() WHERE id = %s", (token_id,))
    updated = query('''
        SELECT t.*, s.name AS service_name, c.name AS counter_name, u.name AS user_name
        FROM tokens t
        LEFT JOIN services s ON t.service_id = s.id
        LEFT JOIN counters c ON t.counter_id = c.id
        LEFT JOIN users u ON t.user_id = u.id
        WHERE t.id = %s
    ''', (token_id,), fetch='one')
    return jsonify({'token': serialize_token(updated)})

@queue_bp.route('/queue/<int:token_id>/skip', methods=['PUT'])
@role_required('staff', 'admin')
def skip_token(token_id):
    row = query('SELECT id, status, service_id, counter_id FROM tokens WHERE id = %s', (token_id,), fetch='one')
    if not row:
        return jsonify({'message': 'Token not found.'}), 404
    if not staff_owns_token(g.current_user, row):
        return jsonify({'message': 'You do not have access to this token.'}), 403
    if row['status'] not in ('waiting', 'called', 'serving'):
        return jsonify({'message': 'Only active tokens can be skipped.'}), 400
    execute("UPDATE tokens SET status = 'skipped', completed_at = NOW() WHERE id = %s", (token_id,))
    updated = query('''
        SELECT t.*, s.name AS service_name, c.name AS counter_name, u.name AS user_name
        FROM tokens t
        LEFT JOIN services s ON t.service_id = s.id
        LEFT JOIN counters c ON t.counter_id = c.id
        LEFT JOIN users u ON t.user_id = u.id
        WHERE t.id = %s
    ''', (token_id,), fetch='one')
    return jsonify({'token': serialize_token(updated)})

@queue_bp.route('/queue/<int:token_id>/recall', methods=['PUT'])
@role_required('staff', 'admin')
def recall_token(token_id):
    row = query('SELECT id, status, service_id, counter_id FROM tokens WHERE id = %s', (token_id,), fetch='one')
    if not row:
        return jsonify({'message': 'Token not found.'}), 404
    if not staff_owns_token(g.current_user, row):
        return jsonify({'message': 'You do not have access to this token.'}), 403
    if row['status'] != 'called':
        return jsonify({'message': 'Only called tokens can be recalled.'}), 400
    # Recall just re-notifies; status stays 'called', update called_at
    execute("UPDATE tokens SET called_at = NOW() WHERE id = %s", (token_id,))
    updated = query('''
        SELECT t.*, s.name AS service_name, c.name AS counter_name, u.name AS user_name
        FROM tokens t
        LEFT JOIN services s ON t.service_id = s.id
        LEFT JOIN counters c ON t.counter_id = c.id
        LEFT JOIN users u ON t.user_id = u.id
        WHERE t.id = %s
    ''', (token_id,), fetch='one')
    return jsonify({'token': serialize_token(updated)})
