"""JWT helpers — encode and decode tokens using PyJWT."""
import datetime
import jwt
from flask import current_app

def encode_token(user_id, role):
    """Create a JWT for the given user."""
    cfg = current_app.config
    payload = {
        'user_id': user_id,
        'role': role,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=cfg['JWT_EXPIRY_HOURS']),
        'iat': datetime.datetime.utcnow(),
    }
    return jwt.encode(payload, cfg['SECRET_KEY'], algorithm='HS256')

def decode_token(token):
    """Decode a JWT. Returns the payload or None if invalid/expired."""
    cfg = current_app.config
    try:
        return jwt.decode(token, cfg['SECRET_KEY'], algorithms=['HS256'])
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None
