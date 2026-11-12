"""Local-only, audit-gated read-only payment export; no public HTTP endpoint."""
import csv
import json
import sys
from django.core.management.base import BaseCommand, CommandError
from finance.finance_reporting_export import recorded_payment_report

COLUMNS = ['payment_id','student_id','term_id','receipt_number','amount',
           'payment_method','status','net_amount']

def csv_cell(value):
    # Spreadsheet applications can execute formulas beginning with these characters.
    string = str(value)
    if string.lstrip().startswith(('=', '+', '-', '@', '\t', '\r', '\n')):
        return "'" + string
    return string

class Command(BaseCommand):
    help = 'Read-only, consistency-gated payment history for one school/term (JSON or CSV).'

    def add_arguments(self, parser):
        parser.add_argument('--school-id', type=int, required=True)
        parser.add_argument('--term-id', type=int, required=True)
        parser.add_argument('--format', choices=('json','csv'), default='json')

    def handle(self, *args, **opts):
        try:
            result = recorded_payment_report(school_id=opts['school_id'],
                                             term_id=opts['term_id'])
        except ValueError as exc:
            raise CommandError(str(exc)) from exc
        if opts['format'] == 'json':
            self.stdout.write(json.dumps(result, sort_keys=True, indent=2))
        else:
            writer = csv.writer(self.stdout, lineterminator='\n')
            writer.writerow(COLUMNS)
            for row in result['rows']:
                writer.writerow([csv_cell(row[k]) for k in COLUMNS])
