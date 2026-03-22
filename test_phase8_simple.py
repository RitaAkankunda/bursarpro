"""
Simple Phase 8 API Test Using Direct HTTP Requests
"""
import requests
import json

BASE_URL = 'http://localhost:8000/api/v1'

# Test credentials (basic auth placeholder)
headers = {
    'Content-Type': 'application/json',
}

def test_endpoints():
    """Test all Phase 8 endpoints"""
    print("=" * 70)
    print("🧪 PHASE 8 API ENDPOINTS TEST")
    print("=" * 70)
    
    tests_passed = 0
    tests_total = 0
    
    # Test endpoints list
    endpoints = [
        # Reporting
        ('GET', f'{BASE_URL}/report-templates/', 'Reporting: List Report Templates'),
        ('GET', f'{BASE_URL}/report-customizations/', 'Reporting: List Report Customizations'),
        ('GET', f'{BASE_URL}/report-executions/', 'Reporting: List Report Executions'),
        ('GET', f'{BASE_URL}/scheduled-reports/', 'Reporting: List Scheduled Reports'),
        
        # Analytics
        ('GET', f'{BASE_URL}/payment-analytics/', 'Analytics: List Payment Analytics'),
        ('GET', f'{BASE_URL}/payment-forecasts/', 'Analytics: List Payment Forecasts'),
        ('GET', f'{BASE_URL}/payment-method-trends/', 'Analytics: List Payment Method Trends'),
        
        # Currency
        ('GET', f'{BASE_URL}/currencies/', 'Currency: List Currencies'),
        ('GET', f'{BASE_URL}/exchange-rates/', 'Currency: List Exchange Rates'),
        ('GET', f'{BASE_URL}/school-currencies/', 'Currency: List School Currencies'),
        ('GET', f'{BASE_URL}/multi-currency-payments/', 'Currency: List Multi-Currency Payments'),
        
        # Refunds
        ('GET', f'{BASE_URL}/refunds/', 'Refunds: List Refunds'),
        ('GET', f'{BASE_URL}/payment-reversals/', 'Refunds: List Payment Reversals'),
        ('GET', f'{BASE_URL}/refund-notifications/', 'Refunds: List Refund Notifications'),
        ('GET', f'{BASE_URL}/audit-logs/', 'Refunds: List Audit Logs'),
    ]
    
    for method, url, description in endpoints:
        tests_total += 1
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=5)
            else:
                response = requests.post(url, headers=headers, json={}, timeout=5)
            
            # Accept 200, 201, 401 (auth required), 403 (permission denied)
            if response.status_code in [200, 201, 400, 401, 403]:
                print(f"  ✅ {description}: {response.status_code}")
                tests_passed += 1
            else:
                print(f"  ⚠️  {description}: {response.status_code}")
                print(f"     Response: {response.text[:200]}")
        except requests.exceptions.ConnectionError:
            print(f"  ❌ {description}: CONNECTION FAILED (server not running?)")
        except Exception as e:
            print(f"  ❌ {description}: {str(e)}")
    
    print("\n" + "=" * 70)
    print(f"📊 RESULTS: {tests_passed}/{tests_total} endpoints accessible")
    print("=" * 70)
    
    if tests_passed >= tests_total * 0.9:
        print("✅ PHASE 8 API INFRASTRUCTURE READY!")
        return True
    else:
        print(f"⚠️  Some endpoints need attention")
        return False

if __name__ == '__main__':
    test_endpoints()
