import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from finance.models import School, Term, ClassLevel
from datetime import date

school = School.objects.first()
if school:
    # Create term
    term, created = Term.objects.get_or_create(
        school=school,
        name="Term 1 2026",
        defaults={
            'start_date': date(2026, 1, 15),
            'end_date': date(2026, 4, 15)
        }
    )
    print(f"✓ Term: {term.name}")
    print(f"  Start: {term.start_date}")
    print(f"  End: {term.end_date}")
    
    # Create classes if they don't exist
    classes = ["Senior 1", "Senior 2", "Senior 3"]
    for class_name in classes:
        cls, created = ClassLevel.objects.get_or_create(
            school=school,
            name=class_name
        )
        print(f"✓ Class: {cls.name}")
    
    print(f"✓ School: {school.name}")
else:
    print("ERROR: No school found")
