from django.contrib import admin
from .models import School, ClassLevel, Term, FeeStructure, Student, Payment

admin.site.register(School)
admin.site.register(ClassLevel)
admin.site.register(Term)
admin.site.register(FeeStructure)
admin.site.register(Student)
admin.site.register(Payment)
