import os, django
os.environ['DJANGO_SETTINGS_MODULE'] = 'core.settings'
django.setup()

from finance.views import HeadmasterDashboardViewSet
from django.contrib.auth.models import User
from finance.models import School, Term, Student, ClassLevel, FeeStructure, Payment

print('\n=== Headmaster Dashboard Implementation Test ===\n')

# Verify import
print('[OK] HeadmasterDashboardViewSet imported successfully')
print('[OK] ViewSet has list method: ' + str(hasattr(HeadmasterDashboardViewSet, 'list')))

# Quick data test
print('\nCreating minimal test data...')
try:
    user = User.objects.create_user('verify_test', password='test123')
    school = School.objects.create(name='Verify School', created_by=user)
    classA = ClassLevel.objects.create(school=school, name='Form 1')
    term = Term.objects.create(
        school=school,
        name='Verify Term',
        start_date='2026-01-01',
        end_date='2026-03-31'
    )
    fee = FeeStructure.objects.create(
        term=term,
        class_level=classA,
        amount=100000
    )
    
    for i in range(3):
        Student.objects.create(
            school=school,
            class_level=classA,
            first_name='Test',
            last_name=f'Student{i}',
            student_id=f'TEST-{i}',
            parent_name='Test Parent',
            parent_phone='0755000000'
        )
    
    print('[OK] Test data created')
    
    # Test calculations
    print('\n=== Headmaster Dashboard Calculations ===')
    from rest_framework.test import APIRequestFactory
    from rest_framework.response import Response
    
    factory = APIRequestFactory()
    request = factory.get(f'/api/v1/headmaster-dashboard/?term_id={term.id}')
    request.user = user
    
    viewset = HeadmasterDashboardViewSet()
    viewset.request = request
    viewset.format_kwarg = None
    
    response = viewset.list(request)
    
    if response.status_code == 200:
        print('[PASS] ViewSet returned 200 OK')
        data = response.data
        print('\nResponse Summary:')
        print('  Total Schools:', data.get('total_schools'))
        print('  Total Students:', data.get('total_students'))
        print('  Students with Payments:', data.get('students_with_payments'))
        print('  Total Expected:', data.get('total_expected'))
        print('  Total Collected:', data.get('total_collected'))
        print('  Collection Rate:', f"{data.get('collection_rate_percent')}%")
    else:
        print(f'[ERROR] ViewSet returned: {response.status_code}')
        print(f'Response data: {response.data}')
        
    # Cleanup
    user.delete()
    print('\n[OK] Test data cleaned up')

except Exception as e:
    print(f'[ERROR] {str(e)}')
    import traceback
    traceback.print_exc()

print('\n=== Test Completed ===\n')
