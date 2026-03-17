from django.db import models

class School(models.Model):
    name = models.CharField(max_length=255)
    address = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class ClassLevel(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='classes')
    name = models.CharField(max_length=50) # e.g. "Primary 1", "Senior 1"
    
    def __str__(self):
        return f"{self.school.name} - {self.name}"

class Term(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='terms')
    name = models.CharField(max_length=50) # e.g. "Term 1 2026"
    start_date = models.DateField()
    end_date = models.DateField()

    def __str__(self):
        return f"{self.school.name} - {self.name}"

class FeeStructure(models.Model):
    term = models.ForeignKey(Term, on_delete=models.CASCADE, related_name='fee_structures')
    class_level = models.ForeignKey(ClassLevel, on_delete=models.CASCADE, related_name='fee_structures')
    amount = models.DecimalField(max_digits=10, decimal_places=2) # Max 10 digits, e.g. 99,999,999.99

    def __str__(self):
        return f"{self.class_level.name} ({self.term.name}) - UGX {self.amount}"

class Student(models.Model):
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='students')
    class_level = models.ForeignKey(ClassLevel, on_delete=models.SET_NULL, null=True, related_name='students')
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    student_id = models.CharField(max_length=50, unique=True) # Custom Registration Number
    parent_name = models.CharField(max_length=255)
    parent_phone = models.CharField(max_length=20) # Important for SMS

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.student_id})"

class Payment(models.Model):
    PAYMENT_METHOD_CHOICES = [
        ('CASH', 'Cash'),
        ('MOBILE_MONEY', 'Mobile Money'),
        ('BANK_TRANSFER', 'Bank Transfer'),
    ]

    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='payments')
    term = models.ForeignKey(Term, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateField()
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='CASH')
    receipt_number = models.CharField(max_length=50, unique=True)
    
    # We will import User at the top to track who recorded this!
    # recorded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Receipt {self.receipt_number} - {self.student.first_name} - UGX {self.amount}"
