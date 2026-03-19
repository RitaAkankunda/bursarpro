from rest_framework import serializers
from django.db.models import Sum
from django.contrib.auth.models import User
from .models import School, ClassLevel, Term, FeeStructure, Student, Payment


class UserRegistrationSerializer(serializers.ModelSerializer):
    school_name = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'school_name']

    def create(self, validated_data):
        school_name = validated_data.pop('school_name')
        password = validated_data.pop('password')
        
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        
        # Create the associated school
        School.objects.create(name=school_name, created_by=user)
        
        return user


class SchoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = '__all__'


class ClassLevelSerializer(serializers.ModelSerializer):
    school_name = serializers.CharField(source='school.name', read_only=True)

    class Meta:
        model = ClassLevel
        fields = ['id', 'school', 'school_name', 'name']


class TermSerializer(serializers.ModelSerializer):
    school_name = serializers.CharField(source='school.name', read_only=True)

    class Meta:
        model = Term
        fields = ['id', 'school', 'school_name', 'name', 'start_date', 'end_date']


class FeeStructureSerializer(serializers.ModelSerializer):
    class_level_name = serializers.CharField(source='class_level.name', read_only=True)
    term_name = serializers.CharField(source='term.name', read_only=True)

    class Meta:
        model = FeeStructure
        fields = ['id', 'term', 'term_name', 'class_level', 'class_level_name', 'amount']


class PaymentSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    term_name = serializers.CharField(source='term.name', read_only=True)
    recorded_by_name = serializers.CharField(source='recorded_by.get_full_name', read_only=True)

    class Meta:
        model = Payment
        fields = [
            'id', 'student', 'student_name', 'term', 'term_name',
            'amount', 'payment_date', 'payment_method',
            'receipt_number', 'recorded_by', 'recorded_by_name', 'created_at'
        ]

    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}"


class StudentSerializer(serializers.ModelSerializer):
    """
    Student serializer with dynamically computed balance for a given term.
    Pass ?term_id=<id> as a query param to get balance for that term.
    """
    class_level_name = serializers.CharField(source='class_level.name', read_only=True)
    school_name = serializers.CharField(source='school.name', read_only=True)
    school = serializers.PrimaryKeyRelatedField(read_only=True)
    full_name = serializers.SerializerMethodField()
    balance = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = [
            'id', 'school', 'school_name', 'class_level', 'class_level_name',
            'first_name', 'last_name', 'full_name', 'student_id',
            'parent_name', 'parent_phone', 'balance'
        ]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

    def get_balance(self, obj):
        """
        Calculates balance for the term_id supplied in the request query params.
        Returns None if no term_id is provided.
        """
        request = self.context.get('request')
        if not request:
            return None

        term_id = request.query_params.get('term_id')
        if not term_id:
            return None

        # Get the applicable fee for this student's class in the given term
        try:
            fee_structure = FeeStructure.objects.get(
                term_id=term_id,
                class_level=obj.class_level
            )
            fee_amount = fee_structure.amount
        except FeeStructure.DoesNotExist:
            return None

        # Sum all payments made by this student in the given term
        total_paid = Payment.objects.filter(
            student=obj, term_id=term_id
        ).aggregate(total=Sum('amount'))['total'] or 0

        return float(fee_amount - total_paid)
