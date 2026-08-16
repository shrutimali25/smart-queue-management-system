"""Analytics routes: summary, daily, service-wise."""
from flask import Blueprint, request, jsonify
from db import query
from auth import role_required

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/analytics/summary', methods=['GET'])
@role_required('admin')
def summary():
    total_users = query('SELECT COUNT(*) AS c FROM users WHERE role = %s', ('user',), fetch='one')['c']
    tokens_today = query('SELECT COUNT(*) AS c FROM tokens WHERE DATE(created_at) = CURDATE()', fetch='one')['c']
    waiting = query("SELECT COUNT(*) AS c FROM tokens WHERE status = 'waiting'", fetch='one')['c']
    serving = query("SELECT COUNT(*) AS c FROM tokens WHERE status = 'serving'", fetch='one')['c']
    completed = query("SELECT COUNT(*) AS c FROM tokens WHERE status = 'completed' AND DATE(created_at) = CURDATE()", fetch='one')['c']
    cancelled = query("SELECT COUNT(*) AS c FROM tokens WHERE status = 'cancelled' AND DATE(created_at) = CURDATE()", fetch='one')['c']

    avg_wait_row = query(
        "SELECT AVG(TIMESTAMPDIFF(MINUTE, created_at, called_at)) AS avg FROM tokens WHERE status IN ('completed','skipped') AND DATE(created_at) = CURDATE() AND called_at IS NOT NULL",
        fetch='one'
    )
    avg_wait = int(avg_wait_row['avg'] or 0)

    avg_svc_row = query(
        "SELECT AVG(TIMESTAMPDIFF(MINUTE, started_at, completed_at)) AS avg FROM tokens WHERE status = 'completed' AND DATE(created_at) = CURDATE() AND started_at IS NOT NULL AND completed_at IS NOT NULL",
        fetch='one'
    )
    avg_svc_time = int(avg_svc_row['avg'] or 0)

    return jsonify({
        'summary': {
            'total_users': total_users,
            'tokens_today': tokens_today,
            'waiting': waiting,
            'serving': serving,
            'completed': completed,
            'cancelled': cancelled,
            'avg_wait': avg_wait,
            'avg_service_time': avg_svc_time,
        }
    })

@analytics_bp.route('/analytics/daily', methods=['GET'])
@role_required('admin')
def daily():
    days = int(request.args.get('days', 7))
    rows = query(
        '''
        SELECT DATE(created_at) AS date, COUNT(*) AS count
        FROM tokens
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL %s DAY)
        GROUP BY DATE(created_at)
        ORDER BY date ASC
        ''',
        (days,),
        fetch='all'
    )
    return jsonify({
        'daily': [{'date': str(r['date']), 'count': r['count']} for r in rows]
    })

@analytics_bp.route('/analytics/services', methods=['GET'])
@role_required('admin')
def by_service():
    rows = query(
        '''
        SELECT s.id AS service_id, s.name AS service_name, COUNT(t.id) AS count
        FROM services s
        LEFT JOIN tokens t ON s.id = t.service_id AND DATE(t.created_at) = CURDATE()
        GROUP BY s.id, s.name
        ORDER BY count DESC
        ''',
        fetch='all'
    )
    return jsonify({
        'services': [{'service_id': r['service_id'], 'service_name': r['service_name'], 'count': r['count']} for r in rows]
    })
