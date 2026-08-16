"""Authentication and authorization decorators."""
from functools import wraps
from flask import request, jsonify, g
from jwt_utils import decode_token
from db import query

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return jsonify({'message': 'Authentication required.'}), 401
        token = auth_header.split(' ', 1)[1]
        payload = decode_token(token)
        if not payload:
            return jsonify({'message': 'Session expired or invalid. Please log in again.'}), 401
        user = query('SELECT id, name, email, role, status, counter_id FROM users WHERE id = %s', (payload['user_id'],), fetch='one')
        if not user or user['status'] != 'active':
            return jsonify({'message': 'Account is not active.'}), 403
        g.current_user = user
        return f(*args, **kwargs)
    return decorated

def role_required(*roles):
    def decorator(f):
        @wraps(f)
        @token_required
        def decorated(*args, **kwargs):
            if g.current_user['role'] not in roles:
                return jsonify({'message': 'You do not have permission to perform this action.'}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator
