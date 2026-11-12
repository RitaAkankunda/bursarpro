"""D6D3 local, read-only finance audit. Requires explicit school ID."""
import json
from django.core.management.base import BaseCommand, CommandError
from finance.financial_consistency_audit import audit_school_finances

class Command(BaseCommand):
    help = 'Read-only consistency check for one school; no financial data changes.'

    def add_arguments(self, parser):
        parser.add_argument('--school-id', type=int, required=True)

    def handle(self, *args, **options):
        try:
            result = audit_school_finances(school_id=options['school_id'])
        except ValueError as exc:
            raise CommandError(str(exc)) from exc
        self.stdout.write(json.dumps(result, indent=2, sort_keys=True))
