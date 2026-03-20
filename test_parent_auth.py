import os
import django
import requests
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from finance.models import School, Student, ClassLevel, Term, UserRole, FeeStructure, Payment
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000/api/v1"

print("=" * 70)
print("TESTING PARENT PIN AUTHENTICATION")
print("=" * 70)

# Setup: Create test data
print("\n1️⃣ Setting up parent and student...")

# Create parent user
parent_user, _ = User.objects.get_or_create(
    username='parent_test_1',
    defaults={'email': 'parent1@test.com', 'first_name': 'John', 'last_name': 'Doe'}
)
if _:
    parent_user.set_password('password123')
    parent_user.save()
    print(f"   ✅ Created parent user: parent_test_1")
else:
    print(f"   ℹ️  Parent user exists: parent_test_1")

# Get or create school
bursar_user, _ = User.objects.get_or_create(
    username='bursar_for_parent_test',
    defaults={'email': 'bursar@test.com'}
)
if _:
    bursar_user.set_password('password123')
    bursar_user.save()

school, _ = School.objects.get_or_create(
    name='Parent Test School',
    defaults={'created_by': bursar_user}
)
if _:
    print(f"   ✅ Created school: {school.name}")
else:
    print(f"   ℹ️  School exists: {school.name}")

# Create class level
class_level, _ = ClassLevel.objects.get_or_create(
    school=school,
    name='Form 1',
)
print(f"   ✅ Class level: {class_level.name}")

# Create term
term, _ = Term.objects.get_or_create(
    school=school,
    name='Term 1 2026',
    defaults={
        'start_date': datetime.now().date(),
        'end_date': (datetime.now() + timedelta(days=90)).date()
    }
)
print(f"   ✅ Term: {term.name}")

# Create fee structure
fee_structure, _ = FeeStructure.objects.get_or_create(
    term=term,
    class_level=class_level,
    defaults={'amount': 50000}
)
print(f"   ✅ Fee structure: {fee_structure.amount}")

# Create student
student, _ = Student.objects.get_or_create(
    school=school,
    student_id='STU001',
    defaults={
        'first_name': 'John',
        'last_name': 'Junior',
        'parent_name': 'John Doe',
        'parent_phone': '+256703355164',
        'class_level': class_level,
    }
)
if _:
    print(f"   ✅ Created student: {student.first_name} {student.last_name}")
else:
    print(f"   ℹ️  Student exists: {student.first_name} {student.last_name}")

# Create parent role with PIN
parent_role, _ = UserRole.objects.get_or_create(
    user=parent_user,
    defaults={
        'role': 'PARENT',
        'school': school,
        'student': student,
        'pin_code': '1234'
    }
)
if _:
    print(f"   ✅ Created parent role with PIN: 1234")
else:
    # Update PIN if role already exists
    parent_role.pin_code = '1234'
    parent_role.student = student
    parent_role.save()
    print(f"   ℹ️  Updated parent role PIN: 1234")

# Add some test payments
Payment.objects.filter(student=student, term=term).delete()
test_payment = Payment.objects.create(
    student=student,
    term=term,
    amount=25000,
    receipt_number='REC001',
    recorded_by=bursar_user,
    payment_date=datetime.now()
)
print(f"   ✅ Created test payment: {test_payment.amount}")

# Test 1: Parent authenticates with PIN
print("\n2️⃣ Testing parent PIN authentication...")
auth_data = {
    "student_id": student.id,
    "pin_code": "1234"
}

response = requests.post(f"{BASE_URL}/auth/parent-pin/", json=auth_data)
print(f"   Status: {response.status_code}")

if response.status_code == 200:
    data = response.json()
    parent_token = data.get('access')
    print(f"   ✅ Authentication successful")
    print(f"   📋 Student: {data['student_name']}")
    print(f"   👤 Parent: {data['parent_name']}")
    print(f"   🔑 Token acquired: {parent_token[:30]}...")

    # Test 2: Parent views student balance
    print("\n3️⃣ Testing parent viewing student balance...")
    response = requests.get(
        f"{BASE_URL}/student-balance/",
        headers={'Authorization': f'Bearer {parent_token}'}
    )
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        balance = response.json()
        print(f"   ✅ Balance retrieved")
        print(f"   💰 Expected: {balance['expected_amount']}")
        print(f"   ✓ Paid: {balance['amount_paid']}")
        print(f"   ⚠️  Outstanding: {balance['balance_outstanding']}")
        print(f"   📊 Status: {balance['payment_status']}")
    else:
        print(f"   ❌ Failed: {response.status_code} - {response.text[:200]}")

    # Test 3: Parent views payment history
    print("\n4️⃣ Testing parent viewing payment history...")
    response = requests.get(
        f"{BASE_URL}/student-balance/payment_history/",
        headers={'Authorization': f'Bearer {parent_token}'}
    )
    print(f"   Status: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ Payment history retrieved")
        print(f"   📝 Total payments: {len(data['payments'])}")
        if data['payments']:
            for p in data['payments']:
                print(f"      - Receipt {p['receipt_number']}: {p['amount']} on {p['payment_date']}")
    else:
        print(f"   ❌ Failed: {response.status_code} - {response.text[:200]}")

    # Test 4: Invalid PIN attempt
    print("\n5️⃣ Testing invalid PIN (should fail)...")
    bad_auth = {
        "student_id": student.id,
        "pin_code": "0000"
    }
    response = requests.post(f"{BASE_URL}/auth/parent-pin/", json=bad_auth)
    print(f"   Status: {response.status_code}")
    if response.status_code == 400:
        print(f"   ✅ PASS - Invalid PIN correctly denied")
    else:
        print(f"   ❌ FAIL - Should return 400, got {response.status_code}")

else:
    print(f"   ❌ Authentication failed: {response.status_code}")
    print(f"   Error: {response.text}")

print("\n" + "=" * 70)
print("PARENT AUTHENTICATION TESTS COMPLETE")
print("=" * 70)
