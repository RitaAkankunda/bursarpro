from django.contrib.auth.models import User
from finance.models import School, Term, ClassLevel, Student, FeeStructure, UserRole
from datetime import date

# Get existing data
school = School.objects.first()

print(f"School: {school.name}")

# Create term
term, created = Term.objects.get_or_create(
    school=school,
    name='Term 1 2026',
    defaults={'start_date': date(2026, 1, 15), 'end_date': date(2026, 4, 15)}
)
print(f"Term: {term.name}")

# Create classes
for class_name in ['Senior 1', 'Senior 2', 'Senior 3']:
    cls, created = ClassLevel.objects.get_or_create(school=school, name=class_name)
    print(f"Class: {class_name}")

# Create fee structures
for cls in ClassLevel.objects.filter(school=school):
    fee, created = FeeStructure.objects.get_or_create(
        term=term, class_level=cls, defaults={'amount': 500000}
    )

# Create students
students_data = [('John', 'Doe', 'S001'), ('Jane', 'Smith', 'S002'), ('Bob', 'Johnson', 'S003')]
for first, last, sid in students_data:
    student, created = Student.objects.get_or_create(
        school=school, student_id=sid,
        defaults={
            'first_name': first, 
            'last_name': last, 
            'class_level': ClassLevel.objects.filter(school=school).first(), 
            'parent_name': f'{first} Parent', 
            'parent_phone': '256701234567'
        }
    )
    print(f"Student: {first} {last}")

print("\n✅ Test data created!")
