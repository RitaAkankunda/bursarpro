from django.contrib.auth.models import User
from finance.models import UserRole, School

# Get the existing school
school = School.objects.first()

if school:
    # Create teacher user
    teacher_user, created = User.objects.get_or_create(
        username='teacher1',
        defaults={
            'first_name': 'James',
            'last_name': 'Smith',
            'email': 'teacher1@school.com'
        }
    )
    teacher_user.set_password('teacher123')
    teacher_user.save()
    
    # Create teacher role
    teacher_role, role_created = UserRole.objects.update_or_create(
        user=teacher_user,
        defaults={
            'school': school,
            'role': 'TEACHER'
        }
    )
    
    print(f"✓ Teacher User: {teacher_user.username}")
    print(f"  Password: teacher123")
    print(f"  Email: {teacher_user.email}")
    print(f"✓ Teacher Role created")
    print(f"✓ School: {school.name}")
    print()
    print("Teacher dashboard available at: /teacher-dashboard")
else:
    print("ERROR: No school found. Please create test data first.")
