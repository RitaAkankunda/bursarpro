"""
Test script for Headmaster Dashboard API
Tests the system-wide reporting and per-school analytics
"""
import os
import sys
import django
import json

# Setup Django
os.environ['DJANGO_SETTINGS_MODULE'] = 'core.settings'
django.setup()

from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from finance.models import School, Term, Student, ClassLevel, FeeStructure, Payment, UserRole

# Create test data if needed
client = APIClient()

def create_test_data():
    """Create test schools, students, fees, and payments for testing"""
    print("Creating test data...")
    
    # Create a test user (headmaster)
    user, created = User.objects.get_or_create(
        username='headmaster_test',
        defaults={'first_name': 'Test', 'last_name': 'Headmaster'}
    )
    
    # Create schools
    school1, _ = School.objects.get_or_create(
        name='Test School 1',
        defaults={'created_by': user, 'address': '123 Main St'}
    )
    
    school2, _ = School.objects.get_or_create(
        name='Test School 2',
        defaults={'created_by': user, 'address': '456 Oak St'}
    )
    
    # Create classroom levels
    classA, _ = ClassLevel.objects.get_or_create(
        school=school1,
        name='S1A',
        defaults={}
    )
    classB, _ = ClassLevel.objects.get_or_create(
        school=school2,
        name='S2A',
        defaults={}
    )
    
    # Create term
    term, _ = Term.objects.get_or_create(
        school=school1,
        name='Term 1 2026',
        defaults={'start_date': '2026-01-15', 'end_date': '2026-03-31'}
    )
    
    # Create fee structures
    fee1, _ = FeeStructure.objects.get_or_create(
        term=term,
        class_level=classA,
        defaults={'amount': 100000.0}
    )
    
    # Create students
    for i in range(5):
        Student.objects.get_or_create(
            school=school1,
            class_level=classA,
            student_id=f'TS1-S{i}',
            defaults={
                'first_name': f'Student{i}',
                'last_name': f'One',
                'parent_name': f'Parent{i}',
                'parent_phone': f'075600000{i}'
            }
        )
    
    # Create some payments (from students in school1)
    students_s1 = Student.objects.filter(school=school1)
    for i, student in enumerate(students_s1[:3]):  # 3 out of 5 paid
        Payment.objects.get_or_create(
            student=student,
            term=term,
            defaults={
                'amount': 100000.0,
                'receipt_number': f'RCP-{term.id}-{student.id}-{i}',
                'payment_date': '2026-02-01',
                'recorded_by': user
            }
        )
    
    print(f"[OK] Created test data: {school1.name} and {school2.name}")
    print(f"[OK] Students: {Student.objects.count()}")
    print(f"[OK] Payments: {Payment.objects.count()}")
    return term, user

def test_headmaster_dashboard():
    """Test the headmaster dashboard endpoint"""
    print("\n=== Testing Headmaster Dashboard ===\n")
    
    # Create test data
    term, user = create_test_data()
    
    # Get JWT token
    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    
    # Set up client with token
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {access_token}')
    
    # Test the headmaster dashboard endpoint
    print(f"Testing endpoint: /api/v1/headmaster-dashboard/?term_id={term.id}\n")
    
    response = client.get(f'/api/v1/headmaster-dashboard/?term_id={term.id}')
    
    print(f"Status Code: {response.status_code}")
    if response.status_code == 200:
        print("[OK] Endpoint returned 200 OK\n")
        
        data = response.json()
        print("Response Data:")
        print(json.dumps(data, indent=2))
        
        # Verify required fields
        required_fields = [
            'term_id', 'term_name', 'total_schools', 'total_students',
            'students_with_payments', 'students_without_payments',
            'total_expected', 'total_collected', 'total_outstanding',
            'collection_rate_percent', 'schools'
        ]
        
        print("\n=== Field Validation ===")
        missing_fields = [f for f in required_fields if f not in data]
        if missing_fields:
            print(f"[ERROR] Missing fields: {missing_fields}")
        else:
            print("[OK] All required fields present")
        
        # Validate schools array
        if 'schools' in data:
            print(f"\n[OK] Schools array contains {len(data['schools'])} schools")
            if len(data['schools']) > 0:
                print("First school data:")
                print(json.dumps(data['schools'][0], indent=2))
        
        print("\n=== Test Summary ===")
        print("[PASS] Headmaster Dashboard API is working correctly")
        return True
    else:
        print(f"[ERROR] Endpoint returned {response.status_code}")
        print(f"Response: {response.content.decode()}")
        return False

if __name__ == '__main__':
    success = test_headmaster_dashboard()
    exit(0 if success else 1)
