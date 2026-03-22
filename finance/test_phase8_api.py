"""
Phase 8 API Endpoints Testing
Tests all new Phase 8 endpoints: Reporting, Analytics, Currency, and Refunds
"""
import os
import sys
import django
import json

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from django.test import Client
from datetime import datetime, timedelta
from django.utils import timezone

from finance.models import School, Term, Student, Stream, FeeGroup, FeeStructure, Payment
from finance.reporting_models import ReportTemplate, ScheduledReport
from finance.analytics_models import PaymentAnalytic
from finance.currency_models import Currency, SchoolCurrency
from finance.refund_models import Refund

class PhaseEightAPITester:
    """Test all Phase 8 API endpoints"""
    
    def __init__(self):
        self.client = Client()
        self.base_url = 'http://localhost:8000/api/v1'
        self.setup_test_data()
    
    def setup_test_data(self):
        """Create test data"""
        print("📦 Setting up test data...")
        
        # Create test user
        self.user = User.objects.filter(username='testbursar').first()
        if not self.user:
            self.user = User.objects.create_user(
                username='testbursar',
                email='bursar@test.com',
                password='testpass123'
            )
        
        # Create test school
        self.school = School.objects.filter(name='Test Academy').first()
        if not self.school:
            self.school = School.objects.create(
                name='Test Academy',
                address='123 School Lane'
            )
        
        # Create test term
        self.term = Term.objects.filter(school=self.school, name='Term 1 2026').first()
        if not self.term:
            self.term = Term.objects.create(
                school=self.school,
                name='Term 1 2026',
                start_date=datetime.now().date(),
                end_date=datetime.now().date() + timedelta(days=90),
                is_current=True
            )
        
        # Create currencies
        for code, name in [('KES', 'Kenyan Shilling'), ('USD', 'US Dollar'), ('EUR', 'Euro')]:
            Currency.objects.get_or_create(
                code=code,
                defaults={'name': name, 'symbol': '$' if code == 'USD' else '€' if code == 'EUR' else 'KES'}
            )
        
        # Create school currency config
        primary = Currency.objects.get(code='KES')
        SchoolCurrency.objects.get_or_create(
            school=self.school,
            defaults={'primary_currency': primary}
        )
        
        print("✅ Test data ready")
    
    def test_reporting_endpoints(self):
        """Test reporting endpoints"""
        print("\n📊 Testing Reporting Endpoints...")
        tests_passed = 0
        tests_total = 0
        
        # Test 1: Create Report Template
        tests_total += 1
        try:
            template_data = {
                'school': self.school.id,
                'report_type': 'PAYMENT_SUMMARY',
                'recipients': 'bursar@test.com,principal@test.com',
                'frequency': 'WEEKLY',
                'enabled': True
            }
            response = self.client.post(
                f'{self.base_url}/report-templates/',
                data=json.dumps(template_data),
                content_type='application/json',
                HTTP_AUTHORIZATION=f'Bearer {self._get_token()}'
            )
            if response.status_code in [201, 200]:
                print(f"  ✅ Create Report Template: {response.status_code}")
                tests_passed += 1
            else:
                print(f"  ❌ Create Report Template: {response.status_code} - {response.content}")
        except Exception as e:
            print(f"  ❌ Create Report Template Error: {str(e)}")
        
        # Test 2: List Report Templates
        tests_total += 1
        try:
            response = self.client.get(
                f'{self.base_url}/report-templates/',
                HTTP_AUTHORIZATION=f'Bearer {self._get_token()}'
            )
            if response.status_code == 200:
                print(f"  ✅ List Report Templates: {response.status_code}")
                tests_passed += 1
            else:
                print(f"  ❌ List Report Templates: {response.status_code}")
        except Exception as e:
            print(f"  ❌ List Report Templates Error: {str(e)}")
        
        # Test 3: List Report Customizations
        tests_total += 1
        try:
            response = self.client.get(
                f'{self.base_url}/report-customizations/',
                HTTP_AUTHORIZATION=f'Bearer {self._get_token()}'
            )
            if response.status_code == 200:
                print(f"  ✅ List Report Customizations: {response.status_code}")
                tests_passed += 1
            else:
                print(f"  ❌ List Report Customizations: {response.status_code}")
        except Exception as e:
            print(f"  ❌ List Report Customizations Error: {str(e)}")
        
        return tests_passed, tests_total
    
    def test_analytics_endpoints(self):
        """Test analytics endpoints"""
        print("\n📈 Testing Analytics Endpoints...")
        tests_passed = 0
        tests_total = 0
        
        # Test 1: List Payment Analytics
        tests_total += 1
        try:
            response = self.client.get(
                f'{self.base_url}/payment-analytics/',
                HTTP_AUTHORIZATION=f'Bearer {self._get_token()}'
            )
            if response.status_code == 200:
                print(f"  ✅ List Payment Analytics: {response.status_code}")
                tests_passed += 1
            else:
                print(f"  ❌ List Payment Analytics: {response.status_code}")
        except Exception as e:
            print(f"  ❌ List Payment Analytics Error: {str(e)}")
        
        # Test 2: Analytics Summary
        tests_total += 1
        try:
            response = self.client.get(
                f'{self.base_url}/payment-analytics/summary/?school={self.school.id}&term={self.term.id}',
                HTTP_AUTHORIZATION=f'Bearer {self._get_token()}'
            )
            if response.status_code == 200:
                print(f"  ✅ Analytics Summary: {response.status_code}")
                tests_passed += 1
            else:
                print(f"  ❌ Analytics Summary: {response.status_code}")
        except Exception as e:
            print(f"  ❌ Analytics Summary Error: {str(e)}")
        
        # Test 3: List Payment Forecasts
        tests_total += 1
        try:
            response = self.client.get(
                f'{self.base_url}/payment-forecasts/',
                HTTP_AUTHORIZATION=f'Bearer {self._get_token()}'
            )
            if response.status_code == 200:
                print(f"  ✅ List Payment Forecasts: {response.status_code}")
                tests_passed += 1
            else:
                print(f"  ❌ List Payment Forecasts: {response.status_code}")
        except Exception as e:
            print(f"  ❌ List Payment Forecasts Error: {str(e)}")
        
        # Test 4: List Payment Method Trends
        tests_total += 1
        try:
            response = self.client.get(
                f'{self.base_url}/payment-method-trends/',
                HTTP_AUTHORIZATION=f'Bearer {self._get_token()}'
            )
            if response.status_code == 200:
                print(f"  ✅ List Payment Method Trends: {response.status_code}")
                tests_passed += 1
            else:
                print(f"  ❌ List Payment Method Trends: {response.status_code}")
        except Exception as e:
            print(f"  ❌ List Payment Method Trends Error: {str(e)}")
        
        return tests_passed, tests_total
    
    def test_currency_endpoints(self):
        """Test currency endpoints"""
        print("\n💱 Testing Currency Endpoints...")
        tests_passed = 0
        tests_total = 0
        
        # Test 1: List Currencies
        tests_total += 1
        try:
            response = self.client.get(
                f'{self.base_url}/currencies/',
                HTTP_AUTHORIZATION=f'Bearer {self._get_token()}'
            )
            if response.status_code == 200:
                print(f"  ✅ List Currencies: {response.status_code}")
                tests_passed += 1
            else:
                print(f"  ❌ List Currencies: {response.status_code}")
        except Exception as e:
            print(f"  ❌ List Currencies Error: {str(e)}")
        
        # Test 2: List Exchange Rates
        tests_total += 1
        try:
            response = self.client.get(
                f'{self.base_url}/exchange-rates/',
                HTTP_AUTHORIZATION=f'Bearer {self._get_token()}'
            )
            if response.status_code == 200:
                print(f"  ✅ List Exchange Rates: {response.status_code}")
                tests_passed += 1
            else:
                print(f"  ❌ List Exchange Rates: {response.status_code}")
        except Exception as e:
            print(f"  ❌ List Exchange Rates Error: {str(e)}")
        
        # Test 3: List School Currencies
        tests_total += 1
        try:
            response = self.client.get(
                f'{self.base_url}/school-currencies/',
                HTTP_AUTHORIZATION=f'Bearer {self._get_token()}'
            )
            if response.status_code == 200:
                print(f"  ✅ List School Currencies: {response.status_code}")
                tests_passed += 1
            else:
                print(f"  ❌ List School Currencies: {response.status_code}")
        except Exception as e:
            print(f"  ❌ List School Currencies Error: {str(e)}")
        
        # Test 4: List Multi-Currency Payments
        tests_total += 1
        try:
            response = self.client.get(
                f'{self.base_url}/multi-currency-payments/',
                HTTP_AUTHORIZATION=f'Bearer {self._get_token()}'
            )
            if response.status_code == 200:
                print(f"  ✅ List Multi-Currency Payments: {response.status_code}")
                tests_passed += 1
            else:
                print(f"  ❌ List Multi-Currency Payments: {response.status_code}")
        except Exception as e:
            print(f"  ❌ List Multi-Currency Payments Error: {str(e)}")
        
        return tests_passed, tests_total
    
    def test_refund_endpoints(self):
        """Test refund endpoints"""
        print("\n💰 Testing Refund Endpoints...")
        tests_passed = 0
        tests_total = 0
        
        # Test 1: List Refunds
        tests_total += 1
        try:
            response = self.client.get(
                f'{self.base_url}/refunds/',
                HTTP_AUTHORIZATION=f'Bearer {self._get_token()}'
            )
            if response.status_code == 200:
                print(f"  ✅ List Refunds: {response.status_code}")
                tests_passed += 1
            else:
                print(f"  ❌ List Refunds: {response.status_code}")
        except Exception as e:
            print(f"  ❌ List Refunds Error: {str(e)}")
        
        # Test 2: List Payment Reversals
        tests_total += 1
        try:
            response = self.client.get(
                f'{self.base_url}/payment-reversals/',
                HTTP_AUTHORIZATION=f'Bearer {self._get_token()}'
            )
            if response.status_code == 200:
                print(f"  ✅ List Payment Reversals: {response.status_code}")
                tests_passed += 1
            else:
                print(f"  ❌ List Payment Reversals: {response.status_code}")
        except Exception as e:
            print(f"  ❌ List Payment Reversals Error: {str(e)}")
        
        # Test 3: List Refund Notifications
        tests_total += 1
        try:
            response = self.client.get(
                f'{self.base_url}/refund-notifications/',
                HTTP_AUTHORIZATION=f'Bearer {self._get_token()}'
            )
            if response.status_code == 200:
                print(f"  ✅ List Refund Notifications: {response.status_code}")
                tests_passed += 1
            else:
                print(f"  ❌ List Refund Notifications: {response.status_code}")
        except Exception as e:
            print(f"  ❌ List Refund Notifications Error: {str(e)}")
        
        # Test 4: List Audit Logs
        tests_total += 1
        try:
            response = self.client.get(
                f'{self.base_url}/audit-logs/',
                HTTP_AUTHORIZATION=f'Bearer {self._get_token()}'
            )
            if response.status_code == 200:
                print(f"  ✅ List Audit Logs: {response.status_code}")
                tests_passed += 1
            else:
                print(f"  ❌ List Audit Logs: {response.status_code}")
        except Exception as e:
            print(f"  ❌ List Audit Logs Error: {str(e)}")
        
        return tests_passed, tests_total
    
    def _get_token(self):
        """Get JWT token for authentication (using basic auth for now)"""
        # For testing, we'll use basic auth or token auth
        # This is a placeholder - in real tests use proper authentication
        return "test_token"
    
    def run_all_tests(self):
        """Run all tests"""
        print("=" * 60)
        print("🧪 PHASE 8 API ENDPOINTS TEST SUITE")
        print("=" * 60)
        
        t1_pass, t1_total = self.test_reporting_endpoints()
        t2_pass, t2_total = self.test_analytics_endpoints()
        t3_pass, t3_total = self.test_currency_endpoints()
        t4_pass, t4_total = self.test_refund_endpoints()
        
        total_passed = t1_pass + t2_pass + t3_pass + t4_pass
        total_tests = t1_total + t2_total + t3_total + t4_total
        
        print("\n" + "=" * 60)
        print(f"📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Reporting:   {t1_pass}/{t1_total} tests passed")
        print(f"Analytics:   {t2_pass}/{t2_total} tests passed")
        print(f"Currency:    {t3_pass}/{t3_total} tests passed")
        print(f"Refunds:     {t4_pass}/{t4_total} tests passed")
        print("-" * 60)
        print(f"TOTAL:       {total_passed}/{total_tests} tests passed")
        print("=" * 60)
        
        if total_passed == total_tests:
            print("✅ ALL TESTS PASSED!")
            return True
        else:
            print(f"⚠️  {total_tests - total_passed} tests failed")
            return False

if __name__ == '__main__':
    tester = PhaseEightAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)
