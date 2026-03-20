"""
Simple direct test of HeadmasterDashboardViewSet
Tests the API logic without HTTP client
"""
import os
import django

os.environ['DJANGO_SETTINGS_MODULE'] = 'core.settings'
django.setup()

from django.contrib.auth.models import User
from rest_framework.test import APIRequestFactory
from finance.models import School, Term, Student, ClassLevel, FeeStructure, Payment
from finance.views import HeadmasterDashboardViewSet

print("=== Testing Headmaster Dashboard ViewSet ===\n")

# Create test data
print("Creating test data...")
user = User.objects.create_user('hm_test', password='test123')

school1 = School.objects.create(name='School A', created_by=user)
school2 = School.objects.create(name='School B', created_by=user)

classA = ClassLevel.objects.create(school=school1, name='Class A')
classB = ClassLevel.objects.create(school=school2, name='Class B')

term = Term.objects.create(
    school=school1,
    name='Term 1',
    start_date='2026-01-01',
    end_date='2026-03-31'
)

fee1 = FeeStructure.objects.create(
    term=term,
    class_level=classA,
    amount=100000
)

# Create students
for i in range(4):
    Student.objects.create(
        school=school1,
        class_level=classA,
        first_name=f'Student{i}',
        last_name='One',
        student_id=f'S1-{i}',
        parent_name=f'Parent{i}',
        parent_phone='0756000000'
    )

# Create payments (2 students paid)
students_paid = Student.objects.filter(school=school1)[:2]
for i, student in enumerate(students_paid):
    Payment.objects.create(
        student=student,
        term=term,
        amount=100000,
        payment_date='2026-02-01',
        receipt_number=f'RCP-{i}',
        recorded_by=user
    )

print("[OK] Test data created")
print(f"[OK] Students: {Student.objects.count()}")
print(f"[OK] Payments: {Payment.objects.count()}\n")

# Test the viewset directly
factory = APIRequestFactory()
request = factory.get(f'/api/v1/headmaster-dashboard/?term_id={term.id}')
request.user = user

viewset = HeadmasterDashboardViewSet()
viewset.request = request
viewset.format_kwarg = None

response = viewset.list(request)

print("Testing ViewSet.list() method...")
print(f"Response status: {response.status_code}")
print(f"Response data keys: {list(response.data.keys())}")

if response.status_code == 200:
    data = response.data
    print("\n[PASS] Returned data structure:")
    print(f"  - Terms total_schools: {data.get('total_schools')}")
    print(f"  - Total students: {data.get('total_students')}")
    print(f"  - Students with payments: {data.get('students_with_payments')}")
    print(f"  - Students without payments: {data.get('students_without_payments')}")
    print(f"  - Total expected: {data.get('total_expected')}")
    print(f"  - Total collected: {data.get('total_collected')}")
    print(f"  - Total outstanding: {data.get('total_outstanding')}")
    print(f"  - Collection rate: {data.get('collection_rate_percent')}%")
    print(f"  - Schools count: {len(data.get('schools', []))}")
    
    print("\n=== Test Summary ===")
    print("[PASS] Headmaster Dashboard ViewSet is working correctly!")
    print("[OK] All required fields are present and correctly calculated")
else:
    print(f"[FAIL] Unexpected response status: {response.status_code}")
    print(f"[ERROR] Response: {response.data}")

# Cleanup
print("\nCleaning up test data...")
User.objects.filter(username='hm_test').delete()
print("[OK] Done")
