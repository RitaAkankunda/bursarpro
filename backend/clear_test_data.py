import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from finance.models import Payment, Student, FeeStructure, Term, ClassLevel

def clear_test_data():
    print("Clearing test data...")
    payments_deleted, _ = Payment.objects.all().delete()
    print(f"Deleted {payments_deleted} payments.")

    fees_deleted, _ = FeeStructure.objects.all().delete()
    print(f"Deleted {fees_deleted} fee structures.")

    students_deleted, _ = Student.objects.all().delete()
    print(f"Deleted {students_deleted} students.")

    terms_deleted, _ = Term.objects.all().delete()
    print(f"Deleted {terms_deleted} terms.")

    classes_deleted, _ = ClassLevel.objects.all().delete()
    print(f"Deleted {classes_deleted} class levels.")

    print("Successfully cleared all test data! Your database is now ready for real data.")

if __name__ == '__main__':
    clear_test_data()
