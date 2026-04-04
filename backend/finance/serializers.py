from rest_framework import serializers
from django.db.models import Sum
from django.contrib.auth.models import User
from .models import School, ClassLevel, Term, FeeStructure, Student, Payment, UserRole
from rest_framework_simplejwt.tokens import RefreshToken


class UserRegistrationSerializer(serializers.ModelSerializer):
    school_name = serializers.CharField(write_only=True)
    password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(
        choices=UserRole.ROLE_CHOICES,
        default='BURSAR',
        required=False,
        write_only=True
    )

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'school_name', 'role']

    def create(self, validated_data):
        school_name = validated_data.pop('school_name')
        password = validated_data.pop('password')
        role = validated_data.pop('role', 'BURSAR')
        
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        
        # Create the associated school
        school = School.objects.create(name=school_name, created_by=user)
        
        # Create user role with specified role
        UserRole.objects.create(user=user, school=school, role=role)
        
        return user


class ParentPINSerializer(serializers.Serializer):
    """Serializer for parent PIN-based authentication"""
    student_id = serializers.IntegerField(write_only=True)
    pin_code = serializers.CharField(max_length=6, write_only=True)
    
    # Read-only fields returned after successful auth
    access = serializers.CharField(read_only=True)
    refresh = serializers.CharField(read_only=True)
    student_name = serializers.CharField(read_only=True)
    parent_name = serializers.CharField(read_only=True)

    def validate(self, data):
        student_id = data.get('student_id')
        pin_code = data.get('pin_code')

        try:
            student = Student.objects.get(id=student_id)
        except Student.DoesNotExist:
            raise serializers.ValidationError("Student not found")

        # Find parent with this PIN and student
        parent_role = UserRole.objects.filter(
            student=student,
            role='PARENT',
            pin_code=pin_code
        ).first()

        if not parent_role:
            raise serializers.ValidationError("Invalid PIN code or not a parent of this student")

        # Generate JWT tokens
        refresh = RefreshToken.for_user(parent_role.user)
        
        return {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'student_name': f"{student.first_name} {student.last_name}",
            'parent_name': f"{parent_role.user.first_name or parent_role.user.username}",
            'student_id': student_id
        }


class UserRoleSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.CharField(source='user.email', read_only=True)
    school_name = serializers.CharField(source='school.name', read_only=True)
    student_name = serializers.SerializerMethodField()

    class Meta:
        model = UserRole
        fields = ['id', 'username', 'email', 'role', 'school', 'school_name', 'student', 'student_name', 'pin_code']
        read_only_fields = ['id', 'username', 'email']

    def get_student_name(self, obj):
        if obj.student:
            return f"{obj.student.first_name} {obj.student.last_name}"
        return None


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


from .models import Notification, NotificationPreference


class NotificationSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = Notification
        fields = [
            'id', 'user', 'user_name', 'notification_type', 'channel', 
            'subject', 'message', 'status', 'recipient', 'sent_at', 
            'delivery_id', 'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'sent_at', 'delivery_id']


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = NotificationPreference
        fields = [
            'id', 'user', 'user_name', 'payment_sms', 'payment_email',
            'outstanding_fees_email', 'weekly_summary_email', 
            'report_email', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


# Enhanced Parent Portal Serializers
class ParentMessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.CharField(source='sender.username', read_only=True, allow_null=True)
    student_name = serializers.CharField(source='student.first_name', read_only=True)
    
    class Meta:
        from .models import ParentMessage
        model = ParentMessage
        fields = [
            'id', 'student', 'student_name', 'sender_role', 'sender', 'sender_username',
            'message_type', 'subject', 'message', 'status', 'read_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'read_at']


class PaymentAlertSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.first_name', read_only=True)
    term_name = serializers.CharField(source='term.name', read_only=True)
    
    class Meta:
        from .models import PaymentAlert
        model = PaymentAlert
        fields = [
            'id', 'student', 'student_name', 'term', 'term_name',
            'outstanding_amount', 'status', 'sent_via_sms', 'sent_via_email',
            'acknowledged_at', 'resolved_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class BankStatementSerializer(serializers.ModelSerializer):
    school_name = serializers.CharField(source='school.name', read_only=True)
    term_name = serializers.CharField(source='term.name', read_only=True)
    uploaded_by_username = serializers.CharField(source='uploaded_by.username', read_only=True, allow_null=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        from .models import BankStatement
        model = BankStatement
        fields = [
            'id', 'school', 'school_name', 'term', 'term_name',
            'statement_date', 'file_name', 'file_path',
            'total_amount', 'transaction_count', 'status', 'status_display',
            'uploaded_by', 'uploaded_by_username', 'uploaded_at', 'processed_at'
        ]
        read_only_fields = ['id', 'uploaded_at', 'processed_at', 'status_display', 'uploaded_by_username']


class PaymentReconciliationSerializer(serializers.ModelSerializer):
    bank_transaction_id_display = serializers.CharField(source='bank_transaction_id', read_only=True)
    payment_reference = serializers.CharField(source='payment.reference_number', read_only=True, allow_null=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    matched_by_username = serializers.CharField(source='matched_by.username', read_only=True, allow_null=True)
    
    class Meta:
        from .models import PaymentReconciliation
        model = PaymentReconciliation
        fields = [
            'id', 'bank_statement', 'payment',
            'bank_transaction_id', 'bank_transaction_id_display',
            'bank_amount', 'bank_date', 'bank_reference', 'bank_description',
            'payment_reference', 'matched_amount', 'amount_difference',
            'status', 'status_display', 'confidence_score',
            'matched_by', 'matched_by_username', 'matched_at',
            'notes', 'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'status_display',
            'matched_by_username', 'payment_reference', 'bank_transaction_id_display'
        ]


class ReconciliationDiscrepancySerializer(serializers.ModelSerializer):
    discrepancy_type_display = serializers.CharField(source='get_discrepancy_type_display', read_only=True)
    severity_display = serializers.CharField(source='get_severity_display', read_only=True)
    bank_transaction_id = serializers.CharField(
        source='reconciliation.bank_transaction_id', read_only=True
    )
    
    class Meta:
        from .models import ReconciliationDiscrepancy
        model = ReconciliationDiscrepancy
        fields = [
            'id', 'reconciliation', 'bank_transaction_id',
            'discrepancy_type', 'discrepancy_type_display',
            'severity', 'severity_display',
            'description', 'suggested_action',
            'is_resolved', 'resolution_notes', 'resolved_at',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at',
            'discrepancy_type_display', 'severity_display', 'bank_transaction_id'
        ]


class SMSReminderConfigurationSerializer(serializers.ModelSerializer):
    school_name = serializers.CharField(source='school.name', read_only=True)
    trigger_type_display = serializers.CharField(source='get_trigger_type_display', read_only=True)
    
    class Meta:
        from .models import SMSReminderConfiguration
        model = SMSReminderConfiguration
        fields = [
            'id', 'school', 'school_name',
            'is_enabled', 'trigger_type', 'trigger_type_display',
            'days_before_due', 'max_daily_reminders',
            'message_template', 'send_time', 'send_days',
            'sms_cost_per_unit', 'monthly_budget',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'school_name', 'trigger_type_display']


class SMSReminderSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.first_name', read_only=True)
    term_name = serializers.CharField(source='term.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        from .models import SMSReminder
        model = SMSReminder
        fields = [
            'id', 'school', 'student', 'student_name', 'term', 'term_name',
            'recipient_phone', 'recipient_type',
            'outstanding_amount', 'due_date',
            'message_content', 'status', 'status_display',
            'scheduled_send_time', 'sent_at',
            'error_message', 'retry_count',
            'created_at', 'updated_at'
        ]
        read_only_fields = [
            'id', 'created_at', 'updated_at', 'status_display',
            'student_name', 'term_name', 'sent_at', 'error_message'
        ]


class SMSReminderHistorySerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.first_name', read_only=True)
    term_name = serializers.CharField(source='term.name', read_only=True)
    recipient_type_display = serializers.CharField(source='get_recipient_type_display', read_only=True)
    
    class Meta:
        from .models import SMSReminderHistory
        model = SMSReminderHistory
        fields = [
            'id', 'school', 'student', 'student_name', 'term', 'term_name',
            'recipient_phone', 'recipient_type', 'recipient_type_display',
            'message_sent', 'amount_reminded',
            'sms_gateway_response', 'gateway_message_id',
            'cost', 'sent_at'
        ]
        read_only_fields = [
            'id', 'cost', 'sent_at', 'student_name', 'term_name', 'recipient_type_display'
        ]


class SMSReminderTemplateSerializer(serializers.ModelSerializer):
    school_name = serializers.CharField(source='school.name', read_only=True)
    
    class Meta:
        from .models import SMSReminderTemplate
        model = SMSReminderTemplate
        fields = [
            'id', 'school', 'school_name',
            'name', 'description', 'message_template',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'school_name']


class DashboardWidgetSerializer(serializers.ModelSerializer):
    widget_type_display = serializers.CharField(source='get_widget_type_display', read_only=True)
    role_display = serializers.CharField(source='get_role_display', read_only=True)
    
    class Meta:
        from .models import DashboardWidget
        model = DashboardWidget
        fields = [
            'id', 'school', 'role', 'role_display',
            'widget_type', 'widget_type_display',
            'is_enabled', 'order',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'widget_type_display', 'role_display']


class DashboardPreferenceSerializer(serializers.ModelSerializer):
    user_username = serializers.CharField(source='user.username', read_only=True)
    school_name = serializers.CharField(source='school.name', read_only=True)
    
    class Meta:
        from .models import DashboardPreference
        model = DashboardPreference
        fields = [
            'id', 'user', 'user_username', 'school', 'school_name',
            'theme', 'columns', 'hidden_widgets', 'widget_order',
            'show_notifications', 'notification_frequency',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'user_username', 'school_name']


class DashboardAlertSerializer(serializers.ModelSerializer):
    alert_type_display = serializers.CharField(source='get_alert_type_display', read_only=True)
    severity_display = serializers.CharField(source='get_severity_display', read_only=True)
    target_role_display = serializers.CharField(source='get_target_role_display', read_only=True, allow_null=True)
    target_user_username = serializers.CharField(source='target_user.username', read_only=True, allow_null=True)
    
    class Meta:
        from .models import DashboardAlert
        model = DashboardAlert
        fields = [
            'id', 'school',
            'alert_type', 'alert_type_display',
            'severity', 'severity_display',
            'title', 'message',
            'target_role', 'target_role_display',
            'target_user', 'target_user_username',
            'action_url', 'is_read', 'read_at',
            'is_dismissed', 'dismissed_at',
            'created_at', 'expires_at'
        ]
        read_only_fields = [
            'id', 'created_at', 'alert_type_display',
            'severity_display', 'target_role_display', 'target_user_username'
        ]


class AuditLogSerializer(serializers.Serializer):
    """Serializer for audit log entries"""
    id = serializers.IntegerField(read_only=True)
    action = serializers.CharField()
    action_display = serializers.SerializerMethodField()
    entity_type = serializers.CharField()
    entity_type_display = serializers.SerializerMethodField()
    entity_id = serializers.IntegerField()
    entity_name = serializers.SerializerMethodField()
    performed_by = serializers.SerializerMethodField()
    old_values = serializers.JSONField()
    new_values = serializers.JSONField()
    description = serializers.CharField()
    timestamp = serializers.DateTimeField()
    timestamp_display = serializers.SerializerMethodField()
    
    def get_action_display(self, obj):
        return dict(obj.ACTION_TYPES).get(obj.action, obj.action)
    
    def get_entity_type_display(self, obj):
        entity_choices = {
            'REFUND': 'Refund',
            'REVERSAL': 'Reversal',
            'PAYMENT': 'Payment',
            'STUDENT': 'Student',
            'USER': 'User',
            'SCHOOL': 'School',
            'TERM': 'Term',
            'FEE_STRUCTURE': 'Fee Structure',
            'CLASS': 'Class Level',
            'SMS_CONFIG': 'SMS Configuration',
            'SMS_REMINDER': 'SMS Reminder',
            'RECONCILIATION': 'Reconciliation',
            'BANK_STATEMENT': 'Bank Statement',
            'DASHBOARD_WIDGET': 'Dashboard Widget',
            'NOTIFICATION': 'Notification'
        }
        return entity_choices.get(obj.entity_type, obj.entity_type)
    
    def get_entity_name(self, obj):
        """Get human-readable name of changed entity"""
        if 'name' in obj.new_values:
            return obj.new_values.get('name', 'N/A')
        if 'first_name' in obj.new_values and 'last_name' in obj.new_values:
            return f"{obj.new_values.get('first_name', '')} {obj.new_values.get('last_name', '')}"
        return f"ID: {obj.entity_id}"
    
    def get_performed_by(self, obj):
        if obj.performed_by:
            return {
                'id': obj.performed_by.id,
                'username': obj.performed_by.username,
                'email': obj.performed_by.email,
                'full_name': f"{obj.performed_by.first_name} {obj.performed_by.last_name}" or obj.performed_by.username
            }
        return None
    
    def get_timestamp_display(self, obj):
        return obj.timestamp.strftime('%Y-%m-%d %H:%M:%S')

