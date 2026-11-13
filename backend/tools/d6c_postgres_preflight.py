"""Run from the backend directory: python tools/d6c_postgres_preflight.py."""
import os
import sys
from pathlib import Path

backend = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(backend))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

try:
    import django
    django.setup()
    from django.db import connections
    db = connections['default']
    print('Database engine:', db.settings_dict.get('ENGINE', '(unset)'))
    print('Database vendor:', db.vendor)
    if db.vendor != 'postgresql':
        print('BLOCKED: PostgreSQL concurrency tests require a real PostgreSQL test database.')
        sys.exit(2)
    with db.cursor() as cursor:
        cursor.execute('SELECT current_setting(%s), version()', ['server_version_num'])
        version_num, version = cursor.fetchone()
    print('PostgreSQL version number:', version_num)
    print('Connection: PASS')
    print('NEXT: python manage.py test finance.tests.test_b2h4d6c_postgres --verbosity 2')
    print('WARNING: Django tests create a separate TEST database; configure test DB permissions safely.')
except Exception as error:
    print('BLOCKED:', type(error).__name__, str(error))
    sys.exit(2)
