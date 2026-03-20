import os
import django
import requests
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from finance.models import UserRole

BASE_URL = "http://localhost:8000/api/v1"

print("=" * 70)
print("TESTING ROLE SELECTION DURING REGISTRATION")
print("=" * 70)

# Test 1: Register as HEADMASTER
print("\n1️⃣ Registering user as HEADMASTER...")
reg_data = {
    "username": "test_headmaster_1",
    "email": "headmaster@test.com",
    "password": "password123",
    "school_name": "Test School 1",
    "role": "HEADMASTER"
}

response = requests.post(f"{BASE_URL}/auth/register/", json=reg_data)
print(f"   Status: {response.status_code}")

if response.status_code in [200, 201]:
    print(f"   ✅ Registration successful")
    # Check the created role
    user_role = UserRole.objects.filter(user__username="test_headmaster_1").first()
    if user_role:
        print(f"   ✅ Role assigned: {user_role.role}")
        if user_role.role == "HEADMASTER":
            print(f"   ✅ PASS - HEADMASTER role correctly assigned")
        else:
            print(f"   ❌ FAIL - Expected HEADMASTER, got {user_role.role}")
    else:
        print(f"   ❌ No role found for user")
else:
    print(f"   ❌ Registration failed: {response.text}")

# Test 2: Register as ACCOUNTANT
print("\n2️⃣ Registering user as ACCOUNTANT...")
reg_data = {
    "username": "test_accountant_2",
    "email": "accountant2@test.com",
    "password": "password123",
    "school_name": "Test School 2",
    "role": "ACCOUNTANT"
}

response = requests.post(f"{BASE_URL}/auth/register/", json=reg_data)
print(f"   Status: {response.status_code}")

if response.status_code in [200, 201]:
    print(f"   ✅ Registration successful")
    user_role = UserRole.objects.filter(user__username="test_accountant_2").first()
    if user_role:
        print(f"   ✅ Role assigned: {user_role.role}")
        if user_role.role == "ACCOUNTANT":
            print(f"   ✅ PASS - ACCOUNTANT role correctly assigned")
        else:
            print(f"   ❌ FAIL - Expected ACCOUNTANT, got {user_role.role}")
    else:
        print(f"   ❌ No role found for user")
else:
    print(f"   ❌ Registration failed: {response.text}")

# Test 3: Register without role (should default to BURSAR)
print("\n3️⃣ Registering user without role (should default to BURSAR)...")
reg_data = {
    "username": "test_default_role",
    "email": "default@test.com",
    "password": "password123",
    "school_name": "Test School 3"
}

response = requests.post(f"{BASE_URL}/auth/register/", json=reg_data)
print(f"   Status: {response.status_code}")

if response.status_code in [200, 201]:
    print(f"   ✅ Registration successful")
    user_role = UserRole.objects.filter(user__username="test_default_role").first()
    if user_role:
        print(f"   ✅ Role assigned: {user_role.role}")
        if user_role.role == "BURSAR":
            print(f"   ✅ PASS - Default BURSAR role correctly assigned")
        else:
            print(f"   ❌ FAIL - Expected BURSAR, got {user_role.role}")
    else:
        print(f"   ❌ No role found for user")
else:
    print(f"   ❌ Registration failed: {response.text}")

print("\n" + "=" * 70)
print("REGISTRATION TESTS COMPLETE")
print("=" * 70)
