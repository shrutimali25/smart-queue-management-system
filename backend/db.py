"""MySQL database connection helper using mysql-connector-python."""
import mysql.connector
from flask import g, current_app

def get_db():
    """Return a database connection for the current request context."""
    if 'db' not in g:
        cfg = current_app.config
        g.db = mysql.connector.connect(
            host=cfg['MYSQL_HOST'],
            port=cfg['MYSQL_PORT'],
            user=cfg['MYSQL_USER'],
            password=cfg['MYSQL_PASSWORD'],
            database=cfg['MYSQL_DB'],
            autocommit=False,
        )
    return g.db

def close_db(error=None):
    """Close the database connection at the end of each request."""
    db = g.pop('db', None)
    if db is not None:
        try:
            if error is not None:
                db.rollback()
            db.close()
        except Exception:
            pass

def query(sql, params=None, fetch='all'):
    """Execute a query and return results. fetch: 'all' | 'one' | 'none'."""
    db = get_db()
    cur = db.cursor(dictionary=True)
    try:
        cur.execute(sql, params or ())
        if fetch == 'all':
            rows = cur.fetchall()
            return rows
        elif fetch == 'one':
            row = cur.fetchone()
            return row
        else:
            return None
    finally:
        cur.close()

def execute(sql, params=None):
    """Execute an INSERT/UPDATE/DELETE and commit. Returns lastrowid and rowcount."""
    db = get_db()
    cur = db.cursor()
    try:
        cur.execute(sql, params or ())
        db.commit()
        lastrowid = cur.lastrowid
        rowcount = cur.rowcount
        return lastrowid, rowcount
    except Exception:
        db.rollback()
        raise
    finally:
        cur.close()
