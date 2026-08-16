"""
Smart Queue Management System - Flask Application Factory
"""
import os
from flask import Flask
from flask_cors import CORS
from config import Config
from db import close_db

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    CORS(app, resources={r"/api/*": {"origins": "*"}})

    app.teardown_appcontext(close_db)

    # Register blueprints
    from routes.auth import auth_bp
    from routes.users import users_bp
    from routes.services import services_bp
    from routes.counters import counters_bp
    from routes.tokens import tokens_bp
    from routes.queue import queue_bp
    from routes.analytics import analytics_bp
    from routes.health import health_bp

    app.register_blueprint(health_bp, url_prefix='/api')
    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(users_bp, url_prefix='/api')
    app.register_blueprint(services_bp, url_prefix='/api')
    app.register_blueprint(counters_bp, url_prefix='/api')
    app.register_blueprint(tokens_bp, url_prefix='/api')
    app.register_blueprint(queue_bp, url_prefix='/api')
    app.register_blueprint(analytics_bp, url_prefix='/api')

    return app

app = create_app()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=os.environ.get('FLASK_DEBUG', '0') == '1')
