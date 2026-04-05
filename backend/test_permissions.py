import os
import django
import requests
import json
from datetime import datetime, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from finance.models import School, UserRole

BASE_URL = "http://localhost:8000/api/v1"

def get_token(username, password):
    """Get JWT token for user"""
    response = requests.post(
        f"{BASE_URL}/auth/token/",
        json={"username": username, "password": password}
    )
    if response.status_code == 200:
        return response.json()['access']
    else:
        print(f"❌ Failed to get token for {username}: {response.text}")
        return None

def make_request(method, endpoint, token=None, data=None):
    """Make authenticated API request"""
    headers = {}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    
    url = f"{BASE_URL}{endpoint}"
    
    if method == 'GET':
        response = requests.get(url, headers=headers)
    elif method == 'POST':
        response = requests.post(url, json=data, headers=headers)
    elif method == 'PUT':
        response = requests.put(url, json=data, headers=headers)
    elif method == 'DELETE':
        response = requests.delete(url, headers=headers)
    
    return response

print("=" * 70)
print("TESTING ROLE-BASED ACCESS CONTROL SYSTEM")
print("=" * 70)

# Create test users if they don't exist
print("\n1️⃣ Setting up test users...")

# Create BURSAR user
bursar_user, _ = User.objects.get_or_create(
    username='test_bursar',
    defaults={'email': 'bursar@test.com'}
)
if _:
    bursar_user.set_password('password123')
    bursar_user.save()
    print(f"   ✅ Created BURSAR user: test_bursar")
else:
    print(f"   ℹ️  BURSAR user already exists: test_bursar")

# Get or create school
school, created = School.objects.get_or_create(
    name='Test School',
    defaults={'created_by': bursar_user}
)
if created:
    print(f"   ✅ Created school: {school.name}")
else:
    print(f"   ℹ️  School already exists: {school.name}")

# Set up user roles
bursar_role, _ = UserRole.objects.get_or_create(
    user=bursar_user,
    defaults={'role': 'BURSAR', 'school': school}
)
if not _:
    bursar_role.role = 'BURSAR'
    bursar_role.save()
print(f"   ✅ Assigned BURSAR role to test_bursar")

accountant_role, _ = UserRole.objects.get_or_create(
    user=accountant_user,
    defaults={'role': 'ACCOUNTANT', 'school': school}
)
if not _:
    accountant_role.role = 'ACCOUNTANT'
    accountant_role.save()
print(f"   ✅ Assigned ACCOUNTANT role to test_accountant")

# Get tokens
print("\n2️⃣ Authenticating...")
bursar_token = get_token('test_bursar', 'password123')
accountant_token = get_token('test_accountant', 'password123')

if not bursar_token or not accountant_token:
    print("❌ Failed to get tokens. Exiting.")
    exit(1)

print(f"   ✅ BURSAR token acquired")
print(f"   ✅ ACCOUNTANT token acquired")

# TEST 1: Bursar creates a class level (should succeed)
print("\n3️⃣ Testing WRITE permissions...")
print("\n   Test A: BURSAR creating ClassLevel (should ✅ SUCCEED)")
response = make_request('POST', '/class-levels/', bursar_token, {
    'name': f'Test Class {datetime.now().timestamp()}',
    'school': school.id
})
print(f"   Status: {response.status_code}")
if response.status_code in [200, 201]:
    print(f"   ✅ PASS - BURSAR can create resources")
    class_id = response.json()['id']
else:
    print(f"   ❌ FAIL - {response.status_code}: {response.text[:200]}")
    class_id = None

# TEST 2: Accountant tries to create a class level (should fail)
print("\n   Test B: ACCOUNTANT creating ClassLevel (should ❌ FAIL)")
response = make_request('POST', '/class-levels/', accountant_token, {
    'name': f'Unauthorized Class {datetime.now().timestamp()}',
    'school': school.id
})
print(f"   Status: {response.status_code}")
if response.status_code == 403:
    print(f"   ✅ PASS - ACCOUNTANT correctly denied write access")
elif response.status_code in [200, 201]:
    print(f"   ❌ FAIL - ACCOUNTANT should not be able to write!")
else:
    error_msg = response.json().get('detail', response.text[:200])
    print(f"   ⚠️  Unexpected status: {error_msg}")

# TEST 3: Accountant tries to read (should succeed)
print("\n4️⃣ Testing READ permissions...")
print("\n   Test A: ACCOUNTANT reading ClassLevels (should ✅ SUCCEED)")
response = make_request('GET', f'/class-levels/?school_id={school.id}', accountant_token)
print(f"   Status: {response.status_code}")
if response.status_code == 200:
    print(f"   ✅ PASS - ACCOUNTANT can read resources")
    print(f"   Found {len(response.json())} class levels")
else:
    print(f"   ❌ FAIL - {response.status_code}: {response.text[:200]}")

# TEST 4: User without token tries to access (should fail)
print("\n5️⃣ Testing authorization...")
print("\n   Test A: Unauthenticated access (should ❌ FAIL)")
response = make_request('GET', f'/class-levels/?school_id={school.id}', None)
print(f"   Status: {response.status_code}")
if response.status_code == 401:
    print(f"   ✅ PASS - Unauthenticated access denied")
else:
    print(f"   ❌ FAIL - Should return 401, got {response.status_code}")

# TEST 5: Verify role info (both should be able to read user-roles)
print("\n6️⃣ Testing UserRole endpoint...")
print("\n   Test A: BURSAR accessing user-roles (should see multiple)")
response = make_request('GET', '/user-roles/', bursar_token)
print(f"   Status: {response.status_code}")
if response.status_code == 200:
    roles = response.json()
    results = roles.get('results', roles) if isinstance(roles, dict) else roles
    print(f"   ✅ BURSAR can access user-roles endpoint")
    print(f"   Visible roles: {len(results)}")
else:
    print(f"   ❌ FAIL - {response.status_code}: {response.text[:200]}")

print("\n   Test B: ACCOUNTANT accessing user-roles (should see only own)")
response = make_request('GET', '/user-roles/', accountant_token)
print(f"   Status: {response.status_code}")
if response.status_code == 200:
    roles = response.json()
    results = roles.get('results', roles) if isinstance(roles, dict) else roles
    print(f"   ✅ ACCOUNTANT can access user-roles endpoint")
    print(f"   Visible roles: {len(results)} (should be 1 - only own)")
else:
    print(f"   ❌ FAIL - {response.status_code}: {response.text[:200]}")

print("\n" + "=" * 70)
print("TESTS COMPLETE")
print("=" * 70)
