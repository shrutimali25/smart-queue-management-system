"""Configuration for the Smart Queue Management System."""
import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # MySQL connection
    MYSQL_HOST = os.environ.get('MYSQL_HOST', '127.0.0.1')
    MYSQL_PORT = int(os.environ.get('MYSQL_PORT', 3306))
    MYSQL_USER = os.environ.get('MYSQL_USER', 'root')
    MYSQL_PASSWORD = os.environ.get('MYSQL_PASSWORD', '')
    MYSQL_DB = os.environ.get('MYSQL_DB', 'sqms')

    # JWT — a strong secret MUST be provided via the SECRET_KEY env var.
    _SECRET_KEY = os.environ.get('SECRET_KEY')
    if not _SECRET_KEY:
        raise RuntimeError(
            'SECRET_KEY environment variable is required for JWT signing. '
            'Set it to a strong, unpredictable value (e.g. `python -c "import secrets; print(secrets.token_hex(32))"`).'
        )
    SECRET_KEY = _SECRET_KEY
    JWT_EXPIRY_HOURS = 24

    # Flask
    JSON_SORT_KEYS = False
